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
    - Three main generative architectures
        + Variational Autoencoder(VAEs):
            * consists of an encoder and a decoder - compress -> reconstruct
            * Instead of mapping an image to a coordinate as a standard autoencoder does, VAEs map an image to a probabilistic distribution
            * ELBO: a key parameter to balance two things(ELBO = (a) - (b)) and let VAE learn wisely
                1. Reconstruction Loss (how close the output is to the original)
                2. KL Divergence (how far from the standardized distribution)
        + Diffusion models (most popular)
            * Adding noise to the image until it becomes pure noise -> reverse a noise procedure by parameterizing with transformer architectures
            * Main weakness of standalone Diffusion Models: they do not have a direct way for humans to control the generated video, so they need extra tools to guess the right parameters
        + Autoregressive models: generate an image one element at a time by referring to the previous element - like creating a story
            * Cons: small mistakes can grow bigger over time (like a game of telephone)
            * Pros: use much less memory, making them good for long videos
    - Video understanding (essential to meet the gaps between texts and videos)
        + SAMWISE
            * tracks objects based on text
            * SAM2(Segment Anything Model 2), an open-source AI foundation model designed to identify, select, and track objects across both images and videos
        + VD-IT
            * based on the idea of "a model that can create videos can also understand them."
            * Reuse pretrained video generative AI to interpret the video (use the generative models for both video synthesis and understanding backbone)

        + ShareGPT4Video
            * aim to improve both generation & understanding through the video captioning
            * focus on "differential captioning," allowing to annotate any videos of varying length and complexity by capturing detailed visuals and temporal evolution
            * The quality is heavily dependent on how accurate the auto-generated captions are
    - Video datasets
        + VidProM - real user prompts
            * contains 1.67 million of actual user prompts and 6.7 million videos generated from those prompts with four different models
        + OpenVid-1M - high-resolution videos with clear descriptions
            * 1 million videos with high resolution and detailed explanation
        + MiraData - deal with the lack of long clips, and movement in short-video datasets
            * average video length 72 seconds, and more than 200 words of detailed, structured caption for each

    - Other takeaways
        + modern T2V systems are built with hybrid architectures
        + Adding audio is largely uncharted territory since current system often generates silent videos.


### Mariam et al. 2026
[PhyEduVideo: A Benchmark for Evaluating Text-to-Video Models for Physics Education](https://arxiv.org/abs/2601.00943)
- Overview: This paper introduces a new evaluation framework for T2V system specifically for physics education

- Implementation note:
    - Four areas of metrics
        + Semantic Alignment(意味的整合性)
        + Physics Commonsense
            * Three sub-metirces
            1. Key Physical Phenomena Detection:
            Makes sure if the video successfully captures the essential behavior described in the prompt
            2. Physics Order Verification
            Evaluates the temporal coherence of physical events within the video
            3. Overall Naturalness Evaluation
            Checks whether objects or their movements appear physically natural
        + Motion Smoothness
        refers to the continuity and cogerence of object motion and background in the video
        + Temporal Flickering
        Checks the stability of drawings, like the consistency of colour, size, and shapes of objects across frames

    - Other features
        + Used an automatic evaluation pipeline leveraging the latest mutimodal AI model like InternVL3.5, LLaVA-Interleave, and InternVideo2 in order to increase effectivity and make sure objectivity of the evaluation metrics

    - Evaluation Results
        + With detailed points targeted to evaluate, this framework enables to more precisely evaluate the accuracy of the laws of physics which is very important in science education
        + By manual evaluations by experts, the reliability is ensured through its higher correlation with the result of framework

- My Notes: 
    - Evaluating the quality by specifying topics/courses will work good to see how well models perform




---
> Continue adding entries as you read papers each week.