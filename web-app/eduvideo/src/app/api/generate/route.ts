import { NextRequest, NextResponse } from "next/server";

const STUB_MODE = process.env.STUB_VIDEO_GENERATION === 'true';

const mockJobs: Record<string, {status: string; progress: number; videoUrl?: string}> = {};

export async function POST(req: NextRequest){
    const {document, prompt} = await req.json();

    if(STUB_MODE){
        const jobId = `mock-job-${Date.now()}`;
        mockJobs[jobId] = { status: 'processing', progress: 0};

        let progress = 0;
        const interval = setInterval(() => {
            progress += 25;
            mockJobs[jobId].progress = progress;
            if(progress >= 100){
                mockJobs[jobId].status = 'complete';
                mockJobs[jobId].videoUrl = '/mock-video.mp4';
                clearInterval(interval);
            }
        }, 2000);
        return NextResponse.json({jobId, status:' processing', progress: 0});
    }
    return NextResponse.json({error: 'Not implemented'}, {status: 501});
}

export async function GET(req: NextRequest){
    const jobId = req.nextUrl.searchParams.get('jobId');

    if(STUB_MODE && jobId && mockJobs[jobId]){
        return NextResponse.json({jobId, ...mockJobs[jobId]});
    }
    return NextResponse.json({error: 'Job not found'}, {status: 404});
}