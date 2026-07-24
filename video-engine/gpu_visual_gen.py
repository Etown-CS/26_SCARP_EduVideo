import json
import os
import re
import sys
import subprocess
import shutil

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import time
import numpy as np
import torch
import torch.cuda.amp as amp

import wan
from wan.configs import SIZE_CONFIGS, WAN_CONFIGS
from wan.modules.model import sinusoidal_embedding_1d
from wan.utils.utils import cache_video

### Setup
TASK = "t2v-1.3B"
CKPT_DIR = "../Wan2.1-T2V-1.3B"
SIZE = "832*480"
SAMPLE_SHIFT = 8
SAMPLE_GUIDE_SCALE = 6
SAMPLE_STEPS = 25
SEED = 42

USE_MAGCACHE = True
MAGCACHE_THRESH = 0.12
MAGCACHE_K = 4
RETENTION_RATIO = 0.2

### MagCache forward, copied verbatim from MagCache4Wan2.1/magcache_generate.py
def magcache_forward(self, x, t, context, seq_len, clip_fea=None, y=None):
    if self.model_type == 'i2v':
        assert clip_fea is not None and y is not None
    device = self.patch_embedding.weight.device
    if self.freqs.device != device:
        self.freqs = self.freqs.to(device)
    if y is not None:
        x = [torch.cat([u, v], dim=0) for u, v in zip(x, y)]

    x = [self.patch_embedding(u.unsqueeze(0)) for u in x]
    grid_sizes = torch.stack(
        [torch.tensor(u.shape[2:], dtype=torch.long) for u in x])
    x = [u.flatten(2).transpose(1, 2) for u in x]
    seq_lens = torch.tensor([u.size(1) for u in x], dtype=torch.long)
    assert seq_lens.max() <= seq_len
    x = torch.cat([
        torch.cat([u, u.new_zeros(1, seq_len - u.size(1), u.size(2))], dim=1)
        for u in x
    ])

    with amp.autocast(dtype=torch.float32):
        e = self.time_embedding(
            sinusoidal_embedding_1d(self.freq_dim, t).float())
        e0 = self.time_projection(e).unflatten(1, (6, self.dim))
        assert e.dtype == torch.float32 and e0.dtype == torch.float32

    context_lens = None
    context = self.text_embedding(
        torch.stack([
            torch.cat([u, u.new_zeros(self.text_len - u.size(0), u.size(1))])
            for u in context
        ]))
    if clip_fea is not None:
        context_clip = self.img_emb(clip_fea)
        context = torch.concat([context_clip, context], dim=1)

    kwargs = dict(
        e=e0,
        seq_lens=seq_lens,
        grid_sizes=grid_sizes,
        freqs=self.freqs,
        context=context,
        context_lens=context_lens)

    skip_forward = False
    ori_x = x
    if self.cnt >= int(self.num_steps * self.retention_ratio):
        cur_mag_ratio = self.mag_ratios[self.cnt]
        self.accumulated_ratio[self.cnt % 2] = self.accumulated_ratio[self.cnt % 2] * cur_mag_ratio
        self.accumulated_steps[self.cnt % 2] += 1
        cur_skip_err = np.abs(1 - self.accumulated_ratio[self.cnt % 2])
        self.accumulated_err[self.cnt % 2] += cur_skip_err
        if self.accumulated_err[self.cnt % 2] < self.magcache_thresh and self.accumulated_steps[self.cnt % 2] <= self.K:
            skip_forward = True
            residual_x = self.residual_cache[self.cnt % 2]
        else:
            self.accumulated_err[self.cnt % 2] = 0
            self.accumulated_steps[self.cnt % 2] = 0
            self.accumulated_ratio[self.cnt % 2] = 1.0

    if skip_forward:
        x = x + residual_x
    else:
        for block in self.blocks:
            x = block(x, **kwargs)
        residual_x = x - ori_x
        self.residual_cache[self.cnt % 2] = residual_x

    x = self.head(x, e)
    x = self.unpatchify(x, grid_sizes)
    self.cnt += 1
    if self.cnt >= self.num_steps:
        # done with this clip -- reset for the NEXT .generate() call
        self.cnt = 0
        self.accumulated_ratio = [1.0, 1.0]
        self.accumulated_err = [0.0, 0.0]
        self.accumulated_steps = [0, 0]
    return [u.float() for u in x]


def nearest_interp(src_array, target_length):
    src_length = len(src_array)
    if target_length == 1:
        return np.array([src_array[-1]])
    scale = (src_length - 1) / (target_length - 1)
    mapped_indices = np.round(np.arange(target_length) * scale).astype(int)
    return src_array[mapped_indices]


# Calibrated for the 1.3B model at 50 steps (from MagCache4Wan2.1). If
# SAMPLE_STEPS != 50, nearest_interp() below adapts it automatically.
MAG_RATIOS_1_3B = np.array(
    [1.0] * 2 + [
        1.0124, 1.02213, 1.00166, 1.0041, 0.99791, 1.00061, 0.99682, 0.99762,
        0.99634, 0.99685, 0.99567, 0.99586, 0.99416, 0.99422, 0.99578, 0.99575,
        0.9957, 0.99563, 0.99511, 0.99506, 0.99535, 0.99531, 0.99552, 0.99549,
        0.99541, 0.99539, 0.9954, 0.99536, 0.99489, 0.99485, 0.99518, 0.99514,
        0.99484, 0.99478, 0.99481, 0.99479, 0.99415, 0.99413, 0.99419, 0.99416,
        0.99396, 0.99393, 0.99388, 0.99386, 0.99349, 0.99349, 0.99309, 0.99304,
        0.9927, 0.9927, 0.99228, 0.99226, 0.99171, 0.9917, 0.99137, 0.99135,
        0.99068, 0.99063, 0.99005, 0.99003, 0.98944, 0.98942, 0.98849, 0.98849,
        0.98758, 0.98757, 0.98644, 0.98643, 0.98504, 0.98503, 0.9836, 0.98359,
        0.98202, 0.98201, 0.97977, 0.97978, 0.97717, 0.97718, 0.9741, 0.97411,
        0.97003, 0.97002, 0.96538, 0.96541, 0.9593, 0.95933, 0.95086, 0.95089,
        0.94013, 0.94019, 0.92402, 0.92414, 0.90241, 0.9026, 0.86821, 0.86868,
        0.81838, 0.81939,
    ]
)

def _gpu_mem_snapshot() -> str:
    if not torch.cuda.is_available():
        return "cuda not available"
    parts = []
    for i in range(torch.cuda.device_count()):
        gb = torch.cuda.max_memory_allocated(i) / 1e9
        parts.append(f"gpu{i}={gb:.2f}GB")
    return ", ".join(parts)

####################### Combine clips #######################
def combine_clips(clips_dir, output_path):
    print(f"[debug] Looking for clips in: {clips_dir}") # for debug
    print(f"[debug] Files found: {os.listdir(clips_dir)}") # for debug

    ### Make a tuple like "section-1_clip1.mp4" -> (1, 1), to properly compare them as number
    def sort_key(filename):
        match = re.match(r"section-(\d+)_clip(\d+)\.mp4", filename)
        return (int(match.group(1)), int(match.group(2)))

    clip_files = sorted(
        (f for f in os.listdir(clips_dir) 
        if f.endswith(".mp4") and re.match(r"section-\d+_clip\d+\.mp4", f)),
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

####################### Main #######################
### Load the script JSON file
with open("visual_prompts.json", "r") as f: # run_remote_command is executed after doing "cd REMOTE_WORK_DIR"
    data = json.load(f)

### Building Wan2.1 pipeline + MagCache batch
@torch.inference_mode()
def main() -> None:
    ### Empty clips folder every time
    if os.path.exists("clips"):
        shutil.rmtree("clips")
    os.makedirs("clips", exist_ok=True)

    ### Build the pipeline before start processing clips
    timings = {}
    cfg = WAN_CONFIGS[TASK]

    print("=" * 60)
    print("Building WanT2V pipeline (once)...")
    t0 = time.time()
    wan_t2v = wan.WanT2V(
        config=cfg,
        checkpoint_dir=CKPT_DIR,
        device_id=0,
        rank=0,
        t5_fsdp=False,
        dit_fsdp=False,
        use_usp=False,
        t5_cpu=False,
    )
    timings["pipeline_init"] = time.time() - t0
    print(f"Pipeline built in {timings['pipeline_init']:.1f}s")

    if USE_MAGCACHE:
        print(f"Patching model with MagCache (K={MAGCACHE_K}, "
              f"thresh={MAGCACHE_THRESH}, retention={RETENTION_RATIO})...")
        wan_t2v.model.__class__.forward = magcache_forward
        wan_t2v.model.__class__.cnt = 0
        wan_t2v.model.__class__.num_steps = SAMPLE_STEPS * 2
        wan_t2v.model.__class__.magcache_thresh = MAGCACHE_THRESH
        wan_t2v.model.__class__.K = MAGCACHE_K
        wan_t2v.model.__class__.accumulated_err = [0.0, 0.0]
        wan_t2v.model.__class__.accumulated_steps = [0, 0]
        wan_t2v.model.__class__.accumulated_ratio = [1.0, 1.0]
        wan_t2v.model.__class__.retention_ratio = RETENTION_RATIO
        wan_t2v.model.__class__.residual_cache = [None, None]

        mag_ratios = MAG_RATIOS_1_3B
        if len(mag_ratios) != SAMPLE_STEPS * 2:
            mag_ratio_con = nearest_interp(mag_ratios[0::2], SAMPLE_STEPS)
            mag_ratio_ucon = nearest_interp(mag_ratios[1::2], SAMPLE_STEPS)
            mag_ratios = np.concatenate(
                [mag_ratio_con.reshape(-1, 1), mag_ratio_ucon.reshape(-1, 1)],
                axis=1).reshape(-1)
            print(f"  (interpolated mag_ratios from 50 steps -> {SAMPLE_STEPS} steps)")
        wan_t2v.model.__class__.mag_ratios = mag_ratios

    print(f"Peak VRAM after init: {_gpu_mem_snapshot()}\n")

    clips = data["clips"]
    for i, clip in enumerate(clips, start=1):
        ### get info to call generate_wan_clip
        prompt = clip["visual_prompt"]
        frame_num = clip["frame_num"]
        output_file_name = f"clips/section-{clip['section']}_clip{clip['clip_number']}.mp4"

        ### Create a dir to store clips
        os.makedirs(os.path.dirname(output_file_name), exist_ok=True)

        ### Clips generation
        print("=" * 60)
        print(f"Generating clip {i}/{len(clips)}: '{output_file_name}' ({frame_num} frames)")
        t0 = time.time()

        video = wan_t2v.generate(
            prompt,
            size=SIZE_CONFIGS[SIZE],
            frame_num=frame_num,
            shift=SAMPLE_SHIFT,
            sample_solver="unipc",
            sampling_steps=SAMPLE_STEPS,
            guide_scale=SAMPLE_GUIDE_SCALE,
            seed=SEED,
            offload_model=True,
        )
        cache_video(
            tensor=video[None],
            save_file=output_file_name,
            fps=cfg.sample_fps,
            nrow=1,
            normalize=True,
            value_range=(-1, 1),
        )

        key = f"clip_{i}"
        timings[key] = time.time() - t0
        print(f"Clip {i} ('{output_file_name}') done in {timings[key]:.1f}s -> {output_file_name}")
        print(f"Peak VRAM so far: {_gpu_mem_snapshot()}\n")

    ### Combine all clips into one
    clips_dir = os.path.abspath("clips")
    combined_output = os.path.join(clips_dir, "combined_video.mp4")
    combine_clips(clips_dir, combined_output)
    print(f"Combined video saved to {combined_output}")

if __name__ == "__main__":
    main()