# Getting Started on the GPU Server

Welcome! This sheet walks you through logging in, setting up your Python
environment, and running open-source video-generation models. You have a
regular (non-root) account. Everything below works without admin rights and
lives in your own home directory.

Work through it top to bottom the first time. After that, your daily routine is
just the short section near the end.

---

## 1. Log in

You'll receive a **username** and a **temporary password** from the instructor.

```bash
ssh <yourusername>@<server-address>
```

The first time you log in, you'll be prompted to change your password
immediately. Pick something strong; the instructor will not know your new
password after this.

If your connection ever drops mid-task, see the **tmux** section — it keeps
long jobs running even after you disconnect.

---

## What's already set up vs. what you do

The server is already prepared at the system level, so you can skip a lot of
installation. Here's the split.

**Already on the server — do NOT install these:**

- [x] **NVIDIA GPU driver** — the GPU is installed and working. Don't touch
  driver setup.
- [x] **CUDA toolkit** — present system-wide. You won't need it directly anyway
  (PyTorch ships its own CUDA runtime), so don't try to install CUDA.
- [x] **Python 3** — available as `python3`. Don't install Python into the
  system or use `sudo` to add packages to it.
- [x] **Shared `/data` folder** — already exists and is writable by the team,
  including `/data/hf-cache` for models. No setup needed.
- [x] **tmux** — installed, for keeping long jobs alive across disconnects.

**What you need to do (all in your own account, no admin rights):**

- [ ] Log in and set your new password (Section 1).
- [ ] Create your personal Python environment — uv or venv (Section 2).
- [ ] Install the Python packages into that environment (Section 2).
- [ ] Set your `~/.bashrc` (Section 3).
- [ ] Run the GPU check (Section 4).
- [ ] Log in to Hugging Face with your own account for gated models (Section 5).

In short: the **machine-level** pieces are done for you; you only set up your
**own user environment** and the Python packages inside it.

---

## 2. One-time environment setup

You'll create an isolated Python environment so your packages don't collide
with anyone else's. Two options — pick one.

### Option A — uv (recommended, fast)

Install uv into your home directory:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc        # so the `uv` command is found
```

Create an environment and install the core stack:

```bash
uv venv ~/videoenv --python 3.10
source ~/videoenv/bin/activate
uv pip install torch torchvision diffusers transformers accelerate
```

### Option B — built-in venv (no extra tools)

```bash
python3 -m venv ~/videoenv
source ~/videoenv/bin/activate
pip install torch torchvision diffusers transformers accelerate
```

---

## 3. The shared `/data` folder, and pointing the model cache at it

There's a shared folder at **`/data`** that everyone on the server can access.
Anything meant to be shared across the team goes here — datasets, downloaded
models, common resources — rather than buried in someone's home directory. For
example, Hugging Face data live in **`/data/hf-cache`**.

Two reasons to use it: model weights are **large** (tens of GB each), so keeping
them out of your home folder avoids filling up disk; and putting them in `/data`
means you and your teammate reuse the same downloads instead of each pulling
your own copy.

To make Hugging Face use the shared cache, add this line to your `~/.bashrc`.

### How to edit `~/.bashrc`

`~/.bashrc` is a plain text file that runs every time you open a shell. Open it
with `nano`, a beginner-friendly editor that shows its own keybindings at the
bottom of the screen:

```bash
nano ~/.bashrc
```

Use the arrow keys to scroll to the end of the file, then add:

```bash
export HF_HOME=/data/hf-cache
```

Save and exit:

- Press `Ctrl-O` then `Enter` to write (save) the file.
- Press `Ctrl-X` to exit nano.

Then reload the file so the change takes effect in your current session:

```bash
source ~/.bashrc
```

> If you're comfortable with `vim`, you can use `vim ~/.bashrc` instead — the
> steps above are identical once you're in insert mode (`i`), and `:wq` saves
> and quits.

> Rule of thumb: shared, reusable, or large → put it under `/data`. Personal
> work-in-progress → keep it in your home directory.

---

## 4. Verify the GPU works

Activate your environment and run the check:

```bash
source ~/videoenv/bin/activate
python3 -c "import torch; print(torch.__version__, torch.cuda.is_available())"
```

You want to see a version number followed by **True**, e.g.:

```
2.5.1 True
```

- **`True`** → you're all set, the GPU is visible to PyTorch.
- **`False`** → tell the instructor. It usually means the installed PyTorch
  build needs to match the server's CUDA version; that's a one-line reinstall
  they can point you to.

You don't need to worry about `nvcc` or the system CUDA toolkit — PyTorch brings
its own CUDA runtime. (Only some specialized packages that compile custom code
at install time need the system toolkit, and the instructor can help if you hit
that.)

---

## 5. Downloading models

Some models are **gated** on Hugging Face and require you to accept their
license and authenticate with **your own** Hugging Face account (don't share
tokens).

**Do not use `hf auth login` on this server.** Because `HF_HOME` points at the
shared `/data/hf-cache` directory, the CLI would try to write your token to
`/data/hf-cache/stored_tokens` — a file you don't have permission to create
there.

Instead, add your token directly to `~/.bashrc`:

```bash
export HF_TOKEN=hf_yourTokenHere
```

Generate a token at huggingface.co → Settings → Access Tokens (a read-only
token is enough for downloading models). Open `~/.bashrc` with `nano`, add the
line above, save, and reload:

```bash
source ~/.bashrc
```

The Hugging Face library and CLI both read `HF_TOKEN` automatically — no
interactive login needed. Because `HF_HOME` still points at shared storage,
the first person to download a model saves everyone else the wait.

---

## 6. Running long jobs without losing them — tmux

Downloads and video generation can take a long time, and an SSH disconnect will
normally kill whatever you were running. **tmux** keeps your session alive on
the server so it survives disconnects.

Start a named session:

```bash
tmux new -s [your-task-name]
source ~/videoenv/bin/activate
```

The tmux session starts a fresh shell, so activate your environment before
running anything. Then run your work as normal. To **leave it running** and
disconnect: press `Ctrl-b` then `d` (detach).

To come back later (even from a different computer):

```bash
tmux attach -t [your-task-name]
```

List your sessions: `tmux ls`.

---

## 7. Your daily routine

Once the one-time setup is done, each session is just:

```bash
ssh <yourusername>@<server-address>     # log in
tmux attach -t [your-task-name]  # resume a session
source ~/videoenv/bin/activate           # activate your environment
# ... do your work ...
```

---

## Sharing the server — a few courtesies

You're sharing one machine (and possibly one or a few GPUs) with your teammate,
so a little coordination goes a long way.

- **Check who's using the GPU first.** Run `nvidia-smi` to see current memory
  and utilization before launching a big job. If a GPU is full, wait or
  coordinate.
- **Give your team a heads-up** before starting a long run, so two heavy jobs
  don't collide. The project Discord/Slack is good for this.
- **Clean up after yourself.** Delete large temporary outputs you no longer
  need; disk is shared.
- **Don't install into the system Python or use `sudo`.** Everything you need
  lives in your own environment. If something seems to require admin rights,
  ask the instructor rather than working around it.
- **Put shared things in `/data`.** Models, datasets, and other large or
  reusable files belong under `/data` (e.g. weights in the `HF_HOME` cache), not
  scattered across home directories.

---

## Quick troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `No module named 'torch'` | Your environment isn't activated. Run `source ~/videoenv/bin/activate`. |
| `nvcc: command not found` | Normal — you don't need it for PyTorch models. Ignore unless a package's install asks for it. |
| `torch.cuda.is_available()` is `False` | PyTorch build may not match the server's CUDA. Flag it to the instructor. |
| Out-of-memory (CUDA OOM) errors | A GPU is busy or the model is too large for available VRAM. Check `nvidia-smi`, wait, or ask about a smaller model / lower settings. |
| Job died when my laptop slept | Run inside `tmux` (see section 6) so it survives disconnects. |

---

Stuck on something not covered here? Ask in the team chat.
