import { Agent, run, tool } from "@openai/agents";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const routes = [
    { path: "/generate", description: "Start of the video generation process. The user uploads their documents and enters their prompts here" },
    { path: "/generate/edit", description: "Edit and modify features of video generation process" },
    { path: "/generate/review", description: "Review and evaluate the generated video" },
    { path: "/generate/final-video", description: "Watch and share the final video" },
    { path: "/documents", description: "Here is where the documents are stored"}
];

const navigateTool = tool({
    name: "navigate_to_page",
    description: `Navigate the user to a different page. Available routes:\n${routes
        .map(r => `- ${r.path}: ${r.description}`)
        .join("\n")}`,
    parameters: z.object({
        path: z.enum(["/generate", "/generate/edit", "/generate/final-video", "/documents"]),
        reason: z.string().describe("Why we're navigating there"),
    }),
    execute: async ({path, reason}) => {
        return JSON.stringify({navigate: true, path, reason});
    },
});

    const agent = new Agent({
        name: "Helper agent",
        instructions: "You are a helper agent for a document to video app. Help the user navigate through the video generation process and answer questions. Use navigate_to_page when the user wants to move to a different step.",
        model: "gpt-5.5",
        tools: [navigateTool]
    });

    export async function POST(req: NextRequest){
    const { message } = await req.json();
    const chat = await run(agent, message);
    const toolCall = chat.rawResponses
    ?.flatMap((r: any) => r.output ?? [])
    .find((item:any) => item.type === "function_call" && item.name === "navigate_to_page");

    if(toolCall){
        const { path, reason } = JSON.parse(toolCall.arguments);
        return NextResponse.json({
            reply: chat.finalOutput,
            navigation: {path, reason},
        });
    }
    return NextResponse.json({ reply: chat.finalOutput });
}