import argparse
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# Import entrypoint functions from your three agent files
from doc_analysis import run_doc_analysis
from pedagogical_structuring import run_pedagogical_structuring
from script_gen import run_script_gen
from visual_gen import run_visual_gen

### LLM
load_dotenv()
client = OpenAI()

def unique_folder_name(base_name, base_dir="output_sample"):
    target_dir = Path(base_dir) / base_name
    if not target_dir.exists(): return base_name

    ### Handle the case there is the same folder name
    counter = 1
    while (Path(base_dir)/f"{base_name}_{counter}").exists():
        counter += 1
    
    return f"{base_name}_{counter}"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Run end-to-end educational video script generation pipeline."
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
        help="Folder name to store materials & output" )
    
    args = parser.parse_args()

    base_name = args.output_name or Path(args.file).stem

    ### Check if there is a duplicate
    args.output_name = unique_folder_name(base_name)

    return args


def main():
    args = parse_args()

    pdf_path = args.file
    user_prompt = args.prompt
    output_folder = str(Path("output_sample/") / args.output_name)

    doc_json_path = run_doc_analysis(pdf_path, user_prompt, args.output_name)
    print(f"Done >>> {doc_json_path}\n")

    pedagogical_json_path = run_pedagogical_structuring(doc_json_path)
    print(f"Done >>> {pedagogical_json_path}\n")

    script_json_path = run_script_gen(pedagogical_json_path)
    print(f"Done >>> {script_json_path}\n\n")

    final_video_path = run_visual_gen(script_json_path, client)

    print("✅ Pipeline execution complete!\n")
    print(f"🎬 Final video: {final_video_path}")

if __name__ == "__main__":
    main()