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
inputFile = "topo_lec.pdf" # for test
fType = Path(inputFile).suffix # returns ".pdf", ".jpg", etc.

############### Format Checker ###############
# if pdf, return pdf
if fType == '.pdf':
    pdf = inputFile
# else, show error msg (Image format needs OCR)
else:
    print("Error: Unable to proccess this format.")
    exit()

############### Text Extraction (markdown-styled) ###############
md_text = pymupdf4llm.to_markdown(pdf, write_images=True, image_path="output_sample/") 
# print("Here's what's converted into markdown!\n\n", md_text) # for testing

############### Write extracted text in.md File ###############
output_name = os.path.splitext(os.path.basename(inputFile))[0]  # gets "topo_lec" from "topo_lec.pdf"
with open(f"output_sample/{output_name}.md", "w") as f:
    f.write(md_text)