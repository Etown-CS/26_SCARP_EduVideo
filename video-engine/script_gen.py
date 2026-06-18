import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI()

file = "output_sample/cs322_mst_9/pedagogical_output.json"

with open(file, "r") as f:
    data = json.load(f)

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
def generate_transcript(segment, filtered_subsegments):
    summaries = "\n".join([f"- {sub['summary']}" for sub in filtered_subsegments])

    prompt = f"""You are a Script Generation Agent creating educational video transcripts for beginner undergraduate students.

Here is the topic: "{segment['content']}"

Here are the key points to cover:
{summaries}

Write a short, clear transcript paragraph for this topic that:
- Aims for undergraduate students as target
- Flows naturally as spoken educational content
- Covers all the key points above

Return only the transcript text, no labels or explanation."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content.strip()


# Test with just the first segment
first_segment = data["segments"][2]
filtered = filter_subsegments(first_segment)
transcript = generate_transcript(first_segment, filtered)
print(f"\nTopic: {first_segment['content']}")
print(f"\nTranscript:\n{transcript}\n\n")


# # test
# for segment in data["segments"]:
#     filtered = filter_subsegments(segment)
#     print(f"\n{segment['content']} — {len(filtered)} subsegments kept")
#     for sub in filtered:
        # print(f"  {sub['id']} — {sub['importance']} — {sub['summary']}")

# print(f"Topic: {data['topic']}")
# print(f"Number of segments: {len(data['segments'])}")

# for segment in data["segments"]:
#     print(f"\n  [{segment['id']}] {segment['content']}")
#     for sub in segment["ordered_subsegments"]:
#         print(f"    {sub['id']} — {sub['importance']}")