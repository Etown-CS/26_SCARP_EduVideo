import pymupdf
import pymupdf4llm
from pathlib import Path
import os
from collections import Counter
import re
import json

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

############### Remove boilerplates ###############

def remove_boilerplates(md, threshold=2):
    # Removes some boilerplates repeated in md file (header, footer, date, course number etc.)
    # threshold: how many times a file must appear to be removed.
    # .strip() removes leading & trailing whitespaces, tabs, and new lines by default

    lines = md.split("\n")
    line_cnt = Counter(line for line in lines if line.strip())

    # Add line to cleaned_lines if:
        # the same line doesn't appear more than twice (for header & footer etc.)
        # the line is not empty line
        # the line contains ONLY 2-digit number (page #)
    cleaned_lines = [
        line for line in lines
        if line_cnt.get(line, 0) < threshold
        and line.strip() != ""
        and not re.fullmatch(r'\d+', line.strip())
        and not line.strip().startswith("![](")
        and not re.fullmatch(r'\d{1,2}/\d{1,2}/\d{4}', line.strip())
    ]

    return "\n".join(cleaned_lines)

############### Weighting Score System ###############
# Based on text color, underline, highlight information from PDF input,
# and markdown symbols from md file,
# Weight extracted text line by line

def get_scores(md, minor_color_text):
    scores = {}
    for line in md.split("\n"):
        plain_text = line.strip()
        score = 0.1

        # heading
        if plain_text.startswith("# "):
            score += 1.0
        if plain_text.startswith("## "):
            score += 0.8
        if plain_text.startswith("### "):
            score += 0.6
        
        # bold
        if "**" in plain_text:
            score += 0.3
        # italics
        if "_" in plain_text:
            score += 0.2

        for word in minor_color_text:
            if word in plain_text:
                score += 0.2
                break

        scores[plain_text] = score

    return scores

############### Weighting to importance ###############

def score_to_importance(score):
    if score >= 0.7:
        return "High"
    elif score < 0.4:
        return "Low"
    else:
        return "Medium"
    
############### Segmentation ###############

def segmentation_md(cleaned_md, score):
    segments = [] # list to store segment
    current_segment = None # segment currently being processed
    order = 1 # segment no.

    # Iterate each line
    for line in cleaned_md.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue # skip when empty

        # Start a new segment with heading (#, ##)
        if stripped.startswith("# ") or stripped.startswith("## "):
            if current_segment:
                segments.append(current_segment)
            current_segment = {
                "id": f"seg_{order:03d}",
                "type": "TBD",  # rule-based or LLM
                "content": stripped,
                "importance": score_to_importance(scores.get(stripped, 0.3)),
                "order": order
            }
            order += 1
        else:
            # everything else is added to the current segment
            if current_segment:
                current_segment["content"] += "\n" + stripped

    # After the last segment, add it to the list
    if current_segment:
        segments.append(current_segment)

    # for segment in segments:
    #     print(f"ID: {segment['id']}")
    #     print(f"Type: {segment['type']}")
    #     print(f"Importance: {segment['importance']}")
    #     print(f"Content:\n{segment['content']}")
    #     print("-" * 20)

    return segments

############### Main ###############
####input
# file = "cs350_data.pdf" # single page
file = "cs322_mst.pdf"

### Format Check
pdf = format_checker(file)
if pdf == None:
    print("Error: Upload PDF file.")
    exit()

#### Get a file name for future use
output_name = os.path.splitext(os.path.basename(file))[0]

#### PDF -> Markdown
md = pymupdf4llm.to_markdown(file, write_images=True, image_path=f"output_sample/{output_name}") # for testing

### Clean the md file
cleaned_md = remove_boilerplates(md, threshold=2) 

# ### Write cleaned text in.md File 
# with open(f"output_sample/{output_name}/{output_name}.md", "w") as f:
#     f.write(cleaned_md)

# ### Generate another md file to compare with cleaned one
# with open(f"output_sample/{output_name}/{output_name}-original.md", "w") as f: 
#     f.write(md)

### Get dominant color and a set of texts in non-dominant color of the pdf
dom_color = get_domColor(pdf)
minor_colored_text = text_in_minorColor(pdf, dom_color)

### Scoring
scores = get_scores(cleaned_md, minor_colored_text)

### Get segmentation & output it as json file
segment_out = segmentation_md(cleaned_md, scores)

result = {
    "topic": output_name,
    "segments": segment_out
}
with open(f"output_sample/{output_name}/{output_name}.json", "w") as f:
    json.dump(result, f, indent=4, ensure_ascii=False)
    print("Saved!")
