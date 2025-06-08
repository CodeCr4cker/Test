import React, { useEffect, useRef, useState } from "react";
import { listenForMessages, sendMessage, setTyping, listenTyping } from "../../firebase/chat";
import { setChatLock, getChatLock } from "../../firebase/chatLock";
import { biometricPrompt } from "../../utils/biometric";

export default function ChatWindow({ chatId, myUid, friend }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [friendTyping, setFriendTyping] = useState(false);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    let unsubMsg, unsubTyping;
    const init = async () => {
      setLoading(true);
      const isLocked = await getChatLock(myUid, chatId);
      setLocked(isLocked);
      setLoading(false);

      if (!isLocked) {
        unsubMsg = listenForMessages(chatId, setMessages);
        unsubTyping = listenTyping(chatId, friend.userId, setFriendTyping);
      }
    };
    init();
    return () => {
      unsubMsg && unsubMsg();
      unsubTyping && unsubTyping();
    };
  }, [chatId, friend.userId, myUid, locked]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  let typingTimeout;
  const handleChange = async (e) => {
    setText(e.target.value);
    await setTyping(chatId, myUid, true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => setTyping(chatId, myUid, false), 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (text.trim() && friend) {
      await sendMessage(chatId, myUid, friend.userId, text.trim());
      setTyping(chatId, myUid, false);
      setText("");
    }
  };

  const handleLock = async () => {
    await setChatLock(myUid, chatId, true);
    setLocked(true);
  };

  const handleUnlock = async () => {
    const ok = await biometricPrompt();
    if (ok) {
      await setChatLock(myUid, chatId, false);
      setLocked(false);
    } else {
      alert("Authentication failed.");
    }
  };

  if (loading) return <div>Loading chat lock...</div>;

  if (locked) {
    return (
      <div style={{ border: "1px solid #aaa", padding: 8, margin: "8px 0" }}>
        <h4>Chat Locked</h4>
        <button onClick={handleUnlock}>Unlock with fingerprint/password</button>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #aaa", padding: 8, margin: "8px 0" }}>
      <h4>Chat with {friend.username}
        <button style={{ marginLeft: 8 }} onClick={handleLock}>Lock Chat</button>
      </h4>
      <div style={{ height: 200, overflowY: "auto", background: "#f9f9f9", marginBottom: 8 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.from === myUid ? "right" : "left" }}>
            <b>{msg.from === myUid ? "You" : friend.username}:</b> {msg.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {friendTyping && <div style={{ color: "purple" }}>{friend.username} is typing...</div>}
      <form onSubmit={handleSend}>
        <input
          value={text}
          onChange={handleChange}
          placeholder="Type message..."
          style={{ width: "80%" }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}