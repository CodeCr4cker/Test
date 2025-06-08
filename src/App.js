// Add at the top
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";

// ...inside App component
return (
  <Router>
    <UserHeader user={user} onLogout={handleLogout} />
    <Notification message={notification} onClose={() => setNotification("")} />
    <nav>
      <Link to="/">Home</Link> | <Link to="/settings">Settings</Link>
    </nav>
    <Routes>
      <Route path="/" element={
        <div>
          <FriendSearch myUid={user.uid} />
          <FriendRequests myUid={user.uid} />
          <BlockList myUid={user.uid} />
          <PostStatus myUid={user.uid} />
          <StatusFeed myUid={user.uid} />
          <ChatList myUid={user.uid} onSelectChat={(id, friend) => {
            setChatId(id);
            setChatFriend(friend);
          }} />
          {chatId && chatFriend && (
            <ChatWindow chatId={chatId} myUid={user.uid} friend={chatFriend} />
          )}
        </div>
      } />
      <Route path="/settings" element={
        <div>
          <ProfilePhoto myUid={user.uid} onUpdate={() => setNotification("Profile photo updated!")} />
          <ProfileSettings myUid={user.uid} />
        </div>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </Router>
);