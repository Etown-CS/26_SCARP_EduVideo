import { NextRequest, NextResponse } from "next/server";

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || "http://localhost:8000";

export async function POST(req: NextRequest){
    const {userId, videoDocId} = await req.json();
    if(!userId || !videoDocId) {
        return NextResponse.json({error: "Missing userId or videoDocId."}, {status: 400});
    }
    try{
        const res = await fetch(`${SERVER_BASE_URL}/jobs/cancel`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({userId, videoDocId}),
        });
        return NextResponse.json(await res.json(), {status: res.status});
    }catch (err){
        console.error("Failed to reach job server: ", err);
        return NextResponse.json({error: "Failed to reach job server"}, {status: 502});
    }
}