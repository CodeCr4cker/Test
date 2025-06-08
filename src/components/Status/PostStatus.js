import React, { useState } from "react";
import { postStatus } from "../../firebase/status";

export default function PostStatus({ myUid }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePost = async (e) => {
    e.preventDefault();
    setLoading(true);
    await postStatus(myUid, text, file);
    setText("");
    setFile(null);
    setLoading(false);
    alert("Status posted!");
  };

  return (
    <form onSubmit={handlePost}>
      <h3>Post a Status</h3>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="What's up?"
        required
      />
      <input
        type="file"
        accept="image/*,video/*"
        onChange={e => setFile(e.target.files[0])}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  );
}