import json
import re
import os
from openai import OpenAI
from dotenv import load_dotenv

from pathlib import Path

from remote_gpu_utils import scp_to_remote, scp_from_remote, run_remote_command, REMOTE_WORK_DIR
from visual_prompt_gen import gen_visual_prompts_4section, ENABLE_ON_SCREEN_KEYWORDS, MODEL_NAME

load_dotenv()
client = OpenAI()

def run_visual_gen(script_json, output_folder, client):
    file = script_json
    with open(file, "r") as f:
        script_data = json.load(f)
    print("📑 Loaded JSON file! 📑") # Status

    print("🔨 Processing by sections ... 🔨") # Status
    all_clip_prompts = []
    for section in script_data["sections"]:
        key_points = section.get("key_points", []) if ENABLE_ON_SCREEN_KEYWORDS else []
        section_clips = gen_visual_prompts_4section(client, section, key_points=key_points)
        all_clip_prompts.extend(section_clips)

    ### Save output for the next pipeline stage (video generation) ###
    print("🔄 Making output JSON file ... 🔄") # Status
    prompt_json_path = os.path.join(output_folder, "visual_prompts.json")
    with open(prompt_json_path, "w") as f:
        json.dump(
            {"topic": script_data.get("topic"), "model": MODEL_NAME, "clips": all_clip_prompts},
            f,
            indent=4,
            ensure_ascii=False,
        )
        print(f"✅ Saved! - {len(all_clip_prompts)} clip prompts -> {output_folder}")

    # scp_to_remote(prompt_json_path, f"{REMOTE_WORK_DIR}/visual_prompts.json")
    # run_remote_command(f"cd {REMOTE_WORK_DIR} && python visual_gen.py")
    # scp_from_remote(f"{REMOTE_WORK_DIR}/clips/", f"{output_folder}/clips/")

if __name__ == "__main__":
    fileName = input("Provide a valid folder name: ")
    script_json_path = Path(f"output_sample/{fileName}/script_output.json")
    output_folder = Path(f"output_sample/{fileName}")

    if output_folder.exists() == False or script_json_path.exists() == False:
        print(f"Folder not found or some steps skipped.")
        exit()
        
    run_visual_gen(script_json_path, output_folder, client)