import { db } from '../firebase/config';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// Call this on login and when tab becomes active
export const setOnlineStatus = async (uid, online) => {
  await setDoc(doc(db, "users", uid), { online, lastSeen: serverTimestamp() }, { merge: true });
};