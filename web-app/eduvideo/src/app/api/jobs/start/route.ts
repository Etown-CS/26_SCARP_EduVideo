import { NextRequest, NextResponse } from "next/server";

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const {userId, videoDocId, fileId, prompt, outputName } = body;

    if(!userId || !videoDocId || !fileId){
        return NextResponse.json(
            {error: "Missing required fields: userId, videoDocId, fileId"},
            {status: 400}
        );
    }

    try{
        const res = await fetch(`${SERVER_BASE_URL}/jobs/start`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                userId,
                videoDocId,
                fileId,
                prompt,
                outputName,
            }),
        });
        if (!res.ok){
            const errText = await res.text();
            return NextResponse.json(
                {error: `Job server responded with ${res.status}: ${errText}`},
                {status: 502}
            );
        }
        const data = await res.json();
        return NextResponse.json(data);
    }catch (err){
        console.error("Failed to reach job server: ", err);
        return NextResponse.json(
            {error: "Failed to reach job server"},
            {status: 502}
        );
    }
}