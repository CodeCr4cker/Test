import React, { useEffect, useState } from "react";
import { getFriends, getUserById } from "../../firebase/db";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";

export default function StatusFeed({ myUid }) {
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    const fetchStatuses = async () => {
      const friendIds = await getFriends(myUid);
      const now = Date.now();
      const allStatuses = [];

      for (const uid of [...friendIds, myUid]) { // include your own
        const user = await getUserById(uid);
        const q = query(
          collection(db, "users", uid, "status"),
          where("expiresAt", ">", new Date(now))
        );
        const snap = await getDocs(q);
        snap.forEach(doc => {
          const data = doc.data();
          allStatuses.push({
            uid,
            username: user.username,
            ...data
          });
        });
      }
      // Sort by createdAt, newest first
      allStatuses.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setStatuses(allStatuses);
    };
    fetchStatuses();
  }, [myUid]);

  return (
    <div>
      <h3>Status Feed</h3>
      {statuses.length === 0 && <div>No statuses yet</div>}
      <ul>
        {statuses.map((status, idx) => (
          <li key={idx}>
            <b>{status.username}</b>: {status.text}
            {status.mediaUrl && (
              <div>
                <img src={status.mediaUrl} alt="status" style={{ maxWidth: 100 }} />
              </div>
            )}
            <small>
              {(new Date(status.createdAt?.seconds * 1000)).toLocaleString()} (expires {(new Date(status.expiresAt?.seconds * 1000)).toLocaleTimeString()})
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}