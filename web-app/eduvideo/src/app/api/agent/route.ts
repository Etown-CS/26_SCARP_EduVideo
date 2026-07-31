import { Agent, run, tool } from "@openai/agents";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const routes = [
    { path: "/generate", description: "Start of the video generation process. The user uploads their documents and enters their prompts here" },
    { path: "/generate/edit", description: "Edit and modify features of video generation process" },
    { path: "/generate/review", description: "Review and evaluate the generated video" },
    { path: "/generate/final-video", description: "Watch and share the final video" },
    { path: "/documents", description: "Here is where the documents are stored" }
];

const navigateTool = tool({
    name: "navigate_to_page",
    description: `Navigate the user to a different page. Available routes:\n${routes
        .map(r => `- ${r.path}: ${r.description}`)
        .join("\n")}`,
    parameters: z.object({
        path: z.enum(["/generate", "/generate/edit", "/generate/final-video", "/generate/review", "/documents", "/gallery"]),
        reason: z.string().describe("Why we're navigating there"),
    }),
    execute: async ({ path, reason }) => {
        return JSON.stringify({ navigate: true, path, reason });
    },
});

export async function POST(req: NextRequest) {
    const { message, prompt, currentPage } = await req.json();
    const agent = new Agent({
        name: "Helper agent",
        instructions: `You are a helper agent for a document to video app. Help the user navigate through the video generation process and answer questions. 
        The user is currently on: "${currentPage}".
        The current prompt is: "${prompt}".
        Use navigate_to_page to take the user to the relevant page when they want to use certain features or perform certain tasks. You also have the ability to help users create and edit their video prompts. 
        If the user asks you to generate, change, or update the prompt, respond with a JSON object in this format:
        { "action": "update_prompt", "newPrompt": "the new prompt here", "navigateTo": "${currentPage === '/generate' ? '/generate' : '/generate/edit'}", "message": "your friendly confirmation message" }
        Make sure the prompt mentions to use the content from the uploaded document.
        If the user has generated a video and would like to regenerate a new one respond with a JSON object in this format:
        { "action": "regenerate_video", "prompt" : "<the prompt to use, either exisiting or modified>", "document": "<the uploaded document to use, if there is one>", "navigateTo": "/generate/working", "message" : "your friendly confirmation message"}
        Otherwise respond normally as plain text. Be consise and friendly to our users. If there is something that you do not know, tell the user explicitly. Do not guess and risk giving them false information.
            App overview:
                BluEdu allows users to upload their computer science notes or write prompts and generates a short educational video from those materials.
            Pages and their purposes:
                /documents - Allows the user to store their uploaded documents and prompts in one place. The user can go back and see what notes they have uploaded and even regenerate videos based on them.
                /gallery - Where the user can view their previously generated videos.
                /generate - Here is where the user can upload their documents and set their prompts. On this page they can choose to generate, which begins the video generation process and automatically saves the uploaded document and prompt, or save which does not start the generation process and simply saves the uploaded materials and prompt.
                /generate/edit - Here is where the user can make edits to their prompt and uploaded document if they are unsatisfied with the generated video.
                /generate/review - Here is where the user gets to see their video for the first time. The app will return an automatic evaluation of the video and the user can watch the video to see if they are satisfied with it. If they are, they can approve the video or if they are not satisfied they can return to the edit page to make changes.
                /generate/final-video - Here is where the final video will be. The user can watch their video and choose to set information for it, such as a title, description, and tags.
            Common User Questions:
                How do I upload documents? Go to the /generate page. From here the user can either browse their files to select a document or simply drag and drop the document into the upload box.
                Do I need a document to generate a video? Yes, you need a document to generate a video. A prompt on its own will break the generation pipeline and you will need to start over. 
                How do I know if I already uploaded a document? Go to the /documents page. From here you can see all of you previously uploaded documents. If you don't see the one you are looking for, then it hasn't been uploaded yet or you deleted the document.
                How long will it take to generate the video? Video generation takes time, so it will likely take a few minutes to see your video. As your video is generating, we will show you a progress bar with an estimate of how much time is remaining in the generation process.
                Can I download the finished video? At this current time we do not support video downloads, however we hope to add that feature soon.`,
        model: "gpt-5.4-nano",
        tools: [navigateTool]
    });
    const chat = await run(agent, message);
    const toolCall = chat.rawResponses
        ?.flatMap((r: any) => r.output ?? [])
        .find((item: any) => item.type === "function_call" && item.name === "navigate_to_page");

    if (toolCall) {
        const { path, reason } = JSON.parse(toolCall.arguments);
        return NextResponse.json({
            reply: chat.finalOutput,
            navigation: { path, reason },
        });
    }
    return NextResponse.json({ reply: chat.finalOutput });
}