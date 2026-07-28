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
        intro_outro_instruction = 'Since this is the last section of the video, end with a brief closing sentence that wraps up the topic and leaves viewers motivated (e.g. "Now you understand how... Keep practicing!", "That\'s how... works. Have a great day!", "Hope this video helps!").'

    new_summary = build_summary_list(subsegs)

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

If you see a sequence of letters starting with "![](", you MUST keep it exactly as it is (do not
rename, remove, or merge it into surrounding text), and it must stay in
the same relative position -- between the same sentences that came
before and after it in the original input.

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

    return {"transcript": transcript, "key_points": verified_key_points}

############### Build summary list　###############
def build_summary_list(subsegments):
    '''
    For text segments: use the simplified summary
    For visual segments:both the image path (so it stays in the transcript at the right position) and its description (so the LLM understands what the image shows).
    '''
    summary = []
    for s in subsegments:
        if s["type"] == 'visual':
            summary.append(f"{s['content']} ({s['summary']})") # ![...](...) (This image describes...)
        else:
            summary.append(s["summary"])
    return summary

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