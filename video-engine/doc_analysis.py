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

'''
### Overview of Process ###

Format checker
↓
Dominant color detection (grouping all the colour used in the pdf into a single dominant color and other minor colors)
(require pdf)
↓
PDF-MD conversion (text extraction)
↓
Remove boilerplates
↓
weighting scoring system

Note: if we want to remove boilerplates first, before doing color, there is a companion lib `markdown-pdf`

'''

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
                Remove sections that are NOT actual lecture content, such as:
                - Title, dates, name of the instructor
                - Lecture agenda, lecture outline
                - Review
                - slides to ask if anyone has any questions in the middle of the class ("Questions?", "Any questions?", etc)
                - any types of announcement, such as for the next class and for the assignment
                - lecture date, course number as a combination of alphabets and numbers, page numbers,
                Also, keep the path of the images extracted starting with "![](...", but remove text extracted from the picture (**----- Start of picture text -----**<br>X<br>**----- End of picture text -----**<br>).
                Keep all actual lecture content (definitions, explanations, code, examples, exercise problems).
                Return ONLY the filtered markdown, preserving the original formatting."""
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
                    - Implementation / pseudocode
                    - Exercise / practice
                    - image path
                - importance should be based on how essential it is to the main topic
                - Return ONLY a valid JSON array, no explanation, no markdown formatting:
                [
                    {
                    "id": "seg_001"
                    "type": "core topic"
                    "content": "actual text extracted"
                    "order": 1
                        "subsegments": [
                            {
                            "id": "seg_001_001",
                            "type": pick one from ["sub-topic", "definition", "explanation", "example/application", "code_example", "exercise", "analysis", "image", "Others"],
                            "content": "actual text extracted",
                            "order": 1
                            }
                        ]
                    }
                ]"""
            },
            {
                "role": "user",
                "content": filtered_md
            }
        ]
    )
    try:
        return json.loads(response.choices[0].message.content)
    except json.JSONDecodeError:
        print("Error: LLM output is not valid JSON")
        print(response.choices[0].message.content)
        return []
    
############### Main ###############
####input
# file = "cs350_data.pdf" # single page
file = "cs322_mst.pdf"

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

# ### Write cleaned text in.md File 
# with open(f"output_sample/{output_name}/{output_name}.md", "w") as f:
#     f.write(cleaned_md)

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

### JSON output
result = {
    "topic": output_name,
    "segments": segments
}
with open(f"output_sample/{output_name}/{output_name}.json", "w") as f:
    json.dump(result, f, indent=4, ensure_ascii=False)
    print("Saved!")
