import os
import subprocess
from dotenv import load_dotenv

load_dotenv()

VAST_HOST = os.getenv("VAST_HOST")
VAST_PORT = os.getenv("VAST_PORT")
VAST_USER = os.getenv("VAST_USER")
VAST_SSH_KEY = os.path.expanduser(os.getenv("VAST_SSH_KEY", ""))

REMOTE_WORK_DIR = "/workspace/Wan2.1/video_engine_pipeline"

def scp_to_remote(local_path, remote_path):
    '''Send a local file or folder to a destination path on the GPU instance.'''
    cmd = [
        "scp", "-r", "-P", VAST_PORT, "-i", VAST_SSH_KEY, # -r: recursively
        local_path,
        f"{VAST_USER}@{VAST_HOST}:{remote_path}"
    ]
    subprocess.run(cmd, check=True)

def scp_from_remote(remote_path, local_path):
    '''Send a file or folder from the GPU instance back to a local destination.'''
    cmd = [
        "scp", "-r", "-P", VAST_PORT, "-i", VAST_SSH_KEY,
        f"{VAST_USER}@{VAST_HOST}:{remote_path}",
        local_path
    ]
    subprocess.run(cmd, check=True)

def run_remote_command(command):
    '''Run a shell command on the GPU instance over SSH.'''
    cmd = [
        "ssh", "-p", VAST_PORT, "-i", VAST_SSH_KEY,
        f"{VAST_USER}@{VAST_HOST}",
        command
    ]
    subprocess.run(cmd, check=True)