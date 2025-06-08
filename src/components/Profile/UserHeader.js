import React, { useEffect, useState } from "react";
import { getUserById } from "../../firebase/db";
import { auth } from "../../firebase/config";

export default function UserHeader({ user, onLogout }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      if (user?.uid) {
        const data = await getUserById(user.uid);
        setProfile(data);
      }
    };
    fetch();
  }, [user]);

  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
      <img
        src={profile?.profilePhotoUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(profile?.username || user?.displayName || "User")}
        alt="profile"
        style={{ width: 40, height: 40, borderRadius: "50%", marginRight: 12, border: '1px solid #ccc' }}
      />
      <div style={{ fontWeight: "bold" }}>
        {profile?.username || user?.displayName || user?.email}
      </div>
      <button style={{ marginLeft: "auto" }} onClick={onLogout}>Logout</button>
    </div>
  );
}