// ...inside map for each friend:
<img
  src={f.profilePhotoUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(f.username)}
  alt="profile"
  style={{ width: 32, height: 32, borderRadius: "50%", marginRight: 8 }}
/>