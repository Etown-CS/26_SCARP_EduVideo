import { NextResponse } from "next/server";
import admin from "@/app/firebase/admin";

export async function POST(req: Request){
    const { email } = await req.json();

    try{
        await admin.auth().getUserByEmail(email);
        return NextResponse.json({ exists: true });
    }catch (error: any){
        if(error.code === 'auth/user-not-found'){
            return NextResponse.json({ exists: false });
        }
        return NextResponse.json({ error: 'Something went wrong.'}, { status: 500 });
    }
}