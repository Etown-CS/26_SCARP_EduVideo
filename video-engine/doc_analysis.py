'''
### Process ###

input
 vvv
Check the file type
  L if pdf: keep using it to get text
  L else: program terminates. 
 vvv
Get markdown-styled text
 vvv
Write it in .md file

'''
import pymupdf
import pymupdf4llm
from pathlib import Path
import os

# Get the type of input
inputFile = "topo_lec.pdf" # for test (single-page pdf)
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
md_text = pymupdf4llm.to_markdown(pdf, write_images=True, image_path=f"output_sample/{output_name}") 
# print("Here's what's converted into markdown!\n\n", md_text) # for testing

############### Write extracted text in.md File ###############
output_name = os.path.splitext(os.path.basename(inputFile))[0]  # gets "topo_lec" from "topo_lec.pdf"
with open(f"output_sample/{output_name}/{output_name}.md", "w") as f:
    f.write(md_text)