import json
import re
from openai import OpenAI
from dotenv import load_dotenv

### Setup
MODEL_NAME = "Wan2.1"     # model to use
CLIP_DURATION_SEC = 5     # target length of clips to generate

# fps and frame-count constraint for each supported model.
# Wan2.1: 16fps, frame_num must be of the form 4n + 1
MODEL_SETTINGS = {
    "Wan2.1": {"fps": 16.0, "frame_modulus": 4},
}

### Narration pacing estimate (words per second).
WORDS_PER_SECOND = 3 # average speed

### Set render style (texture, etc.)
RENDER_STYLES = {
    "minimal_geometric": (
        "Render this as a minimalist flat-design illustration using simple geometric "
        "shapes (circles, squares, lines, dots) on a plain dark or neutral background. "
        "Avoid photorealistic textures, lighting, or camera lensing effects -- this should "
        "look like a clean vector graphic or motion-graphics diagram, not real footage."
    ),
}

### On-screen keyword rendering
# Tested 2026-07-15 on 2 real generated clips ("Transformer architecture",
# "Self-attention") at 1.3B/480p with reuse+25steps+MagCache K4: text came out
# garbled/illegible in both (e.g. "Transformer architecture" -> "Tomerr
# aannrngttle"), consistently from the first frame onward -- not a MagCache
# artifact, just Wan2.1 not rendering short titles legibly at this model
# size/resolution. Keeping the logic in place (it's correct) but OFF by
# default until tested again on a bigger model/higher resolution.
ENABLE_ON_SCREEN_KEYWORDS = False

### Load script_output.json ###
script = "output_sample/cs350_llm/script_output.json"

with open(script, "r") as f:
    script_data = json.load(f)


############### Split transcript into clip-sized chunks ###############
def split_into_clip_chunks(text, target_duration_sec=CLIP_DURATION_SEC):
    """
    Split a block of narration text into chunks sized for individual clips, respecting sentence boundaries rather than cutting mid-sentence.
    Returns a list of (chunk_text, estimated_duration_sec) tuples.
    """
    # split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    target_words = target_duration_sec * WORDS_PER_SECOND

    chunks = []
    current_sentences = []
    current_word_count = 0

    for sentence in sentences:
        word_count = len(sentence.split()) # Check word count in each sentence
        # If adding this sentence would overshoot the target by too much, close out the current chunk first.
        # 1.3 - 30% overshoot allows room to prefer a clean semantic break over a length limit
        if current_sentences and (current_word_count + word_count) > target_words * 1.3:
            chunk_text = " ".join(current_sentences)
            chunks.append((chunk_text, current_word_count / WORDS_PER_SECOND)) # append as a tuple of ("text finalized", estimated time)

            # Reset variables
            current_sentences = []
            current_word_count = 0

        # If there's room for another sentence - simply add it
        current_sentences.append(sentence)
        current_word_count += word_count

    if current_sentences:
        chunk_text = " ".join(current_sentences)
        chunks.append((chunk_text, current_word_count / WORDS_PER_SECOND))

    return chunks


############### Get Frame Count ###############
def frames_for_duration(duration_sec, model_name=MODEL_NAME):
    """
    Convert a target duration (in seconds) into a frame count the given model actually accepts (of the form modulus * n + 1).
    Returns (frame_num, actual_duration_sec produced by that frame count).
    """
    settings = MODEL_SETTINGS[model_name]
    fps = settings["fps"]
    modulus = settings["frame_modulus"]

    raw_frames = duration_sec * fps
    n = round((raw_frames - 1) / modulus)
    n = max(n, 0)  # never go below 1 frame
    frame_num = modulus * n + 1

    actual_duration_sec = frame_num / fps
    return frame_num, actual_duration_sec


############### Find Keywords to Render ###############
def find_new_key_point(chunk_text, key_points, already_shown):
    """
    Return the first keyword (from `keywords`) that appears in chunk_text and hasn't already been shown earlier in this section.
    Returns None if this chunk doesn't introduce any new keyword.
    """
    lowered = chunk_text.lower()
    for kp in key_points:
        if kp.lower() in lowered and kp not in already_shown:
            return kp
    return None


############### Produce Visual Prompt ###############
'''
Prompt generation is parameterized by model name and clip duration, 
so switching models or adjusting clip length doesn't require editing the prompt text itself.
'''

def gen_visual_prompt_4chunk(
    sub,
    model_name=MODEL_NAME,
    clip_duration_sec=CLIP_DURATION_SEC,
    on_screen_key_points=None,
    render_style="minimal_geometric",       # default
    section_context=None,
    chunk_position=None,                    # order in section
    previous_visual_prompt=None,            # for the continuity
):
    # if clip is short, focus on a single state or moment, not motion
    if clip_duration_sec <= 2:
        motion_guidance = (
            f"This clip is very short ({clip_duration_sec} seconds), so describe a single "
            "state or moment rather than an evolving sequence of events. Keep the camera "
            "static, and limit motion to one clear, simple behavior of the objects "
            "themselves (can have multiple objects, but one kind of movement)"
            "-- there isn't enough time for anything more elaborate."
        )
    else:
        motion_guidance = (
            f"This clip is {clip_duration_sec} seconds long. Keep the camera static "
            "(no zooms, pans, or reveals) and instead describe how the objects/shapes "
            "themselves move, change, or interact over the full duration -- e.g. pulsing, "
            "rotating, glowing, morphing, connecting, or reconfiguring to visualize the concept explained."
            "The motion should come from the subject, not the camera."
        )

    instruction = f"""Write a short video description for a {clip_duration_sec}-second video clip
    that represents the content explained by using a visual metaphor or abstract scene.
    Do not include any on-screen text or diagram with words. The camera should stay static
    - do not describe camera movement (no zooming, panning, or tracking). Instead, describe
    the movement and behavior of the objects/shapes themselves (e.g. pulsing, rotating,
    connecting, morphing, glowing) as the way the concept is conveyed."""

    render_instruction = RENDER_STYLES.get(render_style, "") # minimal by default

    # Text Rendering - Wan2.1 is slightly better at rendeering texts
    # Trial code
    # NOTE: tested 2026-07-15, text came out illegible/garbled on real generated
    # clips (see ENABLE_ON_SCREEN_KEYWORDS note above) -- gated off by default,
    # this branch only fires if a caller explicitly passes on_screen_key_points.
    keyword_instruction = ""
    if on_screen_key_points:
        keyword_instruction = (
            f'Include the exact text "{on_screen_key_points}" as a clean, legible on-screen '
            "title or label (e.g. bottom-third or top of frame), in a simple sans-serif "
            "font consistent with the minimalist design. The rest of the scene should "
            "still follow the visual metaphor described above."
        )

    # Give the model the surrounding context in order to minimize visual gaps due to being given just a chunk.
    context_block = ""
    if section_context:
        context_block += f"""
    Full section this clip belongs to (for context only -- do not visualize all of it,
    only the specific excerpt below): "{section_context}"
    """
    if chunk_position:
        context_block += f"\n    This clip is {chunk_position} within that section."
    if previous_visual_prompt:
        context_block += f"""
    The previous clip in this section used this visual description:
    "{previous_visual_prompt}"
    Keep the same visual world/metaphor system as the previous clip (e.g. the same
    abstract motif, color language, or setting), but show a different moment or state
    within it -- don't introduce an unrelated new metaphor.
    """

    prompt = f"""You are a Visual Generation Agent creating prompts for a text-to-video AI model ({model_name}).

    Content to visualize (this specific excerpt only): "{sub['content']}"
    Summary: "{sub['summary']}"
    {context_block}

    {instruction}

    {render_instruction}

    {keyword_instruction}

    {motion_guidance}

    Keep the camera static throughout. Lead with what the objects/shapes in the scene
    are doing (e.g. "circles pulsing outward", "lines slowly connecting") before
    describing the rest of the scene.
    Return only the visual prompt text. No explanation."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content.strip()


############### Generate all clip prompts for one section ###############
def gen_visual_prompts_4section(section, model_name=MODEL_NAME, key_points=None):
    """
    use_keyword: if True, every clip in this section gets the section title rendered as on-screen text. 
    Intended for testing on one section at a time, not for blanket use across the whole batch yet.
    """
    chunks = split_into_clip_chunks(section['transcript'], target_duration_sec=CLIP_DURATION_SEC)
    total_chunks = len(chunks)
    key_points = key_points or []
    already_shown = set()

    clip_prompts = []
    previous_prompt = None

    ### Process visual generation chunk by chunk
    for i, (chunk_text, estimated_duration) in enumerate(chunks, start=1):
        frame_num, actual_duration = frames_for_duration(estimated_duration, model_name) # Determine the number of frames
        new_key_point = find_new_key_point(chunk_text, key_points, already_shown)              # Check if there is a keyword to display
        if new_key_point:
            already_shown.add(new_key_point)
        
        chunk_sub = {"content": chunk_text, "summary": section.get("title", "")}

        ### Generate prompt
        prompt = gen_visual_prompt_4chunk(
            chunk_sub,
            model_name=model_name,
            clip_duration_sec=round(actual_duration, 2),
            on_screen_key_points=new_key_point,
            section_context=section["transcript"],
            chunk_position=f"clip {i} of {total_chunks}",
            previous_visual_prompt=previous_prompt,
        )

        ### Save prompt
        clip_prompts.append({
            "section": section["section"],
            "clip_number": i,
            "text": chunk_text,
            "on_screen_key_point": new_key_point,
            "estimated_narration_sec": round(estimated_duration, 1),
            "frame_num": frame_num,
            "actual_clip_duration_sec": round(actual_duration, 2),
            "visual_prompt": prompt,
        })

        previous_prompt = prompt  # feed forward into the next iteration

    return clip_prompts



############### Main ###############
load_dotenv()
client = OpenAI()

### test
test_section = script_data["sections"][2]  # Section 3
# ENABLE_ON_SCREEN_KEYWORDS gate: keyword rendering tested illegible on 2026-07-15,
# so key_points is forced to [] unless the flag at the top is flipped back to True.
test_key_points = test_section.get("key_points", []) if ENABLE_ON_SCREEN_KEYWORDS else []
test_clips = gen_visual_prompts_4section(test_section, key_points=test_key_points)
for c in test_clips:
    print(f"--- Section {c['section']}, Clip {c['clip_number']} "
        f"(~{c['actual_clip_duration_sec']}s, {c['frame_num']} frames) ---")
    print(c['text'])
    print(c['visual_prompt'])
    print()

# all_clip_prompts = []
# for section in script_data["sections"]:
#     key_points = section.get("key_points", []) if ENABLE_ON_SCREEN_KEYWORDS else []
#     section_clips = gen_visual_prompts_4section(section, key_points=key_points)
#     all_clip_prompts.extend(section_clips)

# for c in all_clip_prompts:
#     print(f"--- Section {c['section']}, Clip {c['clip_number']} "
#         f"(~{c['actual_clip_duration_sec']}s, {c['frame_num']} frames) ---")
#     print(c['text'])
#     print(c['visual_prompt'])
#     print()

# ### Save output for the next pipeline stage (video generation) ###
# output_path = "output_sample/cs350_llm/visual_prompts.json"
# with open(output_path, "w") as f:
#     json.dump(
#         {"topic": script_data.get("topic"), "model": MODEL_NAME, "clips": all_clip_prompts},
#         f,
#         indent=4,
#         ensure_ascii=False,
#     )
#     print(f"Saved! - {len(all_clip_prompts)} clip prompts -> {output_path}")