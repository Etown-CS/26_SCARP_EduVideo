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

############### Helper Function 1 - Detect Text Color ###############

# Define dominant color
def get_domColor(pdf_doc):
    color_cnt = Counter()
    for page in pdf_doc: # for each page of input pdf file, get large blocks for content
        blocks = page.get_text("dict")["blocks"]
        for block in blocks: # for each block within a page
            if block["type"] == 0: # block is text-based
                for line in block["lines"]: # for each line in one text block
                    for span in line["spans"]: # for each span (continuous texts with the same style)
                        if span["text"].strip():
                            color_cnt[span["color"]] += 1 # add color

    return color_cnt.most_common(1)[0][0]

def text_in_minorColor(pdf_doc, dom_color):
# Store texts with minor colors(ones not dom_color) in a Set
    minor_color_text = set() # A set to store
    for page in pdf_doc:
        blocks = page.get_text("dict")["blocks"]
        for block in blocks:
            if block["type"] == 0:
                for line in block["lines"]:
                    for span in line["spans"]:
                        if span["text"].strip() and span["color"] != dom_color:
                            minor_color_text.add(span["text"].strip())
    return minor_color_text


############### LLM Filter ###############
def llm_filter(md, client):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": """You are a lecture content filter.
                IMPORTANT: You must preserve ALL of the following:
                - Image paths starting with "![](" — NEVER remove these
                - All actual lecture content (definitions, explanations, code, examples, problems)
                - Code blocks and struct definitions

                ONLY remove these:
                - Title slides (instructor name, course title)
                - Lecture agenda / outline slides
                - Review sections from previous lectures (starting with "Review:")
                - "Questions?" slides
                - Announcements
                - Page numbers, dates, course numbers

                Return ONLY the filtered markdown, preserving original formatting exactly."""
            },
            {
                "role": "user",
                "content": md
            }
        ]
    )
    return response.choices[0].message.content


# ############### Weighting Score System ###############
# # Based on text color, underline, highlight information from PDF input,
# # and markdown symbols from md file,
# # Weight extracted text line by line

# def get_scores(md, minor_color_text):
#     scores = {}
#     for line in md.split("\n"):
#         plain_text = line.strip()
#         score = 0.1

#         # heading
#         if plain_text.startswith("# "):
#             score += 1.0
#         if plain_text.startswith("## "):
#             score += 0.8
#         if plain_text.startswith("### "):
#             score += 0.6
        
#         # bold
#         if "**" in plain_text:
#             score += 0.3
#         # italics
#         if "_" in plain_text:
#             score += 0.2

#         for word in minor_color_text:
#             if word in plain_text:
#                 score += 0.2
#                 break

#         scores[plain_text] = score

#     return scores

# ############### Weighting to importance ###############

# def score_to_importance(score):
#     if score >= 0.7:
#         return "High"
#     elif score < 0.4:
#         return "Low"
#     else:
#         return "Medium"
    

############### LLM Segmentation ###############
def llm_segmentation(filtered_md, client):
    # give the image path to a placeholder
    img = {}
    counter = [0]

    def replace_img(match):
        k = f"IMAGE_PLACEHOLDER_{counter[0]}"
        img[k] = match.group(0)
        counter[0] += 1
        return k
    
    md_no_imgs = re.sub(r'!\[.*?\]\(.*?\)', replace_img, filtered_md)

    # Give LLM the md file put in a placeholder
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": """You are a lecture content segmenter.
                Given lecture content in markdown, group it into meaningful segments with parent-child relationships.
                - Identify main topics and their subtopics based on meaning, not markdown symbols
                - A main topic (parent) should be a core concept (e.g. "Prim's Algorithm")
                - Subtopics (children) should be supporting content under that concept, such as:
                    - How it works / analysis
                    - Examples / applications  
                    - Pseudocode
                    - Exercise / practice
                - Each segment is classified into one from ["definition", "explanation", "example/application", "pseudocode", "exercise problems", "analysis", "visual"]
                - If the subsegment looks imcomplete, such as cut-off pseudocode, delete the subsegment.
                - You MUST keep the image path with a label of "visuals" as type.
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

        # function to convert back the placeholder to the image path
        def restore_img(segments):
            for s in segments:
                for k, path in img.items():
                    s["content"] = s["content"].replace(k, path)
                if "subsegments" in s:
                    restore_img(s["subsegments"])

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
                "content": """You are a topic selector for an educational video pipeline.
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
# file = "cs350_data.pdf" # single page
file = "cs322_mst_all.pdf"

### Format Check
pdf = format_checker(file)
if pdf == None:
    print("Error: Upload PDF file.")
    exit()

### Get a file name for future use
output_name = os.path.splitext(os.path.basename(file))[0]

#### PDF -> Markdown
md = pymupdf4llm.to_markdown(file, write_images=True, image_path=f"output_sample/{output_name}") # for testing

### Apply LLM filter
filtered_md = llm_filter(md, client)

### Generate another md file to compare with cleaned one
with open(f"output_sample/{output_name}/{output_name}-filtered.md", "w") as f: 
    f.write(filtered_md)

with open(f"output_sample/{output_name}/{output_name}.md", "w") as f: 
    f.write(md)

### LLM Segmentation
segments = llm_segmentation(filtered_md, client)

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
with open(f"output_sample/{output_name}/{output_name}-all-topics.json", "w") as f:
    json.dump(result, f, indent=4, ensure_ascii=False)
    print("Saved! - All Segments")

### User prompt - temporal, for testing
user_prompt = "Create a short video with a focus on Prim's algorithm and Kruskal's algorithm"

keep_ids = llm_topic_filter(segments, user_prompt, client)

### Filter segments based on keep_ids
segments = [seg for seg in segments if seg["id"] in keep_ids]

### JSON output - after filtering
result = {
    "topic": output_name,
    "user_prompt": user_prompt,
    "segments": segments
}
with open(f"output_sample/{output_name}/{output_name}.json", "w") as f:
    json.dump(result, f, indent=4, ensure_ascii=False)
    print("Saved! - Filtered segments")
