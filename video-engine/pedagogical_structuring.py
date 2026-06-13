import json
from openai import OpenAI
from dotenv import load_dotenv
import os

'''
Overview of this Pedagogical Agent

Load the JSON file created in the doc_analysis.py (Document Analysis Agent)
↓↓↓
Format JSON file to the plain text since AI can't read a raw json well
↓↓↓
Loop through all core topics - Reorder function called for every single main topic to reorder subsegments

'''

############### Process segmentation ###############
# Takes a core topic and convert its subsegments into text readable for the AI 
# (AI can't read the raw JSON file)
def format_topic4prompt(topic):
    lines = []
    for sub in topic["subsegments"]:
        lines.append(f"  id: {sub['id']}, type: {sub['type']}, content: {sub['content']}")
    return "\n".join(lines)


### Get ...
# a new order of core topic for beginner friendly
# Label importance
# Create a summary by subsegments
def reorder_summarize_topic(topic):
    # Convert a core topic in md file into plain text
    formatted = format_topic4prompt(topic)

    prompt = f"""You are a Pedagogical Agent helping reorder lecture segments for beginner undergraduate students.

Here are the subsegments for the topic "{topic['content']}":

{formatted}

Do three things:
1. Reorder these subsegments into the best teaching sequence for a beginner.
2. Rate each subsegment's importance using exactly one of these labels:
    - essential: core concept, must be included
    - supplementary: helps understanding but not critical
    - advanced: beyond undergrad level, include only if user requests
    - optional: not necessary, can be skipped
3. Write a short, simplified summary of each subsegment for beginner students.

Return ONLY a JSON list like this, no explanation:
[
    {{
        "id": "seg_001_002",
        "content": "original content here",
        "summary": "simplified summary here",
        "importance": "essential"
    }}
]"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )

    # Remove markdown code fences
    raw = response.choices[0].message.content
    clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    result = json.loads(clean)

    return result


############### Rebuild the output JSON file ###############
# Construct the JSON file with importance label and summary of each subsegment as output
def build_output(data, results):
    output = {
        "topic": data["topic"],
        "segments": []
    }

    for topic, result in zip(data["segments"], results):
        output["segments"].append({
            "id": topic["id"],
            "content": topic["content"],
            "ordered_subsegments": result
        })

    return output


############### Main ###############
# Open AI 
load_dotenv()
client = OpenAI()

### Get a file name for future use
file = "output_sample/cs322_mst_9/cs322_mst_9.json"
output_dir = os.path.dirname(file)

with open(file, "r") as f:
    data = json.load(f)

# Run all topics and collect their importance & summary of subsegments
all_results = []
for topic in data["segments"]:
    result = reorder_summarize_topic(topic)
    all_results.append(result)

# Build and save output
output = build_output(data, all_results)

with open(output_dir, "pedagogical_output.json", "w") as f:
    json.dump(output, f, indent=4)

print(f"\n✅ pedagogical_output.json saved to {output_dir}!")