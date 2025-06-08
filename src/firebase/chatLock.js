import { db } from './config';
import { doc, setDoc, getDoc } from "firebase/firestore";

// Set lock state for a chat
export const setChatLock = async (uid, chatId, locked) => {
  await setDoc(doc(db, "users", uid, "chat_locks", chatId), { locked });
};

// Get lock state for a chat
export const getChatLock = async (uid, chatId) => {
  const snap = await getDoc(doc(db, "users", uid, "chat_locks", chatId));
  return snap.exists() ? snap.data().locked : false;
};