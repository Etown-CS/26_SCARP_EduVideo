import re
import os
from audio_gen import clean_text_for_tts, tts_pipeline, generate_audio, get_audio_duration

'''
### Functions in this file
- split_into_clip_chunks
- find_image_path_in_chunk
- frames_for_duration
- find_new_key_point
- gen_visual_prompt_4chunk
- gen_clips_with_audio_4section
'''

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
        # 1.2 - 20% overshoot allows room to prefer a clean semantic break over a length limit
        if current_sentences and (current_word_count + word_count) > target_words * 1.2:
            chunk_text = " ".join(current_sentences)
            chunks.append((chunk_text, current_word_count / WORDS_PER_SECOND)) # append as a tuple of ("chunk text finalized", estimated time)

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

############### Find image path ###############
def find_image_path_in_chunk(chunk_text):
    '''
    This function takes the images path out from the chunk not to get the path narrated.
    '''
    match = re.search(r'!\[\]\(([^)]*)\)', chunk_text)
    if match:
        return match.group(1)
    return None

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
    client,
    sub,
    model_name=MODEL_NAME,
    clip_duration_sec=CLIP_DURATION_SEC,
    on_screen_key_points=None,
    render_style="minimal_geometric",       # default
    section_context=None,
    chunk_position=None,                    # order in section
    previous_visual_prompt=None,            # for the continuity
):
    '''
    Generate a Wan2.1 text-to-video prompt for one narration chunk.
    Combines motion guidance, CS-concept motion hints, render style, and
    surrounding context (previous clip's prompt + section text) to keep
    the abstract visual metaphor consistent across a section.
    '''

    motion_guidance = (
        f"This clip is {clip_duration_sec} seconds long. Keep the camera static "
        "(no zooms, pans, or reveals) and instead describe how the objects/shapes "
        "themselves move, change, or interact over the full duration -- e.g. pulsing, "
        "rotating, glowing, morphing, connecting, or reconfiguring to visualize the concept explained."
        "The motion should come from the subject, not the camera."
    )

    ### Detailed instruction for better visuals showing CS concepts
    cs_concept_motion_hints = """
        When the content includes positions, let the shapes and their positions reflect:
        - "front" -> always implies a shape at the leftmost, by assuming all the shapes lined up horizontally
        - "back" -> always implies a shape  at the rightmost, by assuming all the shapes lined up horizontally
        - "top" -> always implies a shape at the top, by assuming all the shapes placed vertically
        - "bottom" -> always implies a shape at the bottom, by assuming all the shapes placed vertically
        Also, when the content involves common CS operations, let the motion reflect their meaning:
        - "add" / "insert" → a new shape smoothly added into the existing sequence of shapes
        - "delete" / "remove" / "take out" → a shape shrinks and fades out from a sequence of shapes
        - "connect" / "link" → a line or an arrow forms between two shapes
        - "disconnect" / "remove edge" → an existing line fades or breaks apart after flickering
        - "next" / "forward" / "traverse" →  make shapes grow red brightly from left to right or
        - "previous" / "backward" → make shapes grow blue brightly in the opposite direction
        - "compare" → two shapes tilt back and forth like a seesaw, first one rising as the other lowers, then reversing
        - "swap" / "exchange" → two shapes smoothly exchange positions
        - "search" / "find" → brighten shapes one by one, then make a single shape brighten and pop while others stay dim
        Use these as inspiration when relevant, but keep the camera static and the overall scene abstract/minimal as described above.
    """

    instruction = f"""Write a short video description for a {clip_duration_sec}-second video clip
    that represents the content explained by using a visual metaphor or abstract scene.
    Do not include any on-screen text or diagram with words. The camera should stay static
    - do not describe camera movement (no zooming, panning, or tracking). Instead, describe
    the movement and behavior of the objects/shapes themselves (e.g. pulsing, rotating,
    connecting, morphing, glowing) as the way the concept is conveyed."""

    render_instruction = RENDER_STYLES.get(render_style, "") # minimal by default

    # Text Rendering - Wan2.1 is slightly better at rendering texts
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

    ### Give the model the surrounding context in order to minimize visual gaps due to being given just a chunk.
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

    {cs_concept_motion_hints}

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
def gen_clips_with_audio_4section(client, section, pipeline, output_folder, model_name=MODEL_NAME, key_points=None):
    '''
    For one video-outline section: split the transcript into clip-sized
    chunks, generate audio for each chunk (measuring its real duration),
    and either reference an existing PDF image or generate a Wan2.1
    prompt for it, depending on whether the chunk contains an image tag.
    Returns a list of per-clip dicts ready to be sent to the GPU.
    '''

    ### Create folder to store audio files
    audio_dir = os.path.join(output_folder, "audio")
    os.makedirs(audio_dir, exist_ok=True)

    ### Split each section's transcript into chunks
    chunks = split_into_clip_chunks(section['transcript'])
    total_chunks = len(chunks)

    key_points = key_points or []
    already_shown = set()

    clip_prompts_4section = []
    previous_prompt = None

    ### Process visual generation chunk by chunk
    for i, (chunk_text, estimated_duration) in enumerate(chunks, start=1):
        ### Check if this chunk references an image, before the text gets cleaned for TTS
        image_path = find_image_path_in_chunk(chunk_text)

        ### Generate audio
        audio_path = os.path.join(audio_dir, f"section-{section['section']}_clip{i}.wav")
        clean_chunk_text = clean_text_for_tts(chunk_text)

        generate_audio(pipeline, clean_chunk_text, audio_path)
        actual_clip_duration = get_audio_duration(audio_path)

        frame_num, actual_clip_duration = frames_for_duration(actual_clip_duration, model_name)

        if image_path:
            clip_prompts_4section.append({
                "section": section["section"],
                "clip_number": i,
                "text": chunk_text,
                "on_screen_key_point": None,
                "estimated_narration_sec": round(estimated_duration, 1),
                "frame_num": frame_num,
                "actual_clip_duration_sec": round(actual_clip_duration, 2),
                "visual_type": "existing_image",
                "image_path": image_path,
                "audio_path": audio_path,
            })
        else:
            # NOTE: new_key_point / on_screen_key_points is for optional on-screen
            # text rendering, which was tested and found unreliable (see
            # ENABLE_ON_SCREEN_KEYWORDS note above) -- currently gated off.
            new_key_point = find_new_key_point(chunk_text, key_points, already_shown)
            if new_key_point:
                already_shown.add(new_key_point)

            chunk_sub = {"content": chunk_text, "summary": section.get("title", "")}

            prompt = gen_visual_prompt_4chunk(
                client,
                chunk_sub,
                model_name=model_name,
                clip_duration_sec=round(actual_clip_duration, 2),
                on_screen_key_points=new_key_point,
                section_context=section["transcript"],
                chunk_position=f"clip {i} of {total_chunks}",
                previous_visual_prompt=previous_prompt,
            )

            clip_prompts_4section.append({
                "section": section["section"],
                "clip_number": i,
                "text": chunk_text,
                "on_screen_key_point": new_key_point,
                "estimated_narration_sec": round(estimated_duration, 1),
                "frame_num": frame_num,
                "actual_clip_duration_sec": round(actual_clip_duration, 2),
                "visual_type": "generated",
                "visual_prompt": prompt,
                "audio_path": audio_path,
            })

            previous_prompt = prompt  # feed forward into the next iteration, to keep the format

    return clip_prompts_4section