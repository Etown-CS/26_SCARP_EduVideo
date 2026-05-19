# Katia's Paper Notes

> Format: After each paper, write: (1) Key design choice it informs, (2) What you would implement differently.

## Week 1

### ElAlami et al. 2026 
[AI-based System for Transforming Text and Sound to
Educational Videos](https://doi.org/10.54216/FPA.210115)

- Design choice: They used HTML, CSS, PHP, MYSQL and Node.js. 

- Implementation note: 
    - The **GAN** algorithm and **TiVGAN** method are used to create tutorial videos from text or sound inputs.
    - The paper also uses **CLIP** for semantic alignment in image generation and **diffusion models** for visual quality. 
    - The system has a separate image database and database of sound files to improve the generation process.

- Evaluation results
    - Primary metric (Table 2): Fréchet Inception Distance (FID) score of 28.75%
    - Compared against baselines: TGAN, MoCoGAN, and TGANS-C
    - The paper claims improved visual quality over all three


- My Notes: 
    - I will continue to research but I feel that our proposed tech stack is stronger. I will do more research to find tutorials for each piece of the tech stack once it's been finalized.
    - The framework of the proposed system (Figure 1) is inspiring. This pipeline structure is relevant for designing our EduVideo workflow.



### ... 
...
- Design choice:
- Implementation note:
- Evaluation results
- My Notes: 




---
> Continue adding entries as you read papers each week.