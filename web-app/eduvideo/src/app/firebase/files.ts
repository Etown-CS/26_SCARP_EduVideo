import { db } from './config';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export const getUserFiles = async (uid: string) => {
    const snapshot = await getDocs(collection(db, 'users', uid, 'files'));
    return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
};

export const addUserFile = async (uid: string, file: {name: string; prompt: string; date: string; fileUrl?: string}) => {
    const ref = await addDoc(collection(db, 'users', uid, 'files'), file);
    return ref.id;
};

export const updateUserFile = async (uid: string, fileId: string, data: Partial<{prompt: string; name: string}>) => {
    await updateDoc(doc(db, 'users', uid, 'files', fileId), data);
};

export const deleteUserFile = async (uid: string, fileId: string) => {
    await deleteDoc(doc(db, 'users', uid, 'files', fileId));
};