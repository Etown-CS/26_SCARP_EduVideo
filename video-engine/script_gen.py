import json
from openai import OpenAI
from dotenv import load_dotenv
import os

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

############### Transcript Generation ###############
# based on summaries
def generate_transcript(section, subseg_lookup):
    # Get the subsegments for this section using the lookup
    subsegs = []
    for sid in section["subsegment_ids"]:
        if sid in subseg_lookup:
            sub = subseg_lookup[sid]

            # Skip images, optional, and advanced
            if sub['content'].startswith("![]"):
                continue
            if sub["importance"] not in ["essential", "supplementary"]:
                continue

            subsegs.append(sub)

    # if no valid subsegments, skip this section
    if not subsegs:
        return None
    
    summaries = "\n".join([f"- {sub['summary']}" for sub in subsegs])

    prompt = f"""You are a Script Generation Agent creating an educational video transcripts for beginner undergraduate students.

    This video is titled: "{data["video outline"]['title']}"
    The current section is: "{section['title']}" (role: {section['role']})

Key points to cover in this section:
{summaries}

Write a short, clear transcript paragraph for this section that:
- Fits naturally as part if a larger video (not a standalone lesson)
- Flows naturally as spoken educational content
- Matches the section's role ({section['role']})

Return only the transcript text, no labels or explanation."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content.strip()


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
# print(f"Total subsegments in lookup: {len(subseg_lookup)}")
# print(f"Video title: {data['video outline']['title']}")
# print(f"Number of sections: {len(data['video outline']['sections'])}")

# ### Generate transcript for all sections
# for section in data["video outline"]["sections"]:
#     transcript = generate_transcript(section, subseg_lookup)
#     if transcript:
#         print(f"\n--- Section {section['section']}: {section['title']} [{section['role']}] ---")
#         print(transcript)

### Build output
sections_output = []
for section in data["video outline"]["sections"]:
    transcript = generate_transcript(section, subseg_lookup)
    if transcript:
        sections_output.append({
            "section": section["section"],
            "title": section["title"],
            "role": section["role"],
            "subsegment_ids": section["subsegment_ids"],
            "transcript": transcript
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