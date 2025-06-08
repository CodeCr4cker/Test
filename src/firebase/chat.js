import { db } from './config';
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// ...existing chat code...

export const setTyping = async (chatId, uid, isTyping) => {
  await setDoc(doc(db, 'chats', chatId, 'typing', uid), { isTyping }, { merge: true });
};

export const listenTyping = (chatId, friendUid, cb) => {
  // Listen to friend's typing status
  return onSnapshot(doc(db, 'chats', chatId, 'typing', friendUid), (docSnap) => {
    cb(docSnap.exists() && docSnap.data().isTyping);
  });
};