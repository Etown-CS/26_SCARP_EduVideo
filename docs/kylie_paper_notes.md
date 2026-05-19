# Kylie's Paper Notes

> Format: After each paper, write: (1) Key design choice it informs, (2) What you would implement differently.

## Week 1

### Hayawi et al. 2026 
[Generative AI for Text-to-Video Generation: Recent Advances
and Future Directions](https://www.mdpi.com/2673-6470/6/1/23)

- Design choice: This is a **systematic survey** of about 69 T2V papers, organized into three areas: 
    - T2V generation methods, 
    - T2V datasets, and 
    - T2V evaluation practices. 

- Implementation note:
    - **T2V methods reviewed** span three architectural families relevant to EduVideo:
        - **Diffusion models** (e.g., Make-A-Video by Meta, ModelScope by Alibaba). high-quality frame generation from text prompts; most widely adopted
        - **Diffusion Transformers / DiT** (e.g., Sora by OpenAI) — replaces U-Net with Vision Transformer; state-of-the-art quality and temporal coherence; represents video as spacetime patches
        - **Autoregressive / GAN-based** (e.g., CogVideo by Zhipu AI) — earlier approaches, lower compute cost but lower quality
    - **Systems most relevant to EduVideo:**
        - **ModelScope (Alibaba)** — open-source, runs on 8GB VRAM, good for concept visualizations and storyboards; accessible baseline for our pipeline
        - **CogVideo** — 6-second clips at 720p, 65% less compute than Sora; achieves 82% of Sora's motion coherence; viable for structured educational content
        - **Make-A-Video (Meta)** — trains on open-source data only (reproducible); good for short animated explainers from text
        - **Sora (OpenAI)** — highest quality, storyboard interface useful for sequential educational scenes; closed source/API only
    - The paper highlights **immersive learning and simulation** as primary application domains — directly applicable to EduVideo's goal of converting CS course materials into teaching videos
    - Common pipeline: text prompt → semantic encoding (CLIP/T5) → latent diffusion → video decoder → audio sync

- Evaluation results
    - Survey synthesizes evaluation practices across the field — no single experimental result
    - Most commonly used **metrics**: **FVD** (Fréchet Video Distance, measures temporal quality), **FID** (frame-level visual quality), **CLIPSIM** (text-video alignment), **IS** (Inception Score)
    - Most commonly used **benchmark datasets**: **UCF-101** (101 human action classes), **MSR-VTT** (large-scale video-text pairs), **WebVid-2M/10M** (web-scraped video-caption pairs)
    - FVD + CLIPSIM together are the standard pair for evaluating both visual quality and semantic alignment

- My Notes:




### ... 
...
- Design choice:
- Implementation note:
- Evaluation results
- My Notes: 




---
> Continue adding entries as you read papers each week.