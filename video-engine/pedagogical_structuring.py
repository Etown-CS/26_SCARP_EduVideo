import json
from openai import OpenAI
from dotenv import load_dotenv
import os
from targeting_level_rubric import DIFFICULTY_RUBRIC

from pathlib import Path

### LLM
load_dotenv()
client = OpenAI()

############### Reorder ###############
def reorder_summarize_label_topic(topic, user_prompt):
    '''
    Given one core topic and the user's prompt, ask the LLM to:
    - Rate each subsegment's importance (essential/supplementary/advanced/optional)
    - Reorder subsegments into the best teaching sequence for a beginner
    - Write a simplified summary of each subsegment
    Returns a list of subsegments with these fields added.
    '''

    # Convert a core topic in md file into plain text
    formatted, visual_lookup = format_topic4prompt(topic)

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
            "content": "content here",
            "summary": "simplified summary here",
            "importance": "essential",
            "type": "type here"
        }}
    ]"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )

    ### Remove markdown code fences
    raw = response.choices[0].message.content
    clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    result = json.loads(clean)

    ### Overwrite to correctly get the image path and image_description
    for sub in result:
        if sub['id'] in visual_lookup:
            sub['summary'] = visual_lookup[sub['id']]['summary']

    return result

############### Process segmentation ###############
# Takes a core topic and convert its subsegments into text readable for the AI
# (AI can't read the raw JSON file)
def format_topic4prompt(topic):
    '''
    - Include the image_description generated in the doc_analysis file for the visual segments.
    - Also hit the stability limitation of the LLM. It sometimes mixes up the image path as ['content']
    and the image_description as ['summary'] and overwrites both with image_description, especially it is long, 
    because the longer decriptions make the LLM think it's more important.
    - Here, in case the confusion happens to LLM, the dict visual_lookup stores both the image path and image_description
    so that it can be fixed.
    '''
    lines = []
    visual_lookup = {}
    for sub in topic["subsegments"]:
        line = f"  id: {sub['id']}, type: {sub['type']}, content: {sub['content']}, order: {sub['order']}"
        if "image_description" in sub:
            line += f", image_description: {sub['image_description']}" # for visual segments
            visual_lookup[sub['id']] = {
                "content": sub['content'],
                "summary": sub['image_description'],
            }
        lines.append(line)
    return "\n".join(lines), visual_lookup

############### LLM Video Outline Generator ###############
def video_outline_maker(all_subsegments, user_prompt, client):
    '''
    Given the flattened list of all subsegments (across all topics) and the user's
    prompt, ask the LLM to group them into a coherent video outline: 6 sections max,
    each with a role (introduction/foundation/main focus/supporting/conclusion),
    always including exactly one introduction and one conclusion section.
    Returns the outline as a dict with "title" and "sections".
    '''

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
                - Group subsegments 6 sections at maximum in total (not fewer, not more). If there are many subsegments, combine related ones into broader sections rather than creating additional sections.
                - Each section should have a clear role: "introduction", "foundation", "main focus", "supporting", "conclusion"
                - The video MUST always include exactly one "introduction" section and exactly one "conclusion" section. The introduction section should briefly introduce the concept(s) covered in the video. The conclusion section should wrap up with a summary or highlight of the concept(s) covered.
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
def build_output(data, reordered_topics, outline):
    '''
    Assemble the final pedagogical_output.json structure: the video outline,
    plus each topic's reordered/labeled subsegments under "segments".
    '''

    output = {
        "topic": data["topic"],
        "user_prompt": data["user_prompt"],
        "video_outline": outline,
        "segments": []
    }

    for topic, reordered_topic in zip(data["segments"], reordered_topics):
        output["segments"].append({
            "id": topic["id"],
            "content": topic["content"],
            "ordered_subsegments": reordered_topic
        })

    return output


###################################### Main ######################################
def run_pedagogical_structuring(doc_analysis_json):
    '''
    Main entry point for the Pedagogical Structuring Agent.
    - Reads doc_analysis_output.json
    - For each topic, reorders/labels its subsegments via finetune_reorder_topic
    - Flattens all subsegments and builds a video outline via video_outline_maker
    - Saves the combined result as pedagogical_output.json
    Returns the path to the saved file.
    '''

    file = doc_analysis_json

    with open(file, "r") as f:
        data = json.load(f)

    print("✏️🔄 Creating Outline ...") # Status

    user_prompt = data.get("user_prompt", "") # empty string by default

    # Run all topics and collect their importance & summary of subsegments
    all_results = []
    for topic in data["segments"]:
        result = reorder_summarize_label_topic(topic, user_prompt)
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

    ### Build and save output
    output = build_output(data, all_results, outline)

    output_dir = os.path.dirname(file)
    output_json_path = os.path.join(output_dir, "pedagogical_output.json")
    with open(output_json_path, "w") as f:
        json.dump(output, f, indent=4)

    print(f"\n✅ pedagogical_output.json saved to {output_dir}!")

    return output_json_path

if __name__ == "__main__":
    fileName = input("Provide a valid folder name: ")
    doc_analysis_json_path = Path(f"output_sample/{fileName}/doc_analysis_output.json")
    output_folder = Path(f"output_sample/{fileName}")

    if output_folder.exists() == False or doc_analysis_json_path.exists() == False:
        print(f"Folder not found or doc_analysis.py skipped.")
        exit()
        
    run_pedagogical_structuring(doc_analysis_json_path)