import { Agent, run, webSearchTool } from "@openai/agents";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

async function isLinkActive(url: string, timeoutMs = 4000): Promise<boolean>{
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try{
        let res = await fetch(url, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "follow",
        });
        if(res.status === 405 || res.status === 403){
            res = await fetch(url, {
                method: "GET",
                signal: controller.signal,
                redirect: "follow",
            });
        }
        return res.ok;
    }catch{
        return false;
    }finally{
        clearTimeout(timeout);
    }
}

async function filterValidResults<T extends {url: string}>(
    resources: T[]
): Promise<T[]>{
    const results = await Promise.all(
        resources.map(async(r) => ({
            resource: r,
            alive: await isLinkActive(r.url),
        }))
    );
    return results.filter((r) => r.alive).map((r) => r.resource);
}

const sources = z.object({
    resources: z.array(
        z.object({
            title: z.string(),
            url: z.string(),
            description: z.string(),
        })
    ),
});

export async function POST(req: NextRequest){
    //possibly add in topics here for more accurate search results
    const {message} = await req.json();
    const search = new Agent({
        name: "Search Agent",
        instructions: `You are a search agent that will provide the user of a document to video app with additional resources to help their study. 
        You will be given a topic. Your job is to find 5-6 high-quality, relevant sources using web search and return them. Prefer stable, well-established pages (such as official docs or major publications) over obscure or temporary pages since the links must remain valid.`,
        model: "gpt-4.1",
        tools: [webSearchTool()],
        outputType: sources,
    });
    const result = await run(search, `Topic: ${message}`);
    if(!result.finalOutput){
        return NextResponse.json({error: "Agent did not return a result"}, {status: 502});
    }
    const validated = await filterValidResults(result.finalOutput.resources);
    return NextResponse.json({reply: {resources: validated}});
}
