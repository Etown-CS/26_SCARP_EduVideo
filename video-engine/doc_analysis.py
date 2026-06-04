import pymupdf
import pymupdf4llm
from pathlib import Path
import os
from collections import Counter
import re

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

# Get the type of input
# inputFile = "topo_lec.pdf" # for test (single-page pdf)
inputFile = "cs322_bfs.pdf" # for test (multiple-page pdf)
fType = Path(inputFile).suffix # returns ".pdf", ".jpg", etc.

# Create a new folder to store the output
os.makedirs("output_sample", exist_ok=True)

############### Format Checker ###############
# if pdf, return pdf
if fType == '.pdf':
    pdf = inputFile
    # Create a subfolder for each input
    output_name = os.path.splitext(os.path.basename(inputFile))[0]  # gets "topo_lec" from "topo_lec.pdf"
    os.makedirs(f"output_sample/{output_name}", exist_ok=True)
# else, show error msg (Image format needs OCR)
else:
    print("Error: Unable to proccess this format.")
    exit()

############### Helper Function 1 - Detect Text Color ###############
doc = pymupdf.open(inputFile)

# Define dominant color
def get_domColor(doc):
    color_cnt = Counter()
    for page in doc: # for each page of input pdf file, get large blocks for content
        blocks = page.get_text("dict")["blocks"]
        for block in blocks: # for each block within a page
            if block["type"] == 0: # block is text-based
                for line in block["lines"]: # for each line in one text block
                    for span in line["spans"]: # for each span (continuous texts with the same style)
                        if span["text"].strip():
                            color_cnt[span["color"]] += 1 # add color

    return color_cnt.most_common(1)[0][0]

dom_color = get_domColor(doc)
print("Dominant color: ", dom_color)


# Store texts with minor colors(ones not dom_color) in a Set
minor_color = set() # A set to store
for page in doc:
    blocks = page.get_text("dict")["blocks"]
    for block in blocks:
        if block["type"] == 0:
            for line in block["lines"]:
                for span in line["spans"]:
                    if span["text"].strip() and span["color"] != dom_color:
                        minor_color.add(span["text"].strip())

############### PDF -> Markdown Conversion ###############
md = pymupdf4llm.to_markdown(pdf, write_images=True, image_path=f"output_sample/{output_name}") # for testing

############### Remove boilerplates ###############
from markdown_pdf import MarkdownPdf, Section

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
    ]

    return "\n".join(cleaned_lines)

cleaned_md = remove_boilerplates(md, threshold = 2)

############### Weighting Score System ###############
# Based on text color, underline, highlight information from PDF input,
# and markdown symbols from md file,
# Weight extracted text line by line

def score_by_line(line, minor_color):
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

    for word in minor_color:
        if word in plain_text:
            score += 0.2
            break

    return score
    
for line in cleaned_md.split("\n"):
    score = score_by_line(line, minor_color)
    print(f"{score:.1f} | {line}")

# ############### Write cleaned text in.md File ###############
# with open(f"output_sample/{output_name}/{output_name}.txt", "w") as f:
#     f.write(cleaned_txt)

############### Segmentation ###############
# from dotenv import load_dotenv
# import os

# load_dotenv()
# key = os.getenv("OPENAI_API_KEY")
