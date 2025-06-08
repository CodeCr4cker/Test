import React, { useState, useEffect } from "react";
import { getBlockedUsers, blockUser, unblockUser, getUserById } from "../../firebase/db";

export default function BlockList({ myUid }) {
  const [blocked, setBlocked] = useState([]);
  const [blockInput, setBlockInput] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const blockedIds = await getBlockedUsers(myUid);
      const users = await Promise.all(blockedIds.map(uid => getUserById(uid)));
      setBlocked(users);
    };
    fetch();
  }, [myUid]);

  const handleBlock = async () => {
    await blockUser(myUid, blockInput);
    setBlockInput("");
    // refresh
    const blockedIds = await getBlockedUsers(myUid);
    const users = await Promise.all(blockedIds.map(uid => getUserById(uid)));
    setBlocked(users);
  };

  const handleUnblock = async (uid) => {
    await unblockUser(myUid, uid);
    setBlocked(blocked => blocked.filter(u => u.userId !== uid));
  };

  return (
    <div>
      <h3>Blocked Users</h3>
      <input value={blockInput} onChange={e => setBlockInput(e.target.value)} placeholder="User ID to block"/>
      <button onClick={handleBlock}>Block</button>
      <ul>
        {blocked.map(u => (
          <li key={u.userId}>
            {u.username} ({u.userId})
            <button onClick={() => handleUnblock(u.userId)}>Unblock</button>
          </li>
        ))}
      </ul>
    </div>
  );
}