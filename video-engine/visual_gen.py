import json
import os
import re
from pathlib import Path

from openai import OpenAI
from dotenv import load_dotenv

import subprocess

from remote_gpu_utils import scp_to_remote, scp_from_remote, run_remote_command, REMOTE_WORK_DIR
from visual_prompt_gen import gen_clips_with_audio_4section, ENABLE_ON_SCREEN_KEYWORDS, MODEL_NAME
from audio_gen import tts_pipeline

load_dotenv()
client = OpenAI()

####################### Combine clips #######################
def combine_clips(clips_dir, output_path):
    print(f"[debug] Looking for clips in: {clips_dir}") # for debug
    print(f"[debug] Files found: {os.listdir(clips_dir)}") # for debug

    ### Make a tuple like "section-1_clip1.mp4" -> (1, 1), to properly compare them as number
    def sort_key(filename):
        match = re.match(r"section-(\d+)_clip(\d+)_with_audio\.mp4", filename)  # No need of (/d) if you just wanna know T/F
        return (int(match.group(1)), int(match.group(2)))

    clip_files = sorted(
        (f for f in os.listdir(clips_dir) 
        if f.endswith(".mp4") and re.match(r"section-\d+_clip\d+_with_audio\.mp4", f)),
        key=sort_key
    )

    concat_list_path = os.path.join(clips_dir, "concat_list.txt")
    with open(concat_list_path, "w") as f:
        for clip_file in clip_files:
            f.write(f"file '{clip_file}'\n")

        ### Force to write to the disk at OS level
        f.flush()
        os.fsync(f.fileno())

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", "concat_list.txt",
        "-c", "copy",
        os.path.basename(output_path),
    ]
    subprocess.run(cmd, check=True, cwd=clips_dir)

################################## Combine audio to full video ##################################
def combine_audio_video(video_path, audio_path, output_path):
    cmd = [
        "ffmpeg", "-y",    # enable to overwrite
        "-i", video_path,
        "-i", audio_path,
        "-c:v", "copy",    # encode method for video (just copy this time)
        "-c:a", "aac",     # encode method for audio (conver into aac to fit .mp4)
        "-shortest",       # Takes shorter one (video vs audio)
        output_path,
    ]
    subprocess.run(cmd, check=True)

######################################### Main #########################################
def run_visual_gen(script_json, client):
    file = script_json
    output_dir = os.path.dirname(file)
    output_dir = os.path.dirname(file)
    with open(file, "r") as f:
        script_data = json.load(f)

    print("🌃📚🔄 Creating Visual Prompts and Audio ...") # Status

    ### Store all clips' info
    all_clip_prompts = []

    ### Build the pipeline
    pipeline = tts_pipeline()

    ### Clip/audio generation
    for section in script_data["sections"]:
        key_points = section.get("key_points", []) if ENABLE_ON_SCREEN_KEYWORDS else []
        section_clips = gen_clips_with_audio_4section(client, section, pipeline, output_dir, model_name=MODEL_NAME, key_points=key_points)

        all_clip_prompts.extend(section_clips)

    ### Send any images that are used as existing_image clips
    run_remote_command(f"mkdir -p {REMOTE_WORK_DIR}/images")
    for clip in all_clip_prompts:
        if clip.get("visual_type") == "existing_image":
            local_image_path = clip["image_path"]
            image_filename = os.path.basename(local_image_path)
            remote_image_path = f"{REMOTE_WORK_DIR}/images/{image_filename}"
            scp_to_remote(local_image_path, remote_image_path)
            clip["image_path"] = f"images/{image_filename}"  # the relative path on the GPU side

    ### Save output for the next pipeline stage (video generation) ###
    prompt_json_path = os.path.join(output_dir, "visual_prompts.json")
    with open(prompt_json_path, "w") as f:
        json.dump(
            {"topic": script_data.get("topic"), "model": MODEL_NAME, "clips": all_clip_prompts},
            f,
            indent=4,
            ensure_ascii=False,
        )
        print(f"✅ Saved! - {len(all_clip_prompts)} clip prompts -> {output_dir}")
        print(f"✅ Saved! - {len(all_clip_prompts)} clip prompts -> {output_dir}")

    ### Send the visual prompts to the GPU
    scp_to_remote(prompt_json_path, f"{REMOTE_WORK_DIR}/visual_prompts.json")

    ### Generate clips with Wan2.1
    run_remote_command(f"cd {REMOTE_WORK_DIR} && /venv/main/bin/python3 visual_gen.py")

    ### Send generated clips and audio back
    scp_from_remote(f"{REMOTE_WORK_DIR}/clips/", f"{output_dir}/clips/")

    ### Combine audio with each video clip
    for clip in all_clip_prompts:
        video_path = os.path.join(output_dir, "clips", f"section-{clip['section']}_clip{clip['clip_number']}.mp4")
        audio_path = clip["audio_path"]
        output_with_audio_path = os.path.join(output_dir, "clips", f"section-{clip['section']}_clip{clip['clip_number']}_with_audio.mp4")

        combine_audio_video(video_path, audio_path, output_with_audio_path)

    ### Combine all clips (with audio) into one final video
    final_clips_dir = os.path.join(output_dir, "clips")
    final_output_path = os.path.join(final_clips_dir, "final_combined_video.mp4")
    combine_clips(final_clips_dir, final_output_path)
    
    return final_output_path

if __name__ == "__main__":
    fileName = input("Provide a valid folder name: ")
    script_json_path = Path(f"output_sample/{fileName}/script_output.json")
    output_folder = Path(f"output_sample/{fileName}")

    if output_folder.exists() == False or script_json_path.exists() == False:
        print(f"Folder not found or doc_analysis.py skipped.")
        exit()
        
    run_visual_gen(script_json_path, client)