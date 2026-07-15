import { db } from "@/app/firebase/config";
import { doc, deleteDoc } from "firebase/firestore";
import type { User } from "firebase/auth";

export const midPipelinePages = ["/generate/edit", "/generate/review", "generate/final-video", "/generate/working"];
const PIPELINE_KEYS = [
    'prompt',
    'selectedPrompt',
    'activeFileId',
    'selectedDocument',
    'currentJobId',
    'completedVideoUrl',
    'videoDocId',
    'videoMetadata',
    'title',
    'topic',
    'desc',
    'url',
    'fileCreated',
];

export function clearPipelineState(){
    PIPELINE_KEYS.forEach(key => localStorage.removeItem(key));
}

export async function cleanupAbandoned(user: User | null | undefined){
    if(!user) return;
    
    const videoDocId = localStorage.getItem('videoDocId');
    const activeFileId = localStorage.getItem('activeFileId');
    const fileCreated = localStorage.getItem('fileCreated') === 'true';

    const deletions: Promise<void>[] = [];

    if(videoDocId){
        deletions.push(deleteDoc(doc(db, 'users', user.uid, 'videos', videoDocId)).catch(err => console.error('Failed to delete the video draft: ', err)));
    }

    if(activeFileId && fileCreated){
        deletions.push(deleteDoc(doc(db, 'users', user.uid, 'files', activeFileId)).catch(err => console.error('Failed to delete the document: ', err)));
        deletions.push(deleteDoc(doc(db, 'documentContents', activeFileId)).catch(err => console.error('Failed to delete the document contents: ', err)));
    }
    await Promise.all(deletions);
}