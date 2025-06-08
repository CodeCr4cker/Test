import { storage } from './config';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadProfilePhoto = async (uid, file) => {
  const storageRef = ref(storage, `profile_photos/${uid}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};