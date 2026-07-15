import json
from openai import OpenAI
from dotenv import load_dotenv
import os
from targeting_level_rubric import DIFFICULTY_RUBRIC

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
        # Skip images
        if sub["content"].startswith("![]"):
            continue
        filtered.append(sub)
    return filtered

############### Transcript Generation + Key point extraction###############
# based on summaries
def generate_transcript(section, subseg_lookup):
    subsegs = []
    for sid in section["subsegment_ids"]:
        if sid in subseg_lookup:
            sub = subseg_lookup[sid]
            if sub['content'].startswith("![]"):
                continue
            if sub["importance"] not in ["essential", "supplementary"]:
                continue
            subsegs.append(sub)

    if not subsegs:
        return None

    summaries = "\n".join([f"- {sub['summary']}" for sub in subsegs])

    prompt = DIFFICULTY_RUBRIC + f"""
    You are a Script Generation Agent creating an educational video transcripts for beginner undergraduate students.

    This video is titled: "{data["video outline"]['title']}"
    The current section is: "{section['title']}" (role: {section['role']})

Key points to cover in this section:
{summaries}

Write a short, clear transcript paragraph for this section that:
- Fits naturally as part of a larger video (not a standalone lesson)
- Flows naturally as spoken educational content
- Matches the section's role ({section['role']})

Also identify up to 3 key terms or the specific angle/question the transcript addresses about it 
(e.g. "Why it matters", "What makes it powerful", "How it works"). Each term MUST appear
verbatim (word-for-word) in the transcript text you write. Order them by the
order they first appear.

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


############### Main ###############

load_dotenv()
client = OpenAI()

file = "output_sample/cs350_llm/pedagogical_output.json"

with open(file, "r") as f:
    data = json.load(f)

# Build a lookup: subsegment id → subsegment data
subseg_lookup = {}
for topic in data["segments"]:
    for sub in topic["ordered_subsegments"]:
        subseg_lookup[sub["id"]] = sub

# Test it
print(f"Total subsegments in lookup: {len(subseg_lookup)}")
print(f"Video title: {data['video outline']['title']}")
print(f"Number of sections: {len(data['video outline']['sections'])}")

### Generate transcript for all sections
for section in data["video outline"]["sections"]:
    transcript = generate_transcript(section, subseg_lookup)
    if transcript:
        print(f"\n--- Section {section['section']}: {section['title']} [{section['role']}] ---")
        print(transcript)

### Build output
sections_output = []
for section in data["video outline"]["sections"]:
    result = generate_transcript(section, subseg_lookup)
    if result:
        print(f"\n--- Section {section['section']}: {section['title']} [{section['role']}] ---")
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
### Save
output = {
    "topic": data["topic"],
    "user_prompt": data["user_prompt"],
    "video_title": data["video outline"]["title"],
    "sections": sections_output
}

output_dir = os.path.dirname(file)
with open(os.path.join(output_dir, "script_output.json"), "w") as f:
    json.dump(output, f, indent=4)

print(f"\n✅ Saved to {output_dir}/script_output.json")