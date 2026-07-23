import os
import subprocess
from dotenv import load_dotenv

load_dotenv()

VAST_HOST = os.getenv("VAST_HOST")
VAST_PORT = os.getenv("VAST_PORT")
VAST_USER = os.getenv("VAST_USER")
VAST_SSH_KEY = os.path.expanduser(os.getenv("VAST_SSH_KEY", ""))

REMOTE_WORK_DIR = "/workspace/Wan2.1/video_engine_pipeline"

### Send any files(local_path) to any destination on GPU(remote_path)
def scp_to_remote(local_path, remote_path):
    cmd = [
        "scp", "-r", "-P", VAST_PORT, "-i", VAST_SSH_KEY, # -r: recursively
        local_path,
        f"{VAST_USER}@{VAST_HOST}:{remote_path}"
    ]
    subprocess.run(cmd, check=True)

### Send any files on GPU (remote_path) to any destination on local(local_path)
def scp_from_remote(remote_path, local_path):
    cmd = [
        "scp", "-P", VAST_PORT, "-i", VAST_SSH_KEY,
        f"{VAST_USER}@{VAST_HOST}:{remote_path}",
        local_path
    ]
    subprocess.run(cmd, check=True)

### Run command on the GPU side
def run_remote_command(command):
    cmd = [
        "ssh", "-p", VAST_PORT, "-i", VAST_SSH_KEY,
        f"{VAST_USER}@{VAST_HOST}",
        command
    ]
    subprocess.run(cmd, check=True)