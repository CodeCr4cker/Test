import { db, storage } from './config';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";

/**
 * Post a status (text or image)
 * @param {string} uid - User ID
 * @param {string} text - Status text
 * @param {File} [file] - Optional image or video file
 */
export const postStatus = async (uid, text, file = null) => {
  let mediaUrl = "";
  if (file) {
    const storageRef = ref(storage, `status/${uid}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    mediaUrl = await getDownloadURL(storageRef);
  }
  const expiresAt = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);
  await addDoc(collection(db, "users", uid, "status"), {
    text,
    mediaUrl,
    createdAt: serverTimestamp(),
    expiresAt,
  });
};