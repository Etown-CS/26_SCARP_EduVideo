import pymupdf
import pymupdf4llm
from pathlib import Path
import os
import re
import json
from openai import OpenAI
from dotenv import load_dotenv
from targeting_level_rubric import DIFFICULTY_RUBRIC

import argparse
import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
import numpy as np

### LLM
load_dotenv()
client = OpenAI()

### System Prompt for llm_segmentation
SYSTEM_PROMPT = """

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

############### Format Checker ###############
# if pdf, return pdf
def format_checker(file):
    '''
    This system only takes a PDF file.
    '''
    f_type = Path(file).suffix
    if f_type == '.pdf':
        # Create a subfolder for each input
        output_name = os.path.splitext(os.path.basename(file))[0]  # Gets "cs322_mst.pdf" with os.path.basename(file), and gets "cs322_mst" with os.path.splitext()[0]
        output_name = os.path.splitext(os.path.basename(file))[0]  # Gets "cs322_mst.pdf" with os.path.basename(file), and gets "cs322_mst" with os.path.splitext()[0]
        os.makedirs(f"output_sample/{output_name}", exist_ok=True)
        pdf_doc = pymupdf.open(file)
        return pdf_doc

######################## LLM Cleaning + Segmentation #######################
def llm_segmentation(md, client, user_prompt):
    '''
    This function takes a clean markdown without a course information, a lecture date, page numbers. 
    - In order to prevent the LLM from mismanaging the images paths, use functions to replace them with placeholders and replace back place holders with image tags.
    - Collects all the images without randomly skipping them, and reattaches them to the most relevant topics.
    - Add the descriptions to all the images.
    '''
    ### Replace image tags with placeholders
    cleaned_md_no_imgTags, imgTag_ph_map, imgContext_map = imageTags_to_placeholders(md)

    ### Give LLM the md file put in a placeholder
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": DIFFICULTY_RUBRIC + SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": cleaned_md_no_imgTags
            }
        ]
    )
    try:
        ### Get response
        raw = response.choices[0].message.content
        clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = json.loads(clean)

        ### Restore images
        placeholders_to_imageTags(result, imgTag_ph_map)

        ### Rcover skipped images
        collect_dropped_imgs(result, imgTag_ph_map, imgContext_map, client)

        ### Add description to images
        add_image_description(result, client, user_prompt)

        return result
    
    except json.JSONDecodeError:
        print("Error: LLM output is not valid JSON")
        print(response.choices[0].message.content)
        return []

############### Helper functions: Process image placeholders ###############
def imageTags_to_placeholders(md_text):
    '''
    Purpose: Replace the image tags in the Markdown file with placeholders (IMAGE_PLACEHOLDER_n)
            ![](...) -> "IMAGE_PLACEHOLDER_1"
    Returns: Markdown file with images replaced with placeholders, and a map table of images,
            and a map of text that just appeared before each image
    '''
    img_placeholder_map = {}
    img_context_map = {}
    counter = 0

    def _replacer(match, context_chars = 100):
        '''
        This private function does two things, and returns key ('IMAGE_PLACEHOLDER_n')
        - Converts the image path that re.sub in the outer function caught into a placeholder
        - Grab 100 characters of texts right before the image to utilize it for embedding matching to reattch dropped images to the raight place.
        a chunk of text is stored in the dictionary like {"IMAGE_PLACEHOLDER_n": "a chunk of text}

        '''
        nonlocal counter # Can reach to the outer scope
        key = f"IMAGE_PLACEHOLDER_{counter}"
        img_placeholder_map[key] = match.group(0)

        ### Get texts before the image - for the embedding part
        # match.start() is the position of img tag in the ORIGINAL md_text
        # *** re.sub scans the original string while substituting, so this position is still valid
        start = match.start()
        context_start = max(0, start - context_chars)
        img_context_map[key] = md_text[context_start:start].strip()

        counter += 1
        return key
    
    clean_md = re.sub(r"!\[.*?\]\(.*?\)", _replacer, md_text)
        # 1. Find a image tag that matches "!\[.*?\]\(.*?\)"
        # 2. Provide the image tag to _replacer as an argument 'match'
        # 3. _replacer returns a placeholder and replace the image tag in md_text with it

    return clean_md, img_placeholder_map, img_context_map

def placeholders_to_imageTags(segments, img_placeholder_map):
    '''
    This function recursively replaces the placeholders back to the image tags. 
    "IMAGE_PLACE..." -> ![](...)
    '''
    for seg in segments:
        if "content" in seg:
            for key, orig_path in img_placeholder_map.items():
                seg['content'] = seg['content'].replace(key, orig_path)
        if "subsegments" in seg:
            placeholders_to_imageTags(seg['subsegments'], img_placeholder_map)

############### Detects dropped images and reattaches them to the semantically close segments ###############
def collect_dropped_imgs(segments, img_placeholder_map, img_context_map, client):
    '''
    This function does things:
    - Identifies images the LLM dropped
    - Reattach them to the best segment where their context highly matches with
        + If no good match found, it falls to a generic segment "Additional Visuals" segment at the end of the segments.
    '''

    used_keys = set()

    def _collect(segments):
        '''
        This private function checks if all images appear in any segmemnts.
        The image placeholders which appeared are stored in used_key, which will be used to identify which images are missed.
        '''
        for s in segments:
            content = s.get("content", "")
            for key, orig_path in img_placeholder_map.items():
                if orig_path in content or key in content:
                    used_keys.add(key) # record which image is added properly to its parent seg.
            if "subsegments" in s:
                _collect(s["subsegments"]) # Recursively call for subsegments

    _collect(segments)

    ### Identify which images are missing
    # img_placeholder_map - used_key = missing_key
    missing_keys = [key for key in img_placeholder_map if key not in used_keys]

    if not missing_keys:
        return
    
    ### When there are missed images, get the embedding of the segments
    seg_embedding_map = get_seg_embedding(segments, client)
    print(f"⚠️ Warning: {len(missing_keys)} image(s) were dropped by the model's output")
    
    left = []
    for key in missing_keys:
        context = img_context_map.get(key, "")
        target_seg, best_score = find_best_matching_seg(context, segments, seg_embedding_map, client)
        imageTag = img_placeholder_map[key]

        ### Reattach dropped images to the parent segment
        if target_seg is not None:
            target_seg.setdefault("subsegments", []) # Set an empty list in case there is no subsegment in the parent segment
            next_order = len(target_seg["subsegments"]) + 1
            target_seg["subsegments"].append({
                "id": f"{target_seg["id"]}_recovered_{next_order:03d}",
                "type": "visual",
                "content": imageTag,
                "order": next_order,
                "Recovered?": True,
                "match_score": round(best_score, 3)
            })

        else:
            left.append(imageTag)
    
    ### Put images with no reasonable match in the generic segment
    if left:
        segments.append({
            "id": "seg_recovered",
            "type": "core topic",
            "content": "Additional visuals",
            "order": len(segments) + 1,
            "subsegments": [
                {
                    "id": f"seg_recovered_{i+1:03d}",
                    "type": "visual",
                    "content": c,
                    "order": i + 1
                }
                for i, c in enumerate(left)
            ]
        })

def find_best_matching_seg(context, segments, seg_embedding_map, client, threshold=0.25):
    '''
    Compare text surrounding the image with all the segments and returns the best parent segment to bring dropped image back.
    If no segments found, it can fall back to the visual segment instead of a wrong guess.
    '''

    best_seg = None
    best_score = 0.0

    v_context = embedding_text(context, client)

    for seg_id in seg_embedding_map:
        score, v_context, v_seg = similarity_check(v_context, seg_embedding_map[seg_id])
        if score > best_score:
            best_score = score
            for s in segments:
                if s["id"] == seg_id:
                    best_seg = s

    return best_seg if best_score >= threshold else None, best_score

############################## Interpret images ##############################
def add_image_description(segments, client, user_prompt, max_workers=10):
    '''
    This function creates descriptions of the images, by converting it into Base64 encoded image and reading it with the LLM.
    - Find images from all the segments
    - Call describe_image() in parallel with ThreadPoolExecutor to spped up
    - max_worker=5: how many requests it sends simulaneously
    - What was changed?: Get a visual seg and call LLM for describe_image() -> Get all visual segments and process them in parallel
        + Less LLM calls, multiple segments are processed at a time
    '''
    ### First, recursively collect all "visual" segments that need a description
    visual_segs = []
    def _collect_visuals(segs):
        for seg in segs:
            if seg["type"] == "visual":
                visual_segs.append(seg)
            if "subsegments" in seg:
                _collect_visuals(seg["subsegments"]) # Call it again

    _collect_visuals(segments)

    def _describe_one(v_seg):
        ''' Process only one image to get a description '''
        image_path = re.search(r"\((.*?)\)", v_seg['content']).group(1) # Remove "![]()" to get an actual path | .group(0) includes parenthesis, .group(1) only takes strings inside ()
        return v_seg, describe_image(image_path, client, user_prompt) # needs to be tuple because of as_completed(futures) later

    ### Parallel executions
    with ThreadPoolExecutor(max_workers=max_workers) as executor: # wrapping with 'with' allows to release resource after the process is done.
        futures = [executor.submit(_describe_one, v_seg) for v_seg in visual_segs] # futures = receives the result
        # executor.submit(_describe_one, seg) ... Run _describe_one(v_seg), but goes to the next segment without waiting result.
        # As it finishes processing each segment, the result is added to futures
        for future in as_completed(futures): # start processing ones whose result is returned
            v_seg, description = future.result()
            v_seg["image_description"] = description # Add the new key

def describe_image(image_path, client, user_prompt):
    with open(image_path, "rb") as f:
        base64_image = base64.b64encode(f.read()).decode("utf-8")

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"The user is watching an educational video with this focus: \"{user_prompt}\". "
                        "Describe what this image shows and why it matters, as if briefly explaining it out loud to a student. "
                        "Prioritize the meaning and purpose of the image over a detailed visual description. "
                        "If this image is directly relevant to the user's focus above, give a fuller explanation (up to 5-6 sentences) covering the key details a student would need. "
                        "If it's only loosely related or background context, keep it to 1-2 sentences. "
                        "Do NOT use bullet points, numbered lists, or mathematical notation like \\( \\alpha \\) -- describe any symbols or labels in plain words instead (e.g. say 'a point labeled alpha' rather than writing the symbol). "
                        "Speak naturally, like a spoken explanation, not a technical breakdown."
                    },
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}}
                ]
            }
        ]
    )
    return response.choices[0].message.content.strip()

############################## Text Embedding ##############################
def embedding_text(text, client, model="text-embedding-3-small"):
    ''' Convert text into a vector '''
    if not text.strip(): # Remove leading and trailing whitespaces
        text = " "
    response = client.embeddings.create(
        input=text,
        model=model
    )
    return response.data[0].embedding

def get_seg_embedding(segments, client, model="text-embedding-3-small"):
    '''
    Convert all segments into vectors to compare with the embedded images for the semantic similarity
    '''
    seg_ids = []
    combined_texts_all = [] # all segments

    for seg in segments:
        texts = [seg.get("content", "")]
        for sub in seg.get("subsegments", []):
            texts.append(sub.get("content", ""))
        seg_combined = " ".join(texts) # each segment

        if not seg_combined.strip():
            seg_combined = " "
        seg_ids.append(seg["id"])
        combined_texts_all.append(seg_combined)

    # Call the embedding model only once and embed all topics
    response = client.embeddings.create(input=combined_texts_all, model=model)

    seg_embedding_map = {}
    for seg_id, item in zip(seg_ids, response.data):
        seg_embedding_map[seg_id] = item.embedding
        
    return seg_embedding_map

############################# Similarity Check (Cosine Similarity) #############################
def similarity_check(v_context, v_seg):
    ### np.linalg.norm & np.dot automatically does np.array, but explicitly converts them into arrays for readability
    v_context = np.array(v_context)
    v_seg = np.array(v_seg)
    
    # cosine similarity - (a * b) / (||a|| * ||b|| )
    similarity = np.dot(v_context, v_seg) / (np.linalg.norm(v_context) * np.linalg.norm(v_seg))

    return similarity, v_context, v_seg

############### LLM Topic Filter with User Prompt ###############
def llm_topic_filter(segments, user_prompt, client):
    '''
    This function filters out segments based on the user_prompt
    '''
    ### Create a simple list of topic id + name (not the entire content!!)
    topics = "\n".join([f"{seg["id"]}: {seg["content"]}" for seg in segments])

    response = client.chat.completions.create(
        model="gpt-4o",
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

############################################## Main ##############################################
def run_doc_analysis(file, user_prompt, output_name):
    ### Format Check
    pdf = format_checker(file)

    if pdf is None:
        print("Error: Upload PDF file.")
        exit()

    print("📄🔄 Analyzing Document ...") # Status

    #### PDF -> Markdown
    md = pymupdf4llm.to_markdown(file, write_images=True, image_path=f"output_sample/{output_name}") 

    ### LLM Segmentation
    segments = llm_segmentation(md, client, user_prompt)

    ### Add id and order
    for i, seg in enumerate(segments):
        seg["id"] = f"seg_{i+1:03d}"
        seg["order"] = i + 1
        for j, sub in enumerate(seg.get("subsegments", [])):
            sub["id"] = f"seg_{i+1:03d}_{j+1:03d}"
            sub["order"] = j + 1

    ### Filter segments based on keep_ids
    keep_ids = llm_topic_filter(segments, user_prompt, client)

    ### Update segments with keep_ids
    segments = [seg for seg in segments if seg["id"] in keep_ids]

    ### JSON output - after filtering
    result = {
        "topic": output_name,
        "user_prompt": user_prompt,
        "segments": segments
    }
    with open(f"output_sample/{output_name}/doc_analysis_output.json", "w") as f:
        json.dump(result, f, indent=4, ensure_ascii=False)
    
        print(f"\n✅ doc_analysis_output.json saved to {output_name}!")
    
    return f"output_sample/{output_name}/doc_analysis_output.json"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Process a lecture PDF into segmented JSON."
    )
    parser.add_argument("file", help="Path to input PDF file")
    parser.add_argument(
        "-p",
        "--prompt",
        default="Create a short video focusing on the main topic",
        help="User prompt describing what to focus on",
    )
    parser.add_argument(
        "output_name",
        nargs="?",
        default=None,
        help="Folder name for output (defaults to PDF name)",
    )

    args = parser.parse_args()

    # Fallback to PDF stem if no custom output name is given
    if args.output_name is None:
        args.output_name = Path(args.file).stem

    return args

if __name__ == "__main__":
    args = parse_args()
    run_doc_analysis(args.file, args.prompt, args.output_name)

    # # test
    # description = describe_image("output_sample/cs350_llm/cs350_llm.pdf-0020-01.png", client)
    # print(description)