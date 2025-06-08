import React, { useEffect, useState } from "react";
import { getIncomingRequests, acceptFriendRequest, rejectFriendRequest, getUserById } from "../../firebase/db";

export default function FriendRequests({ myUid }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const reqs = await getIncomingRequests(myUid);
      // Optionally fetch usernames
      const withUser = await Promise.all(reqs.map(async r => ({
        ...r,
        username: (await getUserById(r.from)).username
      })));
      setRequests(withUser);
    };
    fetch();
  }, [myUid]);

  const accept = async (fromUid) => {
    await acceptFriendRequest(myUid, fromUid);
    setRequests(reqs => reqs.filter(r => r.from !== fromUid));
  };
  const reject = async (fromUid) => {
    await rejectFriendRequest(myUid, fromUid);
    setRequests(reqs => reqs.filter(r => r.from !== fromUid));
  };

  return (
    <div>
      <h3>Friend Requests</h3>
      {requests.length === 0 && <div>No requests</div>}
      {requests.map(r => (
        <div key={r.from}>
          {r.username} ({r.from})
          <button onClick={() => accept(r.from)}>Accept</button>
          <button onClick={() => reject(r.from)}>Reject</button>
        </div>
      ))}
    </div>
  );
}