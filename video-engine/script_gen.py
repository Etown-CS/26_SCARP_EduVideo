import json
from openai import OpenAI
from dotenv import load_dotenv
import os
from targeting_level_rubric import DIFFICULTY_RUBRIC

from pathlib import Path

### LLM
load_dotenv()
client = OpenAI()

############### Segment Filter ###############
# In order to create a transcript per a core topic, remove segments such as...
# - ones labeled as "optional" or "advanced"
# - ones with image paths
def filter_subsegments(segment):
    filtered = []
    for sub in segment["ordered_subsegments"]:
        # Skip optional and advanced
        if sub["importance"] not in ["essential", "supplementary"]:
            continue
        filtered.append(sub)
    return filtered

############### Transcript Generation + Key point extraction###############
def generate_transcript(section, subseg_lookup, video_title):
    subsegs = []
    for sid in section["subsegment_ids"]:
        if sid in subseg_lookup:
            sub = subseg_lookup[sid]
            if sub["importance"] not in ["essential", "supplementary"]:
                continue
            subsegs.append(sub)

    if not subsegs:
        return None

    summary, marker_dict = summaries_with_markers(subsegs)
    new_summary = restore_img_path(summary, marker_dict)

    prompt = DIFFICULTY_RUBRIC + f"""
    You are a Script Generation Agent creating an educational video transcripts for beginner undergraduate students.

    This video is titled: "{video_title}"
    The current section is: "{section['title']}" (role: {section['role']})

Key points to cover in this section:
{new_summary}

Write a short, clear transcript paragraph for this section that:
- Fits naturally as part of a larger video (not a standalone lesson)
- Flows naturally as spoken educational content
- Matches the section's role ({section['role']})

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


############### Test function ###############

def summaries_with_markers(subsegments):
    c = 1
    summary = []
    marker_dict = {}

    for s in subsegments:
        if s["type"] == 'visual':
            marker = f"VISUAL_MARKER_{c}"
            marker_dict[marker] = s['content']
            summary.append(marker)
            c += 1
        else:
            summary.append(s["summary"])
    
    return summary, marker_dict

def restore_img_path(summary, marker_dict):
    new_summary = []
    for line in summary:
        # print(line)
        if "VISUAL_MARKER" in line:
            path = marker_dict.get(line)
            line = line.replace(line, path)
        
        new_summary.append(line)

    return new_summary

############### Main ###############
def run_script_gen(pedagogical_json, output_folder):
    file = pedagogical_json

    with open(file, "r") as f:
        data = json.load(f)

    # Build a lookup: subsegment id → subsegment data
    subseg_lookup = {}
    for topic in data["segments"]:
        for sub in topic["ordered_subsegments"]:
            subseg_lookup[sub["id"]] = sub


    ### Build output
    sections_output = []
    video_title = data["video_outline"]["title"]
    for section in data["video_outline"]["sections"]:
        result = generate_transcript(section, subseg_lookup, video_title)
        if result:
            print(f"\n\n--- Section {section['section']}: {section['title']} [{section['role']}] ---")
            print(result["transcript"])
            print(f"Key points: {result['key_points']}")

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
    with open(os.path.join(output_dir, "script_output.json"), "w") as f:
        json.dump(output, f, indent=4)

    print(f"\n✅ Saved to {output_dir}/script_output.json")

    return output_folder

if __name__ == "__main__":
    fileName = input("Provide a valid folder name: ")
    pedagogical_json_path = Path(f"output_sample/{fileName}/pedagogical_output.json")
    output_folder = Path(f"output_sample/{fileName}")

    if output_folder.exists() == False or pedagogical_json_path.exists() == False:
        print(f"Folder not found or doc_analysis.py skipped.")
        exit()
        
    run_script_gen(pedagogical_json_path, output_folder)