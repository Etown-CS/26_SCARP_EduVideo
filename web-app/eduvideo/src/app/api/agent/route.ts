import { Agent, run } from "@openai/agents";
import { NextRequest, NextResponse } from "next/server";

const agent = new Agent({
    name: "Helper agent",
    instructions: "You will answer the users questions to the best of your ability.",
    model: "gpt-5.5",
});

export async function POST(req: NextRequest){
    const{ message } = await req.json();
    const chat = await run(agent, message);
    return NextResponse.json({ reply: chat.finalOutput });
}