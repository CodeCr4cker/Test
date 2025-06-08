import React, { useState, useEffect } from "react";
import { createUserProfile, getUserById } from "../../firebase/db";
import { auth } from "../../firebase/config";
import { updateProfile, updatePassword } from "firebase/auth";

export default function ProfileSettings({ myUid }) {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const user = await getUserById(myUid);
      setUsername(user?.username || "");
    };
    fetch();
  }, [myUid]);

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    await updateProfile(auth.currentUser, { displayName: username });
    await createUserProfile(myUid, { username });
    setLoading(false);
    alert("Username updated!");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      alert("Password updated!");
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
    setNewPassword("");
  };

  return (
    <div>
      <form onSubmit={handleUsernameChange}>
        <h3>Change Username</h3>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>Update Username</button>
      </form>
      <form onSubmit={handlePasswordChange}>
        <h3>Change Password</h3>
        <input
          type="password"
          value={newPassword}
          minLength={6}
          placeholder="New Password"
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading || newPassword.length < 6}>Update Password</button>
      </form>
    </div>
  );
}