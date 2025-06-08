import React, { useState } from "react";
import { searchUser, sendFriendRequest } from "../../firebase/db";

export default function FriendSearch({ myUid }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const users = await searchUser(searchTerm);
    setResults(users.filter(u => u.userId !== myUid)); // don't show yourself
  };

  const sendRequest = async (uid) => {
    await sendFriendRequest(myUid, uid);
    alert("Friend request sent!");
  };

  return (
    <div>
      <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="User ID"/>
      <button onClick={handleSearch}>Search</button>
      {results.map(u => (
        <div key={u.userId}>
          {u.username} ({u.userId})
          <button onClick={() => sendRequest(u.userId)}>Add Friend</button>
        </div>
      ))}
    </div>
  );
}