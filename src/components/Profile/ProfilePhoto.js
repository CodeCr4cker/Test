import React, { useState } from "react";
import { uploadProfilePhoto } from "../../firebase/storage";
import { createUserProfile, getUserById } from "../../firebase/db";

export default function ProfilePhoto({ myUid, onUpdate }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreview(URL.createObjectURL(e.target.files[0]));
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const url = await uploadProfilePhoto(myUid, file);
    await createUserProfile(myUid, { profilePhotoUrl: url });
    setLoading(false);
    setFile(null);
    setPreview("");
    if (onUpdate) onUpdate();
    alert("Profile photo updated!");
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && <img src={preview} alt="preview" style={{ maxWidth: 100 }} />}
      <button onClick={handleUpload} disabled={!file || loading}>
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}