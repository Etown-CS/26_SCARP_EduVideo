# BluEdu: AI-driven T2V System for CS [SCARP 2026]
An AI-Driven T2V System Turning CS Notes into Teaching Videos
 
---
 
## Environment Setup
 
Follow the steps below based on your operating system.
 
---
 
### Step 1: Install Python 3.14
 
**Mac**
```bash
brew install python@3.14
```
If you don't have Homebrew, install it with
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
 
**Windows**
 
Download and run the installer from https://python.org/downloads
 
> ⚠️ During installation, check **"Add Python to PATH"** before clicking Install.
 
Verify the installation:
```bash
python --version
```
If you see
```bash
Python 3.14.5
```
You have python installed and you're ready to go to the next step!
 
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
python3 -m venv venv
source venv/bin/activate
```
 
**Windows**
```bash
python -m venv venv
venv\Scripts\activate
```
 
You should see `(venv)` appear at the start of your terminal prompt, confirming the environment is active.
 
---
 
### Step 4: Install Dependencies
 
```bash
pip install -r requirements.txt
```
 
---
 
### Step 5: Verify Setup
 
```bash
python --version
pip list
```
 
You should see Python 3.14 and all required packages listed.
 
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
