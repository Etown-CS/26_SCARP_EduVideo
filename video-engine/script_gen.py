import json
from openai import OpenAI
from dotenv import load_dotenv
import os
from targeting_level_rubric import DIFFICULTY_RUBRIC

from pathlib import Path

### LLM
load_dotenv()
client = OpenAI()

############### Transcript Generation + Key point extraction###############
def generate_transcript(section, subseg_lookup, video_title):
    subsegs = []
    for sid in section["subsegment_ids"]:
        if sid in subseg_lookup:
            sub = subseg_lookup[sid]
            subsegs.append(sub)

    if not subsegs:
        return None

    ### if its role is intro or conclusion, add additional prompt
    intro_outro_instruction = ""
    if section['role'] == "introduction":
        intro_outro_instruction = 'Since this is the first section of the video, start with a brief welcoming sentence (e.g. "Welcome to this video on...", "Hello! Today we\'ll look at...") before diving into the content.'
    elif section['role'] == "conclusion":
        intro_outro_instruction = 'Since this is the last section of the video, end with a brief closing sentence that wraps up the topic and leaves viewers motivated.'

    new_summary, img_marker_dict = build_summary_list(subsegs)

    prompt = DIFFICULTY_RUBRIC + f"""
    You are a Script Generation Agent creating an educational video transcripts for beginner undergraduate students.

    This video is titled: "{video_title}"
    The current section is: "{section['title']}" (role: {section['role']})

Key points to cover in this section:
{new_summary}

Write a short, clear transcript paragraph(DO NOT exceed 20 words per sentence) for this section that:
- Fits naturally as part of a larger video (not a standalone lesson)
- Flows naturally as spoken educational content
- Matches the section's role ({section['role']})

{intro_outro_instruction}

Also identify up to 3 key terms or the specific angle/question related to the transcript addresses about it 
(e.g. "Why it matters", "What makes it powerful", "How it works"). Each term MUST appear
verbatim (word-for-word) in the transcript text you write. Order them by the
order they first appear.

Some key points below contain a token like "IMAGE_MARKER_1". If you use
that key point in your transcript, copy the token exactly as it is
(e.g. "IMAGE_MARKER_1"), placed naturally in the sentence. Never invent
a new token like this yourself -- only use the exact ones given to you above.

Never use an IMAGE_MARKER token as the grammatical subject of a sentence
(e.g. avoid "IMAGE_MARKER_1 shows..."). Instead, place it at the end of
a sentence, or as a standalone reference (e.g. "This diagram shows how
Prim's algorithm builds a tree. IMAGE_MARKER_1" or "Prim's algorithm
builds a tree from a single node, as shown here. IMAGE_MARKER_1").

Return ONLY a valid JSON object, no explanation, no markdown formatting:
{{
    "transcript": "the transcript text here",
    "key_points": [
        "Term One", "Why it matters", "How it works"
    ]
}}"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.choices[0].message.content.strip()
    clean = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        result = json.loads(clean)
    except json.JSONDecodeError:
        print(f"Warning: could not parse transcript+key_points JSON for section {section['section']}")
        return None

    transcript = result.get("transcript", "").strip()
    key_points = result.get("key_points", [])

    # Safety check: verify each term actually appears verbatim.
    transcript_lower = transcript.lower()
    verified_key_points = [
        kp for kp in key_points
        if kp.lower() in transcript_lower
    ]

    transcript = restore_img_path(transcript, img_marker_dict)

    return {"transcript": transcript, "key_points": verified_key_points}

############### Build summary list with image markers ###############
def build_summary_list(subsegments):
    '''
    This function was created to deal with the LLM's limitation of handling image paths.
    Before feeding summaries of each subsegments, replace image tags with markers "IMAGE_MARKER_n" in order not to have the LLM to handle,
    but keep the right position the images are supposed to be.
    '''
    summary = []
    marker_dict = {}
    c = 1
    for s in subsegments:
        if s["type"] == 'visual':
            marker = f"IMAGE_MARKER_{c}"
            marker_dict[marker] = s['content']  # Save a tag
            summary.append(f"{marker} ({s['summary']})")  # marker + description
            c += 1
        else:
            summary.append(s["summary"])
    return summary, marker_dict

############### Restore image tags ###############
def restore_img_path(text, marker_dict):
    for marker, path in marker_dict.items():
        text = text.replace(marker, path)
    return text

############### Main ###############
def run_script_gen(pedagogical_json):
    file = pedagogical_json

    with open(file, "r") as f:
        data = json.load(f)

    print("📖🔄 Generating transcript...") # Status

    # Build a lookup: subsegment id → subsegment data
    subseg_lookup_dict = {}
    for topic in data["segments"]:
        for sub in topic["ordered_subsegments"]:
            subseg_lookup_dict[sub["id"]] = sub

    ### Build output
    sections_output = []
    video_title = data["video_outline"]["title"]
    for section in data["video_outline"]["sections"]:
        result = generate_transcript(section, subseg_lookup_dict, video_title)
        if result:
            sections_output.append({
                "section": section["section"],
                "title": section["title"],
                "role": section["role"],
                "subsegment_ids": section["subsegment_ids"],
                "transcript": result["transcript"],
                "key_points": result["key_points"],
            })
    ### Save output file
    output = {
        "topic": data["topic"],
        "user_prompt": data["user_prompt"],
        "video_title": data["video_outline"]["title"],
        "sections": sections_output
    }

    output_dir = os.path.dirname(file)
    output_json_path = os.path.join(output_dir, "script_output.json")
    with open(output_json_path, "w") as f:
        json.dump(output, f, indent=4)

    print(f"\n✅ Saved to {output_dir}/script_output.json")

    return output_json_path

if __name__ == "__main__":
    fileName = input("Provide a valid folder name: ")
    pedagogical_json_path = Path(f"output_sample/{fileName}/pedagogical_output.json")
    output_folder = Path(f"output_sample/{fileName}")

    if output_folder.exists() == False or pedagogical_json_path.exists() == False:
        print(f"Folder not found or doc_analysis.py skipped.")
        exit()
        
    run_script_gen(pedagogical_json_path)