import { db } from './config';
import { collection, addDoc, query, orderBy, onSnapshot, setDoc, doc } from "firebase/firestore";

// Start chat between two users
export const sendMessage = async (chatId, from, to, text) => {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    from, to, text, timestamp: Date.now()
  });
};

// Listen for new messages
export const listenForMessages = (chatId, cb) => {
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp'));
  return onSnapshot(q, snapshot => {
    cb(snapshot.docs.map(doc => doc.data()));
  });
};

// Typing indicator
export const setTyping = async (chatId, userId, isTyping) => {
  await setDoc(doc(db, 'chats', chatId, 'typing', userId), { isTyping });
};