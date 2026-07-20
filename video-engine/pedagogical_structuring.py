import json
from openai import OpenAI
from dotenv import load_dotenv
import os
from targeting_level_rubric import DIFFICULTY_RUBRIC

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

############### Reorder ###############
### Get ...
# a new order of core topic for beginner friendly
# Label importance
# Create a summary by subsegments
def finetune_reorder_topic(topic, user_prompt):
    # Convert a core topic in md file into plain text
    formatted = format_topic4prompt(topic)

    # print(f"Here's input before being put into the LLM call:s\n{formatted}\n\n") # for check

    prompt = DIFFICULTY_RUBRIC + f"""You are a Pedagogical Agent helping fine-tune and reorder the segments based on the user prompt for a beginner undergraduate student.
The user has the following request for this video: "{user_prompt}"
Here are the subsegments for the topic "{topic['content']}":

{formatted}

Do three things:
1.Rate each subsegment's importance using exactly one of these labels:
    - essential: core concept the user is asking about, must be included
    - supplementary: helps understanding but not directly what the user asked for
    - advanced: beyond undergrad level, include only if user requests
    - optional: not necessary, can be skipped
    When rating importance, prioritize content that directly relates to the user's request above.
    Foundational definitions needed to understand the user's requested topic should still be rated essential.
2. Reorder these subsegments into the best teaching sequence for a beginner. 
3. Write a short, simplified summary of each subsegment for beginner students.

Return ONLY a JSON list like this, no explanation:
[
    {{
        "id": "seg_001_002",
        "content": "original content here",
        "summary": "simplified summary here",
        "importance": "essential",
        "type": "type here"
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

    # print(f"Output is here:\n{result}\n\n") for check
    return result

############### LLM Video Outline Generator ###############
def video_outline_maker(all_subsegments, user_prompt, client):
    # Format the flat list to put in LLM
    formatted = "\n".join([
        f"{sub['id']} [{sub['importance']}] ({sub['topic']}): {sub['content'][:100]}"
        for sub in all_subsegments
    ])


    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": DIFFICULTY_RUBRIC + """
                
                You are a Video Outline Maker for an educational video pipeline.
                Given a list of lecture subsegments and a user's request, create a coherent video outline.
                
                Rules:
                - Group subsegments into logical sections that flows naturally
                - Each section should have a clear role: "introduction", "foundation", "main focus", "supporting", "conclusion"
                - Prioritize subsegments that match the user's request as "main focus"
                - Keep foundational definitions as "foundation" even if not directly requested
                - The outline should tell one coherent story, not separate topic summaries
                - You MUST NOT remove subsegments whose "type" is "visual"
                - You MUST keep subsegments whose "type" is "visual" grouped together with the
                other subsegments that share the same "topic" value -- do not create a
                separate section that only contains visual subsegments.
                - This rule takes priority over grouping by role -- even if a visual's topic
                mostly consists of "foundation" content and the visual itself seems more
                "supporting", keep it with its original topic's section rather than moving
                it elsewhere.
                - Return ONLY valid JSON, no explanation, no markdown formatting:
                {
                    "title": "video title based on user's request",
                    "sections': [
                        {
                            "section": 1,
                            "title": "section title",
                            "role": "foundation",
                            "subsegment_ids": ["seg_001_001", "seg_001_002"]
                        }
                    ]
                }"""
            },
            {
                "role": "user",
                "content": f"User request: {user_prompt}\n\nSubsegments:\n{formatted}"
            }
        ]
    )

    raw = response.choices[0].message.content
    clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    outline = json.loads(clean)

    return outline


############### Rebuild the output JSON file ###############
# Construct the JSON file with importance label and summary of each subsegment as output
def build_output(data, results, outline):
    output = {
        "topic": data["topic"],
        "user_prompt": user_prompt,
        "video outline": outline,
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
file = "output_sample/cs350_llm/doc_analysis_output.json"
output_dir = os.path.dirname(file)

with open(file, "r") as f:
    data = json.load(f)

user_prompt = data.get("user_prompt", "") # empty string by default

# Run all topics and collect their importance & summary of subsegments
all_results = []
for topic in data["segments"]:
    result = finetune_reorder_topic(topic, user_prompt)
    all_results.append(result)

# Flatten all subsegments across all topics
all_subsegments = []
for topic, result in zip(data["segments"], all_results):
    for sub in result:
        all_subsegments.append({
            "id": sub["id"],
            "topic": topic["content"],
            "content": sub["summary"],
            "importance": sub["importance"],
            "type": sub["type"]
        })

outline = video_outline_maker(all_subsegments, user_prompt, client)

# ### Check outline and content in each section
# outline = video_outline_maker(all_subsegments, user_prompt, client)
# print(f"\nVideo Title: {outline['title']}")
# for section in outline["sections"]:
#     print(f"\n  Section {section['section']}: {section['title']} [{section['role']}]")
#     for sid in section["subsegment_ids"]:
#         print(f"    {sid}")

# Build and save output
output = build_output(data, all_results, outline)

with open(os.path.join(output_dir, "pedagogical_output.json"), "w") as f:
    json.dump(output, f, indent=4)

print(f"\n✅ pedagogical_output.json saved to {output_dir}!")