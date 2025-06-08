import React, { useState, useEffect } from "react";
import AuthForm from "./components/Auth/AuthForm";
import ProfilePhoto from "./components/Profile/ProfilePhoto";
import ProfileSettings from "./components/Profile/ProfileSettings";
import FriendSearch from "./components/Friends/FriendSearch";
import FriendRequests from "./components/Friends/FriendRequests";
import BlockList from "./components/Friends/BlockList";
import ChatList from "./components/Chat/ChatList";
import ChatWindow from "./components/Chat/ChatWindow";
import PostStatus from "./components/Status/PostStatus";
import StatusFeed from "./components/Status/StatusFeed";
import UserHeader from "./components/Profile/UserHeader";
import Notification from "./components/Notifications/Notification";
import { logout } from "./firebase/auth";
import { setOnlineStatus } from "./utils/presence";

function App() {
  const [user, setUser] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [chatFriend, setChatFriend] = useState(null);
  const [notification, setNotification] = useState("");

  // Manage online/offline presence
  useEffect(() => {
    if (!user) return;

    setOnlineStatus(user.uid, true);

    const handleUnload = () => setOnlineStatus(user.uid, false);
    window.addEventListener("beforeunload", handleUnload);

    const handleVisibility = () => {
      setOnlineStatus(user.uid, !document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      setOnlineStatus(user.uid, false);
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNotification("Logged out successfully!");
  };

  if (!user) {
    return <AuthForm onAuth={setUser} />;
  }

  return (
    <div style={{
      maxWidth: 1200,
      margin: "0 auto",
      padding: 16,
      fontFamily: "system-ui, sans-serif",
      background: "#fafbfc",
      minHeight: "100vh"
    }}>
      <UserHeader user={user} onLogout={handleLogout} />
      <Notification message={notification} onClose={() => setNotification("")} />
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Sidebar */}
        <div style={{ flex: 1, maxWidth: 350 }}>
          <ProfilePhoto myUid={user.uid} onUpdate={() => setNotification("Profile photo updated!")} />
          <ProfileSettings myUid={user.uid} />
          <FriendSearch myUid={user.uid} />
          <FriendRequests myUid={user.uid} />
          <BlockList myUid={user.uid} />
          <PostStatus myUid={user.uid} />
          <StatusFeed myUid={user.uid} />
        </div>
        {/* Main chat area */}
        <div style={{ flex: 2, minWidth: 350 }}>
          <ChatList
            myUid={user.uid}
            onSelectChat={(id, friend) => {
              setChatId(id);
              setChatFriend(friend);
            }}
          />
          {chatId && chatFriend && (
            <ChatWindow
              chatId={chatId}
              myUid={user.uid}
              friend={chatFriend}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;