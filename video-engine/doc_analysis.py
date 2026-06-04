import pymupdf
import pymupdf4llm
from pathlib import Path
import os
from collections import Counter
import re

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

############### Weighting Scoresystem ###############
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

    # return color_cnt.most_common(1)[0][0]
    return color_cnt

dom_color = get_domColor(doc)
# print("Dominant color: ", dom_color)
print(dom_color)

for page in doc:
    blocks = page.get_text("dict")["blocks"]
    for block in blocks:
        if block["type"] == 0:
            for line in block["lines"]:
                for span in line["spans"]:
                    if span["text"].strip() and span["color"] != dom_color:
                        print("Text :", span["text"])
                        print("Color:", span["color"])
                        print("---")

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

############### Text Extraction (markdown-styled) ###############
# md_text = pymupdf4llm.to_markdown(pdf, write_images=True, image_path=f"output_sample/{output_name}") # for testing
md = pymupdf4llm.to_markdown(pdf)
# print(f"extracted texts:\n{txt}\n\n\n")


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
    ]
    return "\n".join(cleaned_lines)
    # return cleaned_lines

cleaned_md = remove_boilerplates(md, threshold = 2)
# print(cleaned_md)


# ############### Write cleaned text in.md File ###############
# with open(f"output_sample/{output_name}/{output_name}.txt", "w") as f:
#     f.write(cleaned_txt)

############### Segmentation ###############
# from dotenv import load_dotenv
# import os

# load_dotenv()
# key = os.getenv("OPENAI_API_KEY")
