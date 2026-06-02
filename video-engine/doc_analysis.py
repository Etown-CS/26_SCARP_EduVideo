import pymupdf
import pymupdf4llm
from pathlib import Path
import os

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

############### Text Extraction (markdown-styled) ###############
# md_text = pymupdf4llm.to_markdown(pdf, write_images=True, image_path=f"output_sample/{output_name}") # for testing
md_text = pymupdf4llm.to_markdown(pdf)
# print(f"md-styled texts:\n{md_text}\n\n\n")


############### Remove boilerplates ###############
from collections import Counter

def remove_boilerplates(md_text, threshold=2):
    # Removes some boilerplates repeated in md file (header, footer, date, course number etc.)
    # threshold: how many times a file must appear to be removed.
    # .strip() removes leading & trailing whitespaces, tabs, and new lines by default

    lines = md_text.split("\n")
    line_cnt = Counter(line for line in lines if line.strip())

    cleaned_lines = [
        line for line in lines
        if line_cnt.get(line, 0) < threshold and line.strip() != ""
    ]
            
    return "\n".join(cleaned_lines)

md_text = remove_boilerplates(md_text, threshold = 2)

# ############### Write cleaned text in.md File ###############
# with open(f"output_sample/{output_name}/{output_name}.md", "w") as f:
#     f.write(md_text)

############### Get text from md file ###############
from langchain_text_splitters import MarkdownHeaderTextSplitter

# Define the headers you want to split on
headers_to_split_on = [
    ("#", "Header 1"),
    ("##", "Header 2"),
    ("-", "bullet point"),
    ("\n", "newLine")
]

splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
segments = splitter.split_text(md_text)

for segment in segments:
    print(segment.page_content)
    print(segment.metadata)
