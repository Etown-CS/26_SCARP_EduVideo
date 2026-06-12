import json
from openai import OpenAI
from dotenv import load_dotenv
'''
Overview of this Pedagogical Agent

Load the JSON file created in the doc_analysis.py (Document Analysis Agent)
↓↓↓
Format JSON file to the plain text since AI can't read a raw json well
↓↓↓
Loop through all core topics - Reorder function called for every single main topic to reorder subsegments

'''

############### Process segmentation ###############

load_dotenv()
client = OpenAI()

with open("output_sample/cs322_mst_9/cs322_mst_9.json", "r") as f:
    data = json.load(f)

# Takes a core topic and convert its subsegments into text readable for the AI 
# (AI can't read the raw JSON file)
def format_topic4prompt(topic):
    lines = []
    for sub in topic["subsegments"]:
        lines.append(f"  id: {sub['id']}, type: {sub['type']}, content: {sub['content']}")
    return "\n".join(lines)


### Get a new order of core topic for beginner friendly
def reorder_topic(topic):
    formatted = format_topic4prompt(topic) # Call the format_topic4prompt to get the plain text of subsegments 

    # Create a prompt with formatted text
    prompt = f"""You are a Pedagogical Agent helping reorder lecture segments for beginner students.

Here are the subsegments for the topic "{topic['content']}":

{formatted}
Do two things:
1. Reorder these subsegments into the best teaching sequence for a beginner.
2. Rate each subsegment's importance using exactly one of these labels:
    - essential: core concept, must be included
    - supplementary: helps understanding but not critical
    - advanced: beyond undergrad level, include only if user requests
    - optional: not necessary, can be skipped

Return ONLY a JSON list like this, no explanation:
[
    {{"id": "seg_001_002", "importance": "essential"}},
    {{"id": "seg_001_001", "importance": "supplementary"}}
]"""

# Send the prompt to GPT-4o and get a list of reordered IDs
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.choices[0].message.content

    # Avoid causing error due to the markdown code fence
    clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    
    ordered_ids = json.loads(clean)
    return ordered_ids


# for topic in data["segments"]:
#     result = reorder_topic(topic)
#     print(f"\nTopic: {topic["content"]}")
#     print(f"Reordered IDs: '{result}':")

# Test with just the first topic first
first_topic = data["segments"][1]
result = reorder_topic(first_topic)
print(f"\nTopic: {first_topic['content']}")
for item in result:
    print(f"  {item['id']} — {item['importance']}")