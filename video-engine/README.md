# Video Engine - 26_SCARP_EduVideo

The video generation component of the EduVideo system. Responsible for converting processed course content into short, instructional videos using AI.

## Overview

Takes structured educational content (derived from lecture slides, notes, handouts, and example code) and produces short teaching videos targeting CS topics such as loops, recursion, data structures, and algorithms.

# BluEdu — Backend (Multi Agent Pipeline)

Backend for **BluEdu**: an agentic AI pipeline that turns a lecture PDF + a short user
prompt into a short, narrated educational video. A professor uploads notes through the
frontend; this backend runs four LLM-driven agents in sequence to analyze, structure,
script, and visually generate the resulting video.

> This README documents the pipeline as implemented at the time of writing. If a module
> or function listed here has since changed, treat this as the most recent known-good
> reference and update it alongside the code.

---

## Architecture

![Backend Pipeline Overview]("docs/system_design_overview.png")

1. **Document Analysis** — extracts and filters raw PDF content into clean topics.
2. **Pedagogical Structuring** — rates importance, reorders, and summarizes each topic.
3. **Script Generation** — writes a spoken narration transcript per section.
4. **Visual Generation** — generates narration audio (local) and video clips (remote
   GPU), then muxes everything into the final video (local).

---
 
## Hardware Setup
 
The pipeline splits across two machines: a **local machine** (runs everything except
video generation) and a **remote GPU instance** (runs Wan2.1 video generation only).
 
### Local machine
 
Runs Document Analysis, Pedagogical Structuring, Script Generation, all OpenAI API
calls (LLM + embeddings), local TTS narration, and final `ffmpeg` muxing/overlay work.
No GPU is required for any of this — it's all CPU-bound or API calls.
 
### Remote GPU instance (video generation)
 
Only the Wan2.1 clip-generation step needs a GPU. This runs on a rented
**Vast.ai** instance, reached over SSH from `remote_gpu_utils.py` using the `VAST_*`
variables in `.env`.
 
| Requirement | Why |
|---|---|
| **GPU architecture** | Ampere, Ada, or Blackwell (e.g. RTX 30xx/40xx/50xx, A100) | `flash-attn` needs this; older architectures (Turing) can't build/run it |
| **VRAM** | 24GB+ | Wan2.1 (T2V-1.3B) + MagCache + reused pipeline fits comfortably here; smaller GPUs risk OOM |
| **Rental type** | On-demand, not interruptible | Interruptible instances can be outbid mid-job, killing the SSH connection and losing progress |
 
**Instance actually used in production:** on-demand RTX 4090, 24GB VRAM, US region,
~$0.354/hr.
 
**Setup on the GPU instance:**
1. Start from a template with CUDA + PyTorch preinstalled (e.g. Vast.ai's "PyTorch"
   template) — gives root access and avoids building CUDA from scratch.
2. Build `flash-attn` from source, matching the instance's exact CUDA/PyTorch/Python
   versions (no prebuilt wheel reliably matches every combination). Set
   `TORCH_CUDA_ARCH_LIST` to just the instance's actual architecture (e.g. `"8.9"` for
   Ada/RTX 4090) rather than the default multi-architecture build — building for all
   supported architectures at once can exhaust system RAM and get the build process
   killed.
3. Install the rest of the Python environment from `requirements_no_flash.txt` (same
   as `requirements.txt` minus `flash-attn`, installed separately in step 2) to avoid
   rebuilding `flash-attn` every time a dependency install pulls in a newer, mismatched
   version.
4. Confirm GPU availability before starting a long job: `nvidia-smi`.
**Earlier hardware (superseded):** initial development and LTX-2.3 experiments ran on
a shared lab server ("GPUTower": 2× RTX 2080 Ti, 11GB VRAM each, Turing architecture,
62GB RAM). This was dropped in favor of the Vast.ai RTX 4090 because (a) Turing doesn't
support `flash-attn`, which Wan2.1 effectively requires, and (b) 11GB VRAM was too
tight even with CPU offloading for reliable generation. If you're evaluating whether an
existing GPU is sufficient for this pipeline, Turing-generation or <24GB cards are not
recommended based on this history.
 
---

## Setup

### 1. Install Python 3.12

```bash
python --version   # should print Python 3.12.x
```

### 2. Clone the repository

```bash
git clone https://github.com/YOUR_ORG/26_SCARP_EduVideo.git
cd 26_SCARP_EduVideo
```

### 3. Create a virtual environment

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

### 4. Install system dependencies

The pipeline shells out to `ffmpeg` directly (combining clips, muxing generated audio
into video, burning in title/subtitle overlays) — it must be installed separately from
the Python packages.

**Mac**
```bash
brew install ffmpeg
```

**Windows**: download a build from https://ffmpeg.org/download.html and add its `bin/`
folder to PATH.

Verify with `ffmpeg -version`.

### 5. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 6. Configure environment variables

Create a `.env` file in the project root (not committed):

```
OPENAI_API_KEY=...

# Remote GPU (Vast.ai instance running Wan2.1)
VAST_HOST=...
VAST_PORT=...
VAST_USER=...
VAST_SSH_KEY=...
```

`OPENAI_API_KEY` is used for all LLM calls (`gpt-4o` / `gpt-4o-mini`) and for the
embeddings API (`text-embedding-3-small`) — same key, no separate setup needed. The
`VAST_*` variables are used by `remote_gpu_utils.py` to SSH/SCP into the remote GPU
instance for video generation.

### 7. Verify setup

```bash
python --version
pip list
ffmpeg -version
```

---

## Daily workflow

```bash
source venv/bin/activate     # Mac
venv\Scripts\activate        # Windows
# ... work ...
deactivate
```

When adding a new package:

```bash
pip install package-name
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Add package-name to requirements"
```

---

## Running the pipeline

```bash
python main.py
```

On success, the final video is written to:

```
output_folder/clips/final_combined_video.mp4
```

Note: the file pulled back directly from the GPU instance
(`output_folder/clips/combined_video.mp4`) is **silent** — it has not yet had narration
audio muxed in. Always play the `final_combined_video.mp4` to check the real output.

---

## Pipeline stages in detail

### 1. Document Analysis (`doc_analysis.py`)

Takes a raw PDF and turns it into clean, filtered topics.

- `format_checker` — confirms the uploaded file is actually a PDF.
- Extracts text and images from the PDF (both are needed downstream).
- `llm_cleaner` — removes non-content slides (title slides, "any questions?", etc.).
- `llm_segmentation` — groups the remaining content into topics (main topics + child
  subsegments). *(Originally two separate LLM calls; merged into one to cut latency
  from ~132s to ~22.6s.)*
- `llm_topic_filter` — a second LLM pass that keeps only topics matching the user's
  prompt.
- **Known limitation:** filtering is currently topic-label-based, not content-aware —
  e.g. a request for "a video about LLMs" can drop foundational content (like how
  Transformers work) if it isn't explicitly labeled as being about LLMs, even though
  it's necessary background.

**Image reattachment (embedding-based).** Images extracted from the PDF sometimes get
separated from their original topic during segmentation ("dropped images"). To
reattach each dropped image to the correct topic:

- `get_embedding(text, client, model="text-embedding-3-small")` — embeds a string.
- `build_segment_embeddings(segments, client)` — embeds each topic's combined title +
  subsegment content, once, and caches the result.
- `cosine_similarity(vec_a, vec_b)` — standard cosine similarity between two vectors.
- `find_best_matching_segment(...)` — embeds the text immediately surrounding a dropped
  image and compares it against the cached topic embeddings to find the best match.
  Match threshold: **~0.3** (embedding cosine similarity for unrelated text tends to
  sit around 0.1–0.2).

This replaced an earlier version that used `difflib.SequenceMatcher` (character-level
string similarity, threshold `0.15`) — that approach worked reasonably well but gave
unreliable scores for cases like the same diagram being referenced with different
wording in different topics, since it compared surface text overlap rather than
meaning.

### 2. Pedagogical Structuring (`pedagogical_structuring.py`)

Rates each subsegment's importance and builds an ordered outline.

- `reorder_summarize_topic()` — returns `content` (original) + `summary` (simplified)
  + `importance` together per subsegment.
- Importance labels: `essential`, `supplementary`, `advanced`, `optional`.
  (`optional` was chosen over an earlier `discard` label — same meaning, less
  aggressive framing.)
- Summarization is done **per subsegment**, not per topic, so importance labels stay
  meaningful at a granular level.

Output: `pedagogical_output.json`

### 3. Script Generation (`script_gen.py`)

Writes narration text per section.

- `filter_subsegments(segment)` — drops subsegments labeled `optional`/`advanced`, and
  drops image-only subsegments (`content` starting with `![]`), since neither should be
  read aloud.
- `generate_transcript(section, subseg_lookup)` — generates one transcript paragraph
  per section from its filtered `essential`/`supplementary` subsegments' summaries.
  Also extracts `key_points` (candidate terms/phrases worth showing as on-screen text
  in the video) in the *same* LLM call that writes the transcript, rather than a
  separate call — each candidate phrase is checked against the generated transcript
  text to confirm it appears verbatim before being kept (`verified` filter), since LLMs
  asked to quote exact terms sometimes paraphrase slightly.
- **Known limitation:** if *every* subsegment in a section gets filtered out (e.g. a
  section consisting only of a single image), `generate_transcript` returns `None` and
  the entire section is silently dropped from `script_output.json` — no warning, no
  fallback. Observed in practice: a conclusion section (real-world applications, image
  only) disappeared entirely from a real run. Not yet fixed; planned fix is to log a
  warning and/or generate a short fallback caption instead of skipping.

Output: `script_output.json`

### 4. Visual Generation (`visual_gen.py`, `visual_prompt_gen.py`, `remote_gpu_utils.py`)

The most involved stage — splits work between the local machine and a remote GPU
instance.

**`run_visual_gen(script_json, client)`** — main entry point. Note: this function is
intentionally left as one long orchestration function rather than split into named
sub-steps, since it mirrors the actual physical local → GPU → local flow of the
pipeline. Responsibilities:

1. Builds the local TTS pipeline.
2. Loops over sections, generating audio + a visual prompt (or an existing-image
   reference) per clip.
3. Sends referenced images and the full clip-prompt list to the GPU.
4. Triggers remote video generation, pulls the results back.
5. Combines audio + video per clip.
6. Adds a title overlay per clip (`add_title_overlay`).
7. Adds a subtitle overlay per clip (`add_subtitle_overlay`).
8. Deletes silent intermediate files.
9. Combines everything into the final video.

**`visual_prompt_gen.py`:**
- `gen_visual_prompt_4chunk(client, sub, model_name, ...)` — generates a Wan2.1
  text-to-video prompt for one narration chunk. Combines duration-aware motion
  guidance (a single still state for very short clips vs. one continuous camera
  movement for longer ones), CS-concept-specific motion hints, a fixed render style
  (minimalist flat-vector illustration — chosen after testing abstract light/particle
  metaphors and literal photorealistic scenes, both of which read poorly), and the
  previous clip's prompt (for visual continuity within a section).
- `gen_clips_with_audio_4section(client, section, pipeline, output_folder, ...)` — for
  one outline section, splits the transcript into clip-sized chunks, generates audio
  per chunk (measuring real duration to size the clip), and either references an
  existing PDF image or generates a new prompt, depending on whether the chunk
  contains an image tag.
- **On-screen text:** on-screen keyword rendering inside the generated video itself was
  tested and abandoned — both candidate video models garbled exact text (e.g.
  "Self-attention" → "Sthn - Atfhhi") consistently from the first frame. Exact
  terminology is instead burned in afterward via `add_title_overlay` /
  `add_subtitle_overlay` (deterministic `ffmpeg drawtext`), not generated by the model.

**`remote_gpu_utils.py`:**
- `scp_to_remote(local_path, remote_path)` — send a file/folder to the GPU instance.
- `scp_from_remote(remote_path, local_path)` — pull a file/folder back.
- `run_remote_command(command)` — run a shell command on the GPU instance over SSH.

Output: `visual_output.json`, plus the rendered clips and final video under
`output_folder/clips/`.

---

## Models used

| Purpose | Model | Where it runs |
|---|---|---|
| Text cleaning, segmentation, topic filtering, summarization, transcript + key-point generation | `gpt-4o` / `gpt-4o-mini` | Local (OpenAI API) |
| Image-to-topic reattachment (semantic similarity) | `text-embedding-3-small` | Local (OpenAI API) |
| Text-to-speech narration | Kokoro (local TTS) | Local |
| Video clip generation | Wan2.1 (T2V-1.3B) + MagCache | Remote GPU (Vast.ai) |

**Why Wan2.1 over LTX-2.3:** LTX-2.3 is faster for a single clip (~111.9s vs. Wan2.1's
unoptimized ~390s), but at ≥70GB (model + Gemma 3 text encoder) it doesn't fit on a
24GB-class GPU without CPU offload, which forces a full pipeline reload per call —
so its total time scales roughly linearly with clip count (~447.6s for 4 clips).
Wan2.1 is small enough to stay resident in VRAM, so with model reuse across clips,
reduced sampling steps, and MagCache, per-clip time dropped to ~79s (~386s for 4 clips)
— cheaper than LTX-2.3 at the multi-clip scale this pipeline actually runs at, despite
losing the single-clip benchmark. Trade-off: aggressive step-reduction + MagCache
introduces visible "melting" artifacts in fine detail.

The remote GPU runs on a rented Vast.ai instance (on-demand, Ampere/Ada+ required for
`flash-attn`, 24GB+ VRAM) reached over SSH from `remote_gpu_utils.py`.

---

## Data flow / output files

```
pdf + user prompt
        │  doc_analysis.py
        ▼
pedagogical_output.json     (topics → subsegments, each with content/summary/importance)
        │  pedagogical_structuring.py + script_gen.py
        ▼
script_output.json          (per-section transcript + key_points)
        │  visual_gen.py / visual_prompt_gen.py
        ▼
visual_output.json          (per-clip prompts, audio paths, timing)
        │  run_visual_gen (GPU round-trip + ffmpeg muxing)
        ▼
output_folder/clips/final_combined_video.mp4
```

---

## Known limitations (current state)

- **Document Analysis:** user-prompt topic filtering can drop foundational content that
  isn't explicitly labeled as matching the prompt (e.g. cutting "how Transformers work"
  from an "LLM" request).
- **Script Generation:** sections whose entire content gets filtered out (image-only
  sections) are silently dropped rather than flagged or given a fallback caption.
- **Visual Generation:** on-screen text cannot be reliably generated by the video model
  itself (handled via post-hoc overlay instead); step-reduction + MagCache optimization
  introduces minor visual artifacts; a duplicate source image reused in a later section
  (e.g. a code snippet reappearing in a conclusion) is not currently filtered out of
  image selection.
- **General:** several agents rely on LLMs to produce exact, stable strings (image
  paths, verbatim quoted terms) that must match downstream data precisely — this is a
  recurring source of silent-failure bugs across the pipeline (e.g. a test call passing
  `key_points=None` instead of reading it from data, which failed silently with no
  error).

