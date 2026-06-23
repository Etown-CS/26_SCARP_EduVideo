import json
from openai import OpenAI
from dotenv import load_dotenv

### Load both script_output.json and pedagogical_output.json
script = "output_sample/cs350_llm/script_output.json"
pedagogical = "output_sample/cs350_llm/pedagogical_output.json"

with open(script, "r") as f:
    script_data = json.load(f)
    
with open(pedagogical, "r") as f:
    pedagogical_data = json.load(f)

### Build the same subsegment lookup dictionary
'''
<Purpose>
`pedagogical_output.json` has all the information about the subsegments, 
but `script_output.json` doesn't... only contains ids for each section.
'''
subseg_lookup = {}
for topic in pedagogical_data["segments"]:
    for sub in topic["ordered_subsegments"]:
        subseg_lookup[sub["id"]] = sub

############### Get only Essential subsegments ###############
### Start small - visualize subsegments labeled "essential" first
def get_essential_subsegs(section, subseg_lookup):
    essential_segs = []
    for sid in section["subsegment_ids"]:
        if sid in subseg_lookup:
            sub = subseg_lookup[sid]
            if sub["importance"] == "essential":
                essential_segs.append(sub)
    
    return essential_segs

############### Produce Visual Prompt ###############
'''
LTX-2.3 is good at describing scenes (camera movement, lighting, motion),
but it's uncertain whether it can render readable text or diagrams reliably.

This function supports two prompt styles so we can test both and compare:
- "text": includes on-screen text/diagrams describing key terms directly
- "metaphor": avoids text entirely, uses visual metaphor/abstract imagery instead

Once we've tested both against the actual model, we can decide which style
(or mix) works best and simplify this function.
'''

def gen_visual_prompt(sub, style='text'):
    if style == "text":
        instruction = """Write a short visual description for a 5-10 second video clip
        that visually represent this educational content, including readable on-screen text
        or a simple diagram showing key terms."""

    else:
        instruction = """Write a short video description for a 5-10 second video clip
        that represents this educational content using a visual metaphor or abstract scene. 
        Do not include any on-screen text or diagram with words - describe motion, lighting, 
        camera movement, and imagery only."""

    prompt = f"""You are a Visual Generation Agent Creating prompts for a text-to-video AI model(LTX-2.3).

    Content to visualize: "{sub['content']}"
    Summary: "{sub['summary']}

    {instruction}

    Load with the camera behavior (e.g. "slow zoom in", "static wide shot") before describing the scene.
    Return only the visual prompt text. no explanation."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content.strip()


load_dotenv()
client = OpenAI()

# Test it
test_sub = subseg_lookup["seg_016_002"]  # Decoder-Only Models: GPT

prompt_text_style = gen_visual_prompt(test_sub, style="text")
prompt_metaphor_style = gen_visual_prompt(test_sub, style="metaphor")

print("=== TEXT STYLE ===")
print(prompt_text_style)
print("\n=== METAPHOR STYLE ===")
print(prompt_metaphor_style)