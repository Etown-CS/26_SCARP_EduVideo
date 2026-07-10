# Vast.ai Setup Guide — EduVideo (BluEdu) Video Generation

This guide covers getting set up on the **EduVideo** Vast.ai team and running Wan 2.1 video generation for the project. Follow it in order the first time; after that, skip to [Day-to-Day Usage](#day-to-day-usage).

## 1. Accept the Team Invite

1. Check your `@etown.edu` inbox for the Vast.ai team invite email.
2. Click the invite link and sign in / create a Vast.ai account with your `@etown.edu` address.
3. Once accepted, switch into the **EduVideo** team context: in the [Vast.ai Console](https://cloud.vast.ai), use the team switcher (top of the sidebar) and select **EduVideo**.
4. Confirm you're spending team credits, not a personal balance: go to **Billing** and check the balance shown matches the team's shared credits, not $0 on a personal account.

> Everything you rent while in the EduVideo team context bills against the shared team credits. Double-check the team switcher before renting anything.

## 2. Choose a Template

Templates are pre-built environments (OS + CUDA + common libraries) that Vast.ai boots your instance from.

1. Go to **Templates** in the console.
2. For this project, start from an **NVIDIA CUDA / PyTorch** template (e.g., "PyTorch (cuDNN Devel)") — it comes with CUDA and PyTorch preinstalled, which saves setup time.
3. Click the template's **play (▶)** button — this takes you to the offer/search page filtered to machines compatible with that template.

## 3. Pick a GPU (Ampere or newer only)

This matters: our earlier local dev GPU (RTX 2080 Ti) is Turing architecture and doesn't support `flash-attn`. Every GPU you rent for this project should be **Ampere, Ada, or Blackwell** generation, which all support `flash-attn` properly:

| Good (Ampere+) |
|---|
| RTX 3090 / 3090 Ti |
| RTX 4090 / 4080 / 4070 |
| RTX 5090 / 5080 / 5070 |
| A100, A10, A5000, A4000, L40S |

Note that higher-end GPU instances cost more credits per hour, but they might still save credits overall if they generate video clips much faster.

Use the GPU filter at the top of the offer page to find one of these, and prefer **24GB+ VRAM** cards. We'll focus on Wan 2.1 T2V-1.3B at 480P for now and can move to other video generation models if time permits.

## 4. Choose Interruptible vs. On-Demand

Vast.ai offers to instance types:

- **Interruptible** — much cheaper, but the host can reclaim the machine with only a few minutes' notice. Fine for **development, testing, and short generation runs**.
- **On-demand** — costs more, but the host commits to keeping it running. Use this only for **longer batch-rendering runs** where losing progress mid-run would be costly.

For day-to-day dev work, pick **interruptible** to conserve team credits.

## 5. Launch the Instance

1. On the offer page, review: GPU model, VRAM, $/hr, and disk space (request at least **40–50GB** disk — Wan 2.1 weights + dependencies add up).
2. Click **RENT** on your chosen offer.
3. Go to **Instances** (`cloud.vast.ai/instances`) to watch it boot. Once status shows **running**, you can connect.
4. Connect via the **Open** button (Jupyter, if the template includes it) or **SSH** (copy the SSH command shown on the instance card into your terminal).

## 6. Environment Variables

Once connected, set these before running anything (add to `~/.bashrc` or export each session):

```bash
export HF_TOKEN="<your-huggingface-token>"
export HF_HOME="/root/.cache/huggingface"
export HF_HUB_ENABLE_HF_TRANSFER=1
export PYTHONUNBUFFERED=1
```

- `HF_TOKEN` — avoids Hugging Face rate limits (Wan weights are public, but a token still helps).
- `HF_HOME` — cache directory; since Vast.ai instances persist local disk while you hold the instance (unlike Salad's stateless containers), weights downloaded here will survive a stop/restart of the *same* instance.
- `HF_HUB_ENABLE_HF_TRANSFER=1` — speeds up large downloads (requires the `hf_transfer` pip package, installed below).
- `PYTHONUNBUFFERED=1` — makes logs print immediately instead of buffering.

## 7. Install Dependencies

```bash
pip install --upgrade pip
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
pip install flash-attn --no-build-isolation
pip install hf_transfer huggingface_hub diffusers transformers accelerate
```

`flash-attn` should build/install cleanly here since we're on an Ampere+ GPU — this is the whole point of moving off the 2080 Tis.

## 8. Get the Wan 2.1 Code and Weights

```bash
git clone https://github.com/Wan-Video/Wan2.1.git
cd Wan2.1
pip install -r requirements.txt

huggingface-cli download Wan-AI/Wan2.1-T2V-1.3B --local-dir ./Wan2.1-T2V-1.3B
```

This downloads the base T2V-1.3B model (~15–20GB total including the VAE and T5 text encoder). Grab a coffee — first download takes a few minutes even with `hf_transfer` enabled.

## 9. Run a Test Generation

Start conservative, then push frame count back up now that flash-attn works:

```bash
python generate.py \
  --task t2v-1.3B \
  --size 832*480 \
  --ckpt_dir ./Wan2.1-T2V-1.3B \
  --frame_num 81 \
  --prompt "A moody cyberpunk street in the rain, neon reflections"
```

- `--frame_num 81` is the model's default (~5s at 24fps) — try this first now that we're not capped at 9 frames.
- If you hit an out-of-memory error, add `--offload_model True --t5_cpu` to shift some memory load to system RAM, or drop `--frame_num` incrementally (81 → 61 → 41) until it fits.
- Stick to **480p (`832*480`)** for most testing — it's dramatically faster and cheaper than 720p, and Wan 2.1 was trained primarily at this resolution anyway.

## 10. Cost Management

- **Stop instances when not actively using them.** Vast.ai bills by the hour while running, even if idle. Use the **Instances** page to stop (not destroy, if you want to keep your setup) when you step away.
- **Destroy vs. Stop:** stopping keeps your disk (and downloaded weights/code) so you can pick up later on the same instance; destroying deletes everything and frees the credits tied to that instance. Use stop for anything you'll return to within a day or two.
- **Check team billing regularly** (`Billing` in the console) so we don't burn through shared credits without noticing.
- If an interruptible instance gets reclaimed mid-run, that's expected — just relaunch on a new offer and re-clone/re-download if needed (or resume from a stopped instance if the host didn't fully reclaim it).

## Day-to-Day Usage

Once set up once, going forward:

1. Switch to the **EduVideo** team in the console.
2. Go to **Instances** — if your previous instance is stopped, click **Start** to resume it with your files intact (faster than starting fresh).
3. Run generations, iterate, stop the instance when done for the session.

## Reference Links

- [Vast.ai Console](https://cloud.vast.ai)
- [Vast.ai Teams Docs](https://docs.vast.ai/guides/teams/teams-overview)
- [Wan2.1 GitHub Repo](https://github.com/Wan-Video/Wan2.1)
- [Wan2.1-T2V-1.3B on Hugging Face](https://huggingface.co/Wan-AI/Wan2.1-T2V-1.3B)

