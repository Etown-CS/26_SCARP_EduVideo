# SCARP Project Plan
**Project:** Turning CS Notes into Teaching Videos: An AI-Driven Document-to-Video System

**Duration:** 10 weeks (05/18 – 07/31)

**Students:**
- **Student A** | Back-end AI video generation pipeline
- **Student B** | Front-end web application 
- **Both** | evaluation

---

## Week 1 · 05/18 – 05/22 · `Setup`

*The literature review is what lets you argue novelty. Without knowing what existing T2V systems and educational video platforms already do, you cannot claim what is new about your approach. The gap identified here becomes the research question the rest of the project answers.*

### Student A — Back-end
- Review literature on AI-driven **T2V pipelines**
- Tutorial on **agentic architectures**
- Survey existing **video generation models**  
- Set up Python development environment, virtual environment, and dependency management (pip, requirements.txt)

### Student B — Front-end
- Review similar educational video platforms and prior work on AI-generated educational content
- Create the GitHub project Kanban board with columns: To Do, In Progress, Review, Done
- Requirements Engineering
- Sketch UI design for the key pages
- Set up project scaffold based on the tech stack design and initialize the shared Git repository

### Both
- **Survey evaluation methods from prior work**: for each paper reviewed, record the evaluation metrics used (e.g., FID, CLIP score for automated metrics, and Likert ratings, comprehension scores for user study evaluation), reported benchmark values, and the video generation model evaluated — compile findings into a shared reference table to inform the evaluation design in Week 2.

> **End-of-week milestone:** Dev environments running for both students; Git repo and Kanban board initialized; initial UI sketches drafted; evaluation metrics reference table compiled from prior work.

---

## Week 2 · 05/25 – 05/29 · `Requirements Engineering`

*The architecture diagram and API contract define the boundaries of the system you are claiming to have built. Vague architecture means a vague contribution. A well-specified agent design is what makes the system reproducible and critiquable by reviewers.*

### Student A — Back-end
- Draft an initial agentic architecture diagram showing each agent's role and the data flow between them
    - For example: the draft agentic architecture could consists of Document Analysis Agent, Pedagogical Structuring Agent, Script Generation Agent, etc.
- Design a document segmentation and content extraction strategy for the **Document Analysis Agent**. 
    - For example: the Document Analysis Agent might be able to extract the topics, classify text into definitions, examples, step-by-step explanations, etc.
    - Document Analysis Agent could use LLM APIs to extract and label document segments
- Define the shared input JSON schema (API contract to be agreed with Student B)
- Update Github and Write the back-end repository README and initial setup guide

### Student B — Front-end
- Refine UI design based on Week 1 feedback
- Build the Next.js page skeleton: routing structure, shared layout component, and navigation header
- Define the data model (jobs table, and other tables) and video metadata schema (title, topic, tags, length, creation date, input source)
- Agree on the API contract with Student A: endpoint paths, request/response formats, and HTTP status codes
- **Design the automated evaluation protocol** based on the Week 1 metrics reference table:
    - Adopt FID and CLIP score as primary metrics, justified by their use in the closest prior T2V work
    - Define success thresholds based on benchmark values from prior work (e.g., FID ≤ X on a comparable dataset; CLIP score ≥ Y)
    - Specify the reference dataset and ground-truth videos to compute FID against
    - Specify what would count as a "failed" video (e.g., FID or CLIP score outside acceptable range)
    - Document the protocol and share with mentor for feedback

> **End-of-week milestone:** API contract signed off by both students and mentor; automated evaluation protocol with FID/CLIP score targets reviewed by mentor.

---

## Week 3 · 06/01 – 06/05 · `Build — Core Pipeline & Application Skeleton`

*The agentic pipeline is the primary research artifact. The design choices made here — how to decompose the problem into agents, what each agent is responsible for — are the intellectual claims the paper defends. The front-end skeleton makes those claims testable by real users.*

### Student A — Back-end
- Implement APIs that return mock responses so front-end can be tested independently
- Implement the **Pedagogical Structuring Agent**: reorders extracted segments into a beginner-friendly teaching sequence
- Implement the **Script Generation Agent**: produces concise narration with constraints on length, tone, and reading level for undergraduates
- Test both agents on 2-3 CS topics; manually review outputs for pedagogical soundness and factual accuracy
- Set up the central Python orchestrator that chains Document Analysis → Pedagogical Structuring → Script Generation in sequence

### Student B — Front-end
- Implement the Video Generation page UI: file upload / paste text input, concept-type selector dropdown, submit button
- Stub out the video generation request API route (returns a mock job ID and status so the page can be tested independently)
- Display a placeholder video player that will show the result once generation completes

> **End-of-week milestone:** Core pipeline agents (Pedagogical Structuring + Script Generation) produce reviewable output on at least two CS topics; front-end generation page with stubbed API is runnable locally.

---

## Week 4 · 06/08 – 06/12 · `Build — Remaining Agents & Front-end Integration`

*Completing the full five-agent pipeline closes the artifact. The Quality Review Agent in particular is a research-relevant design decision — it is what makes the system self-correcting rather than a simple prompt chain, and warrants its own discussion in the paper.*

### Student A — Back-end
- Implement the **Visual Planning Agent**: determines on-screen elements for each narration segment (code highlights, diagrams, flowcharts, bullet points)
- Implement the **Quality Review Agent**: checks scripts and visual plans for clarity, redundancy, and potential inaccuracies; flags segments for revision before video assembly
- Wire all five agents into the orchestrator and run the full pipeline end-to-end on one complete CS topic document
- Document each agent's input/output schema and add inline code comments throughout the codebase

### Student B — Front-end
- Set up minimal data store for job tracking (jobs table (TBD): job ID, status, video URL, topic, creation date)
- Wire the Video Generation page to the stubbed API: form submission creates a job and displays its status
- Conduct an internal walkthrough of the generation page and document any UX issues for Week 5 refinement

> **End-of-week milestone:** Integration readiness check with mentor — both tracks ready to connect in Week 5.

---

## Week 5 · 06/15 – 06/19 · `Integration — Live API & First Full Videos`

*A pipeline that cannot be run end-to-end cannot be studied. Integration converts two independent components into a single system you can put in front of users. The first prototype video is the proof that the full claim — notes in, teaching video out — is achievable.*

### Student A — Back-end
- Integrate a video generation model to render short video clips from the structured script and visual plan
- Implement an asynchronous job queue so video generation runs in the background without blocking the web request
- Expose a REST endpoint for job status polling; return a progress percentage and final video file URL upon completion
- Generate the first full prototype video for one CS topic (e.g., "for loops in Python") and review it with the mentor

### Student B — Front-end
- Connect the Video Generation page to the live back-end API, replacing all stub responses with real HTTP calls
- Implement a progress indicator: a polling loop that updates a progress bar using the job status endpoint
- Display the completed video inline via an HTML5 video player once generation finishes
- Display the completed video inline via an HTML5 video player once the job status endpoint signals completion

> **End-of-week milestone:** First end-to-end video generated from a real CS document and playable inside the web app; progress bar updates correctly via live API.

---

## Week 6 · 06/22 – 06/26 · `Integration — Debugging & Evaluation Setup`

*A system that crashes or produces malformed outputs during evaluation produces unusable metric scores. Stabilizing the integration here protects the evaluation. Setting up the FID/CLIP scoring pipeline now gives time to catch tooling issues before the full video library is ready.*

### Student A — Back-end
- Generate videos for 3–4 CS topics (e.g., while loops, recursion basics, array traversal, binary search)
- (TBD) Iteratively refine scripts where the Quality Review Agent flags issues; tune agent prompts based on observed output quality
- Evaluate different video generation model options; compare output quality, latency, and cost across candidates
- Document lessons learned from model selection and record the final chosen configuration

### Student B — Front-end
- (TBD) Run end-to-end integration test: submit a note document → monitor progress → view final video
- Fix integration bugs uncovered by the end-to-end test (error states, loading edge cases, failed jobs)
- (TBD) Add user-friendly error messages to the generation page for all known failure modes
- (TBD) Set up the automated evaluation tooling: configure FID and CLIP score computation scripts against the generated videos
- Run a trial evaluation on the 3–4 generated videos; verify metric outputs are plausible and flag any tooling issues

> **End-of-week milestone:** System passes end-to-end integration test with 3–4 generated videos; FID and CLIP score pipeline runs successfully on trial outputs.

---

## Week 7 · 07/06 – 07/10 · `Expand — More Topics & UI Polish`

*Automated metrics computed on 2 videos are a proof of concept. Covering 6–8 diverse CS topics (loops, recursion, data structures) is what lets you claim the system generalizes across topic types rather than being tuned to one example. Breadth here directly strengthens the validity of the FID and CLIP score findings.*

### Student A — Back-end
- Expand the pipeline to support 3–4 additional CS topics (e.g., linked lists, stacks, queues, sorting algorithms)
- Collect and pre-process additional instructional materials for each newly added topic
- (TBD) Refine the Visual Planning Agent to generate simple diagrams and flowchart descriptions for data structure topics
- (TBD) Stress-test the pipeline with longer documents; identify and fix any performance bottlenecks

### Student B — Front-end
- Refine the UI based on observations from Week 6 integration testing
- Write front-end component documentation and a developer setup guide

> **End-of-week milestone:** Pipeline covers 6–8 CS topics; generation page is polished and stable.

---

## Week 8 · 07/13 – 07/17 · `Expand — Full Video Library & Evaluation Readiness`

*The quality audit ensures the artifact you are evaluating meets a baseline standard — low-quality videos would confound metric scores by conflating model failure with pipeline design choices. Running FID and CLIP scores across the full library here surfaces any outliers before the final evaluation in Week 9.*

### Student A — Back-end
- Generate remaining videos to reach the target library of 6–10 short instructional clips covering all selected topics
- Perform a manual quality audit of every generated video: check narration accuracy, pacing, and visual coherence
- Revise scripts and regenerate any video segments that fail the quality audit
- Prepare back-end technical documentation: system architecture diagram, pipeline data flow, and a list of known limitations

### Student B — Front-end
- Conduct a quick walkthrough of the generation page with the mentor; fix any remaining UI issues
- (TBD) Run FID and CLIP score evaluation across the full video library; flag any videos that fall outside the target thresholds
- (TBD) Revise or regenerate flagged videos and re-evaluate until the full library meets the defined success criteria

> **End-of-week milestone:** Full video library of 6–10 clips passes quality audit; all videos meet the FID and CLIP score thresholds defined in the evaluation protocol.

---

## Week 9 · 07/20 – 07/24 · `Evaluation — Automated Metrics & Analysis`

*This is the phase that answers the research question. FID and CLIP scores across the full video library — compared against prior-work benchmarks — are the empirical evidence for the system's video quality and text-video alignment claims. Without this analysis, the project has a system but no research finding.*

### Student A — Back-end
- Ensure the back-end is stable and all videos are accessible for final evaluation
- (TBD) Run the final FID evaluation across the complete video library; record per-topic and aggregate scores
- (TBD) Run the final CLIP score evaluation; record per-topic and aggregate scores
- Compare all scores against the success thresholds defined in the Week 2 evaluation protocol and prior-work benchmarks
- Begin drafting the back-end section of the final written report (architecture, agent design, evaluation findings)

### Student B — Front-end
- (TBD) Compile the full evaluation dataset: per-video FID scores, CLIP scores, and metadata (topic, generation model, pipeline version)
- (TBD) Perform the final analysis: summary statistics, score distributions across topics, and comparison against benchmarks
- Identify and document failure cases: videos that did not meet thresholds and the likely pipeline stage responsible
- Begin drafting the evaluation and findings section of the written report

> **End-of-week milestone:** Full evaluation dataset compiled; FID and CLIP score analysis complete with results compared against prior-work benchmarks.

---

## Week 10 · 07/27 – 07/31 · `Final — Report, Poster & Symposium`

*The report and poster are where results become a contribution — situating findings in the broader literature, acknowledging limitations, and proposing future work. This is the difference between "we built and measured a thing" and "here is what this means for AI-generated education."*

### Student A — Back-end
- Complete and finalize the back-end section of the written report; review and edit Student B's evaluation and findings section
- Finalize all technical documentation: API reference, setup guide, known limitations, and suggestions for future extension
- Contribute pipeline architecture diagrams and example scripts/video plans to the research poster
- Prepare and rehearse the live system demo for the SCARP Symposium presentation
- Complete the SCARP final reflection

### Student B — Front-end
- Complete the analysis of evaluation data: summary statistics (FID and CLIP score distributions across topics), comparison against prior-work benchmarks, and key findings
- Write the evaluation and findings section of the written report; draft overall conclusions and limitations
- Design and produce the research poster: methods overview, system architecture, evaluation results, and future work
- Finalize front-end user documentation: a how-to guide for uploading notes and generating a video
- Complete the SCARP final reflection

> **End-of-week milestone:** Final written report, research poster, and system demo submitted and presented at the SCARP Symposium.

---

## Deliverables Summary

| # | Owner | Due | Deliverable |
|---|---|---|---|
| 1 | Student B | Week 8 | Working web application: note input, video generation, progress tracking, and video playback |
| 2 | Student A | Week 8 | Library of 6–10 short instructional videos with scripts, lecture materials and video plans |
| 3 | Both | Week 9 | Evaluation dataset: per-video FID scores, CLIP scores, and metadata across all topics |
| 4 | Both | Week 10 | Analysis of evaluation data: score distributions, benchmark comparisons, and failure case documentation |
| 5 | Both | Week 10 | Technical and user documentation for system architecture and pipeline |
| 6 | Both | Week 10 | Final written report |
| 7 | Both | Week 10 | Research poster for SCARP Symposium |
