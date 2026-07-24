# BluEdu: AI-driven T2V System for CS [SCARP 2026]
An AI-Driven T2V System Turning CS Notes into Teaching Videos

---

## Environment Setup

Follow the steps below based on your operating system.

---

### Step 1: Install Python 3.12

> ⚠️ We use **Python 3.12**, not the latest version. Some dependencies
> (`kokoro`'s TTS pipeline, via `spacy`/`thinc`/`blis`) fail to build on
> newer Python versions (tested: Python 3.14 fails to build these).

**Mac**
```bash
brew install python@3.12
```
If you don't have Homebrew, install it with
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Windows**

Download the Python 3.12 installer from https://python.org/downloads (scroll to "Looking for a specific release?" and pick a 3.12.x version).

> ⚠️ During installation, check **"Add Python to PATH"** before clicking Install.

Verify the installation:
```bash
python --version
```
You should see something like:
```bash
Python 3.12.x
```

---

### Step 2: Clone the Repository

```bash
git clone https://github.com/YOUR_ORG/26_SCARP_EduVideo.git
cd 26_SCARP_EduVideo
```

---

### Step 3: Create a Virtual Environment
Run these in the terminal of your project folder.

**Mac**
```bash
python3.12 -m venv venv
source venv/bin/activate
```

**Windows**
```bash
py -3.12 -m venv venv
venv\Scripts\activate
```

You should see `(venv)` appear at the start of your terminal prompt, confirming the environment is active.

---

### Step 4: Install System Dependencies

Some steps in the pipeline (combining video clips, muxing generated audio into
video) call the `ffmpeg` command-line tool directly, not a Python package —
it needs to be installed separately.

**Mac**
```bash
brew install ffmpeg
```

**Windows**

Download a build from https://ffmpeg.org/download.html and add its `bin/`
folder to your PATH.

Verify:
```bash
ffmpeg -version
```

---

### Step 5: Install Python Dependencies

```bash
pip install -r requirements.txt
```

---

### Step 6: Verify Setup

```bash
python --version
pip list
ffmpeg -version
```

You should see Python 3.12, all required packages listed, and a working `ffmpeg`.

---

## Daily Workflow

Every time you start working on this project, activate the virtual environment first:

**Mac**
```bash
source venv/bin/activate
```

**Windows**
```bash
venv\Scripts\activate
```

To deactivate when you're done:
```bash
deactivate
```

---

## Adding New Packages

If you install a new package, update `requirements.txt` so the rest of the team stays in sync:

```bash
pip install package-name
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Add [package-name] to requirements"
```

---

## Notes

- The GPU-side video generation pipeline (Wan2.1) runs on a separate remote
  GPU instance (Vast.ai), connected to via SSH from `remote_gpu_utils.py`.
  Connection details are stored in a local `.env` file (not committed):
  `VAST_HOST`, `VAST_PORT`, `VAST_USER`, `VAST_SSH_KEY`.