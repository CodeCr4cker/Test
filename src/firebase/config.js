import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBFBtuIw0HVJl-HYZ9DSP1VZqwXMJli_W8",
  authDomain: "darknet-chat-f6b5a.firebaseapp.com",
  projectId: "darknet-chat-f6b5a",
  storageBucket: "darknet-chat-f6b5a.appspot.com",
  messagingSenderId: "485072993943",
  appId: "1:485072993943:web:262edab82d07a87b4733d2",
  measurementId: "G-2WL2PC8N6H",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
