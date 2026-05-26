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
- Overview: A new evaluation framework for T2V system specifically for physics education

- Implementation note:
    - Four areas of metrics
        + Semantic Alignment(意味的整合性)
        + Physics Commonsense
            * Three sub-metirces
            1. Key Physical Phenomena Detection: makes sure if the video successfully captures the essential behavior described in the prompt
            2. Physics Order Verification: evaluates the temporal coherence of physical events within the video
            3. Overall Naturalness Evaluation: checks whether objects or their movements appear physically natural
        + Motion Smoothness: refers to the continuity and cogerence of object motion and background in the video
        + Temporal Flickering: checks the stability of drawings, like the consistency of colour, size, and shapes of objects across frames

    - Other features
        + Used an automatic evaluation pipeline leveraging the latest mutimodal AI model like InternVL3.5, LLaVA-Interleave, and InternVideo2 in order to increase effectivity and make sure objectivity of the evaluation metrics

    - Evaluation Results
        + With detailed points targeted to evaluate, this framework enables to more precisely evaluate the accuracy of the laws of physics which is very important in science education
        + By manual evaluations by experts, the reliability is ensured through its higher correlation with the result of framework

- My Notes: 
    - Evaluating the quality by specifying topics/courses will work good to see how well models perform

### Chen et al. 2025
[Code2Video: A Code-centric Paradigm for Educational Video Generation](https://arxiv.org/abs/2510.01174)

- Issues being tackled - In generating educational videos which require professional knowledge, precise visual structures, and consistence in logics...
    - Maintenance of Quality: 
        1. Temporal consistency
        2. Clear layout without overlapping of elements
    - Evaluation
        1. accuracy of content
        2. effectiveness as educational content

- Implementation Notes
    - Code2Video with **3 agents** for different purposes
        1. **Planner**: query to storyboard
        Designed to decompose a topic into two stages.
            * Outline generation
            * Storyboard Construction
        Also used an external database, which contains reference images aligned with the topic(to reduce hallucination), visual assets like logos(to easily generate from scratch)
        2. **Coder**: storyboard to executable code
            * Parallel Code Generation
                + Address a central bottleneck in full-code synthesis - generation time by separating code generation, debugging, and refinement to get each section  done independently
                + maintain the temporal consistency with shared assets
            * Effective Debugging - Save time and token
                + ScopeRefine(SR) - strategic refining
                -> Line scope, Block scope, and Global scope
        3. **Critic**: Effective Visual Refinement
        Refined executable codes don't always provide visually satisfying result because it's hard for text to capture the spatial features
            * Visual Anchor Prompt: manage arrangement with grids
            Two ways by the element's size
                + point-level: small elements taking a singlw anchor
                + region-level: larger elements taking up multiple anchors
            * VideoLLM for Code Feedback
                + Make all assets indexable -> easier to trace a visual issue back to its source code
                + Make available anchor visible -> enabling conflict-free reallocation

- **System Architecture: Planner**
    - The primary objective: transform an abstract learning query into a temporally coherent, logical lecture flow known as a storyboard. This 
    - Step-by-Step Pipeline
        * Input Query
            + The user provides a text-based learning topic they wish to teach (e.g., "What is a Support Vector Machine?").

        * Stage 1: Outline Generation
            + **Component:** `P_outline` (Outline Generator).
            + **Process:** The Planner decomposes the topic into a logical set of sections. Each section includes a unique ID, title, content summary, and illustrative examples.
            + **Structuring Logic:** identifies the **intended audience** (e.g., middle school vs. university students) to ensure the structure and difficulty level are appropriate. This outline serves as the **"temporal skeleton"** for the video, guiding pacing and sequencing.

        * Stage 2: Storyboard Construction**
            * **Component:** `P_storyboard` (Storyboard Constructor).
            * **Process:** The outline is refined into detailed pairs consisting of "lecture lines" and their corresponding "animation instructions".
            * **Planning Logic:** It determines the **precise sequence of events**, specifying exactly which animation triggers alongside which line of text to preserve logical flow.

        * Stage 3: Asset Retrieval and Specification**
            * **Component:** `P_asset` (Asset Analyzer) and External Database $\mathcal{D}$.
            * **Process:** The Planner analyzes the storyboard to identify essential visual assets—such as icons, logos, or reference images—that are difficult to represent with simple geometric shapes.
            * **Structuring Logic:** Retrieved assets are stored in a persistent cache ($D_{asset}$) and shared across sections to guarantee visual consistency throughout the entire video.  



> - **The Logic For Determining What to Include or Discard** 
>    * Generate outline
>        + Target (Who watches the video?): Extract the concept each level of learners should understand
>        + Summarize the topics into 3-5 sentences (introduction, development, conclusion)
>    * Storyboard (pairing)
>        + Decompose each section from the outline into lecture line and animations (minimum units)
>            - abstract concepts -> simplified or converted into visual
>            - common knowledge -> often discarded
>    * Filtering for assets
>        + Discard: something abstract which is invisible, shapes like arrows
>        + Discard: something unrelated tot he topic (with CLIP score threshold)  

- Evaluation (MMMC)
    - TeachQuiz: measure how effectively generated videos tell information
    - VLM-as-a-judge: approximate subjective judges by human
        * Element Layout - clearity of element and arrangement
        * Attractiveness
        * Logic Flow - temporal consistency
        * Visual Consistency - stability across frames and sections
        * Accuracy & Depth - the quality of content
    - Efficiency: token cost and generation time

- Result
    - Effectivity of agents: Achieved 40% increase in performance with TeachQuiz
    - Manual evaluation: In studies with middle school and university students, the AI-generated videos showed learning effects (TeachQuiz scores) comparable to or even better than professional tutorials.
    - Efficiency: 1/6 for generation time

    The paper shows that Code2Video, using Claude Opus 4.1, achieved a higher score than professional 3B1B videos for middle school students (88.1 vs 86.3).

- Remaining Issues
    - Engagement and Consistency(from metrics)
    - Gap in Storytelling: still behind human experts in storytelling, nuanced sequencing, and depth of explanation
    - Perceptual Sensitivity: Humans are highly sensitive to even minor visual errors that models might miss (leading to lower human scores for layout quality compared to automated metrics)
    - Abstract Topics: The model struggles with abstract concepts (like topology) that lack clear visual assets, and the automated asset collection can sometimes pick unusable items
    - Spatial Reasoning Limits: Still limited spatial awareness in underlying LLMs and VLMs, leading to struggle to provide precise, actionable layout corrections
    - Scalability: lighter and more scalable agent frameworks to handle a broader scope of video types

- My note
    * The code-centric paradime can be a very strong technique we can apply ours.
        + High controllability by converting prompt to code ensures logical accuracy
        + easier to trace for debugging and manual fixing
    * ScopeRefine -> better efficiency
    * Parallel generation pipeline -> Maintenance of consistency with shared assets
    * TeachQuiz -> essential metric for educational video

### Singer et al. 2022 
[Make-A-Video: Text-to-Video Generation Without Text-Video Data](https://arxiv.org/abs/2209.14792)
- Overview
    - Key Points
        * Extend T2I techniques/improvement to T2V
        * learn what the world looks like from paired text-image data and learn how the world moves from unsupervised video footage
    - Advantages
        * Accelerated training:
            + no need to learn multimodal representation form scratch
            + use pre-trained model for T2I
        * Not require dataset which links text description and corresponding videos
        * Diversity of representation
            + enable to generate diverse representation from inherited image generation models

- Implementation note
    - 3 major components consisting Make-A-Video
        1. T2I base model trained on paired text-image data
        2. Spatialtemporal and Attention layers extending the base model to time dimension
        3. Spatialtemporal network with frame interpolation network for high-frame rate

    - System Pipeline: Step-by-Step Workflow
        1. Text Encoding: The input text x is processed by a CLIP text encoder to create text embeddings and BPE-encoded tokens
        2. Prior - Semantic Planning: The Prior network translates the text embeddings into an image embedding. This stage acts as the "semantic plan," determining the visual content that corresponds to the text
        3. Spatiotemporal Decoder - Basic Structuring: Conditioned on the image embedding and a desired frame rate, the decoder generates 16 low-resolution frames (64x64 pixels). This is where the core sequence of events and motion is established
        4. Frame Interpolation - Temporal Refinement: An interpolation network increases the frame rate by generating additional frames between the initial 16, resulting in smoother motion (e.g., upsampling to 76 frames)
        5. Spatiotemporal Super-Resolution: This module increases the resolution to 256x256. It operates across both spatial and temporal dimensions to ensure that the added details are consistent across frames, preventing "flickering" artifacts
        6. Spatial Super-Resolution - Final Enhancement: The final module scales the video to 768x768. Due to memory constraints, this step is purely spatial but uses fixed noise initialization across frames to maintain detail consistency.

    - **Architecture for Planning and Structuring**  
    The following components are specifically responsible for determining the order, consistency, and structure of the generated video:
        * Prior Network (P):
            + Role: Handles semantic planning by converting abstract text into a concrete visual representation (image embedding) that guides the entire generation process
        * Pseudo-3D (P3D) Layers (Convolution and Attention):
            + Role: These layers are the primary mechanism for temporal structuring
            + Mechanism: By stacking 1D temporal layers after pre-trained 2D spatial layers, the model learns to share information between the spatial and temporal axes. This allows the model to structure motion while retaining the aesthetic knowledge inherited from image-based training
        * Spatiotemporal Decoder:
            + Role: Responsible for the initial structural layout of the video
            + Mechanism: It uses the image embedding and temporal layers to generate the first coherent sequence of frames, establishing the basic "action" described in the text

- Evaluation Result
    - Significantly outperformed prior systems like GODIVA, NÜWA, and CogVideo
    - Still hard to learn phenomena that can only be inferred from videos
    - For future work -  the generation of longer videos with multiple scenes and more detailed storytelling

>- My notes:
>    - This Make-A-Video performs well at generating a short video like "A dog wearing a superhero outfit with red cape flying through the sky" based on paired text-image data. So I feel like saying this is good at creating a scene without story. 

### Zhu et al. 2025 
[Paper2Video: Automatic Video Generation from Scientific Papers](https://arxiv.org/abs/2510.05096)

- Overview: Paper2Video: Automated Academic Presentation Video Generation  
Input: Paper, author's portrait, author's voice sample  
Output: slides, subtitles, speech, talker, cursor    
  

  
>- **The Logic For Determining What to Include or Discard** 
>    * Keys: 
>        + `structured prompting`
>        + `summarization constraints`
>        + `visual-driven refinement`
>        + `LLM`
>        + `VLM`
>    * Filtering via `Structured Prompting` (Slider Builder)
>        + Isolate essential info for academic presentation like Motivation, Related Work, Method, etc.
>        + Intentionally remove peripheral(周辺) discussion to keep it scholarly brief and professionally clear
>    * Retention of Core Information
>        + Summarization is allowed, but under a strict mandate:
>            - Ensure to have technical framework, experimental data, and primary conclusion
>        + Make sure to have essential part even the content needs to be compressed for a video format
>    * Control for Information Density
>        + Maintain a slide count of around 10
>        + Prioritize visuals over than text
>    * Subtitle Generation (Subtitle Builder)
>        + Use VLM to generate the narration
>        + keep strict alignment between the two channels
>    * Layout Optimization for overflow
>        + When the content exceeds the slides' capacity, the system applies the **Tree Search Visual Choice** to propose layout varients
>            - adjusts: font size, figure scaling
>            - VLM to optimize the layout maintaining visual integrity without losing info  


- **System Architecture & Step-by-Step Pipeline**
    1. **Input Collection**: The system takes three primary inputs: the full **LaTeX project** of the research paper, an **author's portrait** image, and a short **voice sample**.
    2. **Slide Builder**: Generates LaTeX (Beamer) code from the paper content. It involves an iterative debugging process where the system compiles the code, receives error/warning feedback, and repairs the code to ensure a valid layout.
    3. **Subtitle Builder**: Rasterizes the finalized slides into images. A Vision-Language Model (VLM) then generates **sentence-level subtitles** and **visual-focus prompts** (intermediate markers for where to look).
    4. **Cursor Builder**: Uses the visual-focus prompts to determine screen coordinates. It synchronizes these coordinates with the narration using **WhisperX** for precise word-level timing.
    5. **Talker Builder**: Synthesizes personalized speech via Text-to-Speech (TTS) and generates a talking-head video that is lip-synced to the audio.
    6. **Integration & Output**: The five channels—slides, subtitles, speech, talker, and cursor—are combined into the final presentation video.

## Week 2
### Xu et al. 2019  
[Lecture2Note: Automatic Generation of Lecture Notes from Slide-Based Educational Videos](https://www.researchgate.net/publication/334997213_Lecture2Note_Automatic_Generation_of_Lecture_Notes_from_Slide-Based_Educational_Videos).  

- Overview: This paper introduces the VIDEO-TO-DOCUMENT system converting slide-based educational videos into lecture notes


> - **Step-by-Step Pipeline & The Logic For Determining What to Include or Discard**
>    * Visual entity extraction and recognition
>        + Shot detection: The last frame of each shots of slides(SoS) is extracted
>        + Region extraction | Binarize & **Run-Length Smoothing Algorithm(RLSA)**: By identifying the .bounding boxes, extract components on slides as a visual entity.
>        + Elements Classification | **SVM**: Using aspect ratio and symbols, classify each box into fomula, text, or graph.
>
>    * Semantic Matching
>        + Calculation of semantic simlarity | **Word Mover's Distance(WMD)**: Calculate the semantic similarity between visual entities on slides and speech(subtitles)
>        + Optimization: Minimize total WMD by dividing subtitle sets to the corresponding visuals recursively.
>
>    * Layout & Structure
>        + Weight based on the importance: With the function _I(V)_, decides the area of entity(=weight)
>            - The weight is determined by the size of entity, length of explanation(speech), and type of entity(fomulas and graphs have higher importance)
>        + Arrangement optimization
>            - With the improved **Squarified Treemaps Algorithmn**, divide the slide page into rectangle blocks based on caculated weights
>            - Improve readability and page usage by optimizing the aspect ratio of each block.
>    
>        + Highlight & Filling the content
>            - Place the visual entity and the corresponding subtitles in each block
>            - Identify keywords from both visual and audio information with **TF-IDF**, highlight the important term with read

- My notes:  
Although this paper introduces the Video-To-Document System, which is opposite from what we are going to do, there were still a lot of techniques/concepts which were very interesting. I would like to consider if we can apply any of them to our project.


> Continue adding entries as you read papers each week.