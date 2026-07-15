'''
### Overview of Process ###

Format checker
↓
PDF-MD conversion (text extraction)
↓
LLM filter to remove unrelated content
↓
LLM segmentation

'''

import pymupdf
import pymupdf4llm
from pathlib import Path
import os
from collections import Counter
import re
import json
from openai import OpenAI
from dotenv import load_dotenv
from targeting_level_rubric import DIFFICULTY_RUBRIC


### LLM
load_dotenv()
client = OpenAI()

############### Format Checker ###############
# if pdf, return pdf
def format_checker(file):
    f_type = Path(file).suffix
    if f_type == '.pdf':
        # Create a subfolder for each input
        output_name = os.path.splitext(os.path.basename(file))[0]  # gets "topo_lec" from "topo_lec.pdf"
        os.makedirs(f"output_sample/{output_name}", exist_ok=True)
        pdf_doc = pymupdf.open(file)
        return pdf_doc

############### LLM Cleaning + Segmentation ###############
def llm_segmentation(md, client):
    # give the image path to a placeholder
    img = {}
    counter = [0]

    def replace_img(match):
        k = f"IMAGE_PLACEHOLDER_{counter[0]}"
        img[k] = match.group(0)
        counter[0] += 1
        return k
    
    md_no_imgs = re.sub(r'!\[.*?\]\(.*?\)', replace_img, md)

    # Give LLM the md file put in a placeholder
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": DIFFICULTY_RUBRIC + """

                You are a lecture content filter and segmenter, working in a single pass.

                STEP 1 — FILTER (apply this before segmenting; do not output this step separately):
                Exclude the following entirely — do not create segments for them:
                - Title slides (instructor name, course title)
                - Lecture agenda / outline slides
                - Review sections from previous lectures (starting with "Review:")
                - "Questions?" slides
                - Announcements
                - Page numbers, dates, course numbers

                IMPORTANT: Never exclude a slide, or any part of it, solely because it
                contains an IMAGE_PLACEHOLDER_n token. If a slide otherwise matches an
                exclusion category above but contains an image, keep the image (create a
                "visual" segment for it) and discard only the surrounding text.

                Preserve everything else exactly as-is: definitions, explanations, code,
                examples, problems, code blocks, struct definitions, and any
                IMAGE_PLACEHOLDER_n tokens — these must NEVER be removed under any
                circumstances.

                STEP 2 — SEGMENT:
                Given the remaining lecture content in markdown, group it into meaningful
                segments with parent-child relationships.
                - Identify main topics and their subtopics based on meaning, not markdown symbols
                - A main topic (parent) should be a core concept (e.g. "Prim's Algorithm")
                - Subtopics (children) should be supporting content under that concept, such as:
                    - How it works / analysis
                    - Examples / applications
                    - Pseudocode
                    - Exercise / practice
                - Each segment is classified into one from ["definition", "explanation", "example/application", "pseudocode", "exercise problems", "analysis", "visual"]
                - If a subsegment looks incomplete, such as cut-off pseudocode, delete it.
                - You MUST keep any IMAGE_PLACEHOLDER_n token, with type "visual".
                - Return ONLY a valid JSON array, no explanation, no markdown formatting:
                [
                    {
                        "id": "seg_001",
                        "type": "core topic",
                        "content": "actual text extracted",
                        "order": 1,
                        "subsegments": [
                            {
                                "id": "seg_001_001",
                                "type": "definition",
                                "content": "actual text extracted",
                                "order": 1
                            }
                        ]
                    }
                ]"""
            },
            {
                "role": "user",
                "content": md_no_imgs
            }
        ]
    )
    try:
        result = json.loads(response.choices[0].message.content)

        def restore_img(segments):
            for s in segments:
                for k, path in img.items():
                    s["content"] = s["content"].replace(k, path)
                if "subsegments" in s:
                    restore_img(s["subsegments"])

        restore_img(result)

        ### Safety net: always recover any image the model forgot to include ###
        def collect_used_images(segments):
            used = set()
            for s in segments:
                for k in img:
                    if img[k] in s["content"]:
                        used.add(k)
                if "subsegments" in s:
                    used |= collect_used_images(s["subsegments"])
            return used

        used_keys = collect_used_images(result)
        missing_keys = [k for k in img if k not in used_keys]

        if missing_keys:
            print(f"Warning: {len(missing_keys)} image(s) were dropped by the model's output; appending them at the end")
            result.append({
                "id": "seg_recovered",
                "type": "core topic",
                "content": "Additional visuals",
                "order": len(result) + 1,
                "subsegments": [
                    {
                        "id": f"seg_recovered_{i+1:03d}",
                        "type": "visual",
                        "content": img[k],
                        "order": i + 1
                    }
                    for i, k in enumerate(missing_keys)
                ]
            })

        restore_img(result)
        return result
    
    except json.JSONDecodeError:
        print("Error: LLM output is not valid JSON")
        print(response.choices[0].message.content)
        return []
    

############### LLM Topic Filter with User Prompt ###############
def llm_topic_filter(segments, user_prompt, client):
    # Create a simple list of topic id + name (not the entire content!!)
    topics = "\n".join([f"{seg["id"]}: {seg["content"]}" for seg in segments])

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages = [
            {
                "role": "system",
                "content": DIFFICULTY_RUBRIC + """You are a topic selector for an educational video pipeline.
                Given a list of topics and a user's request, decide which topics are relevant to keep.
                Return ONLY a JSON list of topic ids to KEEP, like:
                ["seg_001", "seg_003"]
                No explanation, no markdown formatting."""
            },
            {
                "role": "user",
                "content": f"User request: {user_prompt}\n\nTopics:\n{topics}"
            }
        ]
    )

    raw = response.choices[0].message.content
    ### json fences handling
    clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    keep_ids = json.loads(clean)

    return keep_ids


############### Main ###############
####input
file = "cs350_llm.pdf"
# file = "cs322_mst_all.pdf"

### User prompt - temporal, for testing
user_prompt = "Create a short video focusing on Large Language Model(LLM)"
# user_prompt = "Create a short video with a focus on Prim's algorithm and Kruskal's algorithm"

### Format Check
pdf = format_checker(file)
if pdf == None:
    print("Error: Upload PDF file.")
    exit()

### Get a file name for future use
output_name = os.path.splitext(os.path.basename(file))[0]

#### PDF -> Markdown
md = pymupdf4llm.to_markdown(file, write_images=True, image_path=f"output_sample/{output_name}") # for testing

# with open(f"output_sample/{output_name}/extracted.md", "w") as f: 
#     f.write(md)

### LLM Segmentation
segments = llm_segmentation(md, client)

### Add id and order
for i, seg in enumerate(segments):
    seg["id"] = f"seg_{i+1:03d}"
    seg["order"] = i + 1
    for j, sub in enumerate(seg.get("subsegments", [])):
        sub["id"] = f"seg_{i+1:03d}_{j+1:03d}"
        sub["order"] = j + 1

### JSON output - before filtering
result = {
    "topic": output_name,
    "segments": segments
}
# with open(f"output_sample/{output_name}/segmented-all.json", "w") as f:
#     json.dump(result, f, indent=4, ensure_ascii=False)
#     print("Saved! - All Segments")

### Filter segments based on keep_ids
keep_ids = llm_topic_filter(segments, user_prompt, client)

segments = [seg for seg in segments if seg["id"] in keep_ids]

### JSON output - after filtering
result = {
    "topic": output_name,
    "user_prompt": user_prompt,
    "segments": segments
}
with open(f"output_sample/{output_name}/doc_analysis_output.json", "w") as f:
    json.dump(result, f, indent=4, ensure_ascii=False)
    print("Saved!")
