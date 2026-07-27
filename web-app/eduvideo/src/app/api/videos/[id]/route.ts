import { NextRequest, NextResponse } from "next/server";

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || "http://localhost:8000";

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const res = await fetch(`${SERVER_BASE_URL}/api/videos/${params.id}`, {
            method: "DELETE",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error("Failed to reach job server:", err);
        return NextResponse.json(
            { error: "Failed to reach job server" },
            { status: 502 }
        );
    }
}