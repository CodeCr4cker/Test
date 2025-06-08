import React from "react";

export default function Notification({ message, onClose }) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", top: 10, right: 10,
      background: "#333", color: "#fff", padding: "12px 24px",
      borderRadius: 5, zIndex: 1000
    }}>
      {message}
      <button onClick={onClose} style={{ marginLeft: 16, color: "#fff" }}>✕</button>
    </div>
  );
}