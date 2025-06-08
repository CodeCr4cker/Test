// Add to db.js if not present
import { collection, query, where, getDocs } from "firebase/firestore";
export const searchUser = async (userId) => {
  const q = query(collection(db, "users"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data());
};