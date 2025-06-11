import React, { useState, useEffect, useRef } from "react";
import {
  initializeApp
} from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  orderBy,
  limit,
  setDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  writeBatch
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

// --------- Firebase Config and Initialization ---------
const firebaseConfig = {
  apiKey: "AIzaSyBFBtuIw0HVJl-HYZ9DSP1VZqwXMJli_W8",
  authDomain: "darknet-chat-f6b5a.firebaseapp.com",
  projectId: "darknet-chat-f6b5a",
  storageBucket: "darknet-chat-f6b5a.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdefg12345",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ----------- THEME CONTEXT -----------
const ThemeContext = React.createContext();

// ----------- LOADER COMPONENT (before login) -----------
const LoaderScreen = ({ onEnd }) => {
  useEffect(() => {
    const t = setTimeout(onEnd, 3000);
    return () => clearTimeout(t);
  }, [onEnd]);
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        <img
          src="/images/logo.jpeg"
          alt="App Icon"
          style={{
            width: 80,
            height: 80,
            marginBottom: 25,
            marginTop: -40
          }}
        />
        <div style={{ fontWeight: 900, color: "#219653", fontSize: 32, marginBottom: 30, letterSpacing: 2 }}>
          Buddy Chat
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="loader-bar" style={{
            width: 180,
            height: 10,
            background: "#222",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 3px 14px rgba(33, 150, 83, 0.15)"
          }}>
            <div className="loader-bar-inner" style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(90deg,#219653,#6ee7b7)",
              animation: "loaderBarAnim 3s linear"
            }} />
          </div>
        </div>
        <style>{`
        @keyframes loaderBarAnim {
          from { width: 0%; }
          to   { width: 100%; }
        }
        `}</style>
      </div>
    </div>
  );
};

export default function App() {
  // ====== States ======
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [username, setUsername] = useState("");
  const [usernameEdit, setUsernameEdit] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [userId, setUserId] = useState("");
  const [profilePhotoURL, setProfilePhotoURL] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [meetingRoomChats, setMeetingRoomChats] = useState([]);
  const [currentChatFriend, setCurrentChatFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newMedia, setNewMedia] = useState(null);
  const [typingStatus, setTypingStatus] = useState({});
  const [newPassword, setNewPassword] = useState("");
  const [reauthPassword, setReauthPassword] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [blockUserInput, setBlockUserInput] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [chatPasswords, setChatPasswords] = useState(
    JSON.parse(localStorage.getItem("chatPasswords") || "{}")
  );
  const [showChatPasswordModal, setShowChatPasswordModal] = useState(false);
  const [chatPasswordInput, setChatPasswordInput] = useState("");
  const [requirePassword, setRequirePassword] = useState(false);
  const [chatPasswordPrompt, setChatPasswordPrompt] = useState("");
  const [chatUnlockError, setChatUnlockError] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);
  const [chatWallpaper, setChatWallpaper] = useState(localStorage.getItem("chatWallpaper") || "");
  const [usernameAvailability, setUsernameAvailability] = useState("");
  // Group creation states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [groups, setGroups] = useState([]);

  // ====== Responsive ======
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 800);
      if (window.innerWidth > 800) setShowSidebar(true);
      if (window.innerWidth <= 800 && currentChatFriend) setShowSidebar(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentChatFriend]);

  // ====== Loader before login ======
  useEffect(() => {
    if (!showLoader) setLoading(false);
  }, [showLoader]);

  // ----------- Auth Listener -----------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        await loadUserData(currentUser.uid);
        subscribeFriendRequests(currentUser.uid);
        subscribeFriends(currentUser.uid);
        subscribeBlockedUsers(currentUser.uid);
        subscribeOnlineStatus(currentUser.uid);
        setOnlineStatus(currentUser.uid, true);
        setUserId(currentUser.uid);
        subscribeMeetingRoomChats(currentUser.uid);
        subscribeGroups(currentUser.uid);
      } else {
        setFriendRequests([]);
        setFriends([]);
        setBlockedUsers([]);
        setMessages([]);
        setCurrentChatFriend(null);
        setProfilePhotoURL(null);
        setMeetingRoomChats([]);
        setUserId("");
        setGroups([]);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, []);

  // ----------- Group Chat Functions -----------
  function subscribeGroups(uid) {
    // Groups where user is a member
    const q = query(collection(db, "groups"), where("members", "array-contains", uid));
    return onSnapshot(q, (querySnapshot) => {
      const arr = [];
      querySnapshot.forEach(doc => {
        arr.push({ id: doc.id, ...doc.data() });
      });
      setGroups(arr);
    });
  }

  async function createGroup() {
    if (!groupName.trim() || groupMembers.length === 0) return;
    try {
      const docRef = await addDoc(collection(db, "groups"), {
        groupName: groupName.trim(),
        members: Array.from(new Set([user.uid, ...groupMembers])),
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setShowGroupModal(false);
      setGroupName("");
      setGroupMembers([]);
      setCurrentChatFriend({ uid: docRef.id, isGroup: true });
      if (isMobile) setShowSidebar(false);
    } catch (err) {
      setError(err.message);
    }
  }

  function openGroupModal() {
    setShowGroupModal(true);
    setGroupName("");
    setGroupMembers([]);
  }

  function closeGroupModal() {
    setShowGroupModal(false);
    setGroupName("");
    setGroupMembers([]);
  }

  // ----------- Ensure Unique Username -----------
  async function isUsernameTaken(name, excludeUid) {
    const q = query(collection(db, "users"), where("username", "==", name.trim()));
    const querySnap = await getDocs(q);
    if (excludeUid) {
      return !querySnap.empty && querySnap.docs[0].id !== excludeUid;
    }
    return !querySnap.empty;
  }

  // Live check username availability in signup/username change
  useEffect(() => {
    let active = true;
    if (!usernameInput.trim()) return setUsernameAvailability("");
    isUsernameTaken(usernameInput, user?.uid).then(isTaken => {
      if (active) setUsernameAvailability(isTaken ? "taken" : "available");
    });
    return () => { active = false; };
  }, [usernameInput, user]);

  // Load initial user data
  async function loadUserData(uid) {
    try {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.profilePhotoURL) setProfilePhotoURL(data.profilePhotoURL);
        setUsername(data.username || "");
        setUsernameInput(data.username || "");
        setUserId(data.userId || uid);
      }
    } catch (err) {
      console.error("Error loading user data", err);
    }
  }

  // ----------- Signup (unique username) -----------
  async function handleSignup() {
    setError("");
    if (!usernameInput.trim()) {
      setError("Username is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    if (await isUsernameTaken(usernameInput)) {
      setError("Username already taken, try another.");
      return;
    }
    const pseudoEmail = `${usernameInput.trim().toLowerCase()}@buddychat.fake`;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, pseudoEmail, password);
      const currentUser = userCredential.user;
      await setDoc(doc(db, "users", currentUser.uid), {
        username: usernameInput.trim(),
        profilePhotoURL: null,
        friends: [],
        blockedUsers: [],
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setUserId(currentUser.uid);
    } catch (err) {
      setError(err.message);
    }
  }

  // ----------- Login (no email, only username+password) -----------
  async function handleLogin() {
    setError("");
    if (!usernameInput.trim()) {
      setError("Username is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    const pseudoEmail = `${usernameInput.trim().toLowerCase()}@buddychat.fake`;
    try {
      await signInWithEmailAndPassword(auth, pseudoEmail, password);
    } catch (err) {
      setError("Invalid username or password.");
    }
  }

  // ----------- Logout -----------
  async function handleLogout() {
    if (user) {
      await setOnlineStatus(user.uid, false);
    }
    await signOut(auth);
  }

  // ----------- Friend Requests System -----------
  async function sendFriendRequest(toUsername) {
    if (!user) return;
    try {
      setError("");
      const q = query(collection(db, "users"), where("username", "==", toUsername.trim()));
      const querySnap = await getDocs(q);
      if (querySnap.empty) {
        setError("User not found");
        return;
      }
      const toUserDoc = querySnap.docs[0];
      const toUserId = toUserDoc.id;
      if (toUserId === user.uid) {
        setError("Cannot add yourself");
        return;
      }
      const fromUserDoc = await getDoc(doc(db, "users", user.uid));
      const fromUserData = fromUserDoc.data() || {};
      if ((fromUserData.friends || []).includes(toUserId)) {
        setError("Already friends");
        return;
      }
      if ((fromUserData.blockedUsers || []).includes(toUserId)) {
        setError("User is blocked");
        return;
      }
      const existingReqQuery = query(
        collection(db, "friendRequests"),
        where("from", "==", user.uid),
        where("to", "==", toUserId),
        where("status", "==", "pending")
      );
      const existingReqSnap = await getDocs(existingReqQuery);
      if (!existingReqSnap.empty) {
        setError("Friend request already sent");
        return;
      }
      await addDoc(collection(db, "friendRequests"), {
        from: user.uid,
        to: toUserId,
        fromUsername: username,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("Friend request sent successfully!");
    } catch (err) {
      setError(err.message);
    }
  }

  function subscribeFriendRequests(uid) {
    const q = query(collection(db, "friendRequests"), where("to", "==", uid), where("status", "==", "pending"));
    return onSnapshot(q, (querySnapshot) => {
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      setFriendRequests(requests);
    });
  }

  function subscribeFriends(uid) {
    return onSnapshot(doc(db, "users", uid), (docSnap) => {
      if (docSnap.exists()) {
        setFriends(docSnap.data().friends || []);
      }
    });
  }

  function subscribeBlockedUsers(uid) {
    return onSnapshot(doc(db, "users", uid), (docSnap) => {
      if (docSnap.exists()) {
        setBlockedUsers(docSnap.data().blockedUsers || []);
      }
    });
  }

  async function acceptFriendRequest(requestId, fromUserId) {
    if (!user) return;
    try {
      const reqRef = doc(db, "friendRequests", requestId);
      await updateDoc(reqRef, { status: "accepted" });
      const userRef = doc(db, "users", user.uid);
      const fromUserRef = doc(db, "users", fromUserId);
      await updateDoc(userRef, { friends: arrayUnion(fromUserId) });
      await updateDoc(fromUserRef, { friends: arrayUnion(user.uid) });
      setCurrentChatFriend({ uid: fromUserId });
      if (isMobile) setShowSidebar(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function rejectFriendRequest(requestId) {
    try {
      await deleteDoc(doc(db, "friendRequests", requestId));
    } catch (err) {
      setError(err.message);
    }
  }

  // ----------- Block User by Username -----------
  async function blockUserByUsername() {
    setError("");
    if (!blockUserInput.trim()) {
      setError("Enter a username to block.");
      return;
    }
    if (blockUserInput.trim() === username) {
      setError("You cannot block yourself.");
      return;
    }
    const q = query(collection(db, "users"), where("username", "==", blockUserInput.trim()));
    const querySnap = await getDocs(q);
    if (querySnap.empty) {
      setError("User not found");
      return;
    }
    const toBlockId = querySnap.docs[0].id;
    await blockUser(toBlockId);
    setBlockUserInput("");
  }

  async function blockUser(userIdToBlock) {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        blockedUsers: arrayUnion(userIdToBlock),
        friends: arrayRemove(userIdToBlock),
      });
      await updateDoc(doc(db, "users", userIdToBlock), {
        friends: arrayRemove(user.uid),
      });
      const q = query(
        collection(db, "friendRequests"),
        where("from", "in", [user.uid, userIdToBlock]),
        where("to", "in", [user.uid, userIdToBlock])
      );
      const snaps = await getDocs(q);
      for (const docSnap of snaps.docs) {
        await deleteDoc(doc(db, "friendRequests", docSnap.id));
      }
      if (currentChatFriend && currentChatFriend.uid === userIdToBlock) {
        setCurrentChatFriend(null);
        if (isMobile) setShowSidebar(true);
      }
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }
  async function unblockUser(userIdToUnblock) {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        blockedUsers: arrayRemove(userIdToUnblock),
      });
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  function subscribeMeetingRoomChats(uid) {
    return onSnapshot(doc(db, "users", uid), (docSnap) => {
      if (docSnap.exists()) {
        const allFriends = docSnap.data().friends || [];
        setMeetingRoomChats(allFriends);
      }
    });
  }

  // ----------- Chat/Group Chat Logic -----------
  useEffect(() => {
    if (!user || !currentChatFriend) {
      setMessages([]);
      return;
    }
    if (currentChatFriend.isGroup) {
      // Group chat
      const messagesRef = collection(db, "groups", currentChatFriend.uid, "messages");
      const qMsg = query(messagesRef, orderBy("createdAt", "asc"), limit(100));
      const unsubscribe = onSnapshot(qMsg, (querySnapshot) => {
        const msgs = [];
        querySnapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() });
        });
        setMessages(msgs);
      });
      return () => unsubscribe();
    }
    // DM
    const chatId = generateChatId(user.uid, currentChatFriend.uid);
    if (chatPasswords[chatId]) {
      setRequirePassword(true);
      setChatPasswordPrompt(chatId);
      return;
    }
    setRequirePassword(false);
    const messagesRef = collection(db, "chats", chatId, "messages");
    const qMsg = query(messagesRef, orderBy("createdAt", "asc"), limit(100));
    const unsubscribe = onSnapshot(qMsg, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [user, currentChatFriend, chatPasswords]);

  async function sendMessage() {
    if ((!newMessage.trim() && !newMedia) || !currentChatFriend || !user) return;
    if (currentChatFriend.isGroup) {
      // Group message (No media upload as per prompt)
      const messagesRef = collection(db, "groups", currentChatFriend.uid, "messages");
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        mediaUrl: null,
        mediaType: null,
        from: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
      setNewMedia(null);
      return;
    }
    // DM
    if (newMedia) {
      setError("Photo/video upload is currently disabled.");
      return;
    }
    const chatId = generateChatId(user.uid, currentChatFriend.uid);
    const messagesRef = collection(db, "chats", chatId, "messages");
    await addDoc(messagesRef, {
      text: newMessage.trim(),
      mediaUrl: null,
      mediaType: null,
      from: user.uid,
      to: currentChatFriend.uid,
      createdAt: serverTimestamp(),
    });
    setNewMessage("");
    setNewMedia(null);
  }

  async function deleteMessage(messageId, message, onlySelf = false) {
    if (!currentChatFriend || !user) return;
    try {
      if (currentChatFriend.isGroup) {
        // Group
        const msgRef = doc(db, "groups", currentChatFriend.uid, "messages", messageId);
        if (message.from !== user.uid) return;
        await deleteDoc(msgRef);
        return;
      }
      const chatId = generateChatId(user.uid, currentChatFriend.uid);
      const msgRef = doc(db, "chats", chatId, "messages", messageId);
      if (onlySelf) {
        let deletedIds = JSON.parse(localStorage.getItem("deletedMsgIds") || "[]");
        if (!deletedIds.includes(messageId)) {
          deletedIds.push(messageId);
          localStorage.setItem("deletedMsgIds", JSON.stringify(deletedIds));
        }
        setMessages(msgs => msgs.filter(m => m.id !== messageId));
      } else {
        if (message.from !== user.uid) return;
        await deleteDoc(msgRef);
      }
    } catch (err) {
      setError("Failed to delete message: " + err.message);
    }
  }

  async function cleanChat() {
    if (!user || !currentChatFriend) return;
    if (currentChatFriend.isGroup) {
      const msgsRef = collection(db, "groups", currentChatFriend.uid, "messages");
      const msgsSnap = await getDocs(msgsRef);
      const batch = writeBatch(db);
      msgsSnap.forEach(docu => {
        batch.delete(docu.ref);
      });
      await batch.commit();
      return;
    }
    const chatId = generateChatId(user.uid, currentChatFriend.uid);
    const msgsRef = collection(db, "chats", chatId, "messages");
    const msgsSnap = await getDocs(msgsRef);
    const batch = writeBatch(db);
    msgsSnap.forEach(docu => {
      batch.delete(docu.ref);
    });
    await batch.commit();
  }

  function generateChatId(uid1, uid2) {
    return uid1 < uid2 ? uid1 + "_" + uid2 : uid2 + "_" + uid1;
  }

  // ----------- Typing Indicators (DMs only) -----------
  const typingTimeoutRef = useRef(null);

  async function handleTyping(e) {
    setNewMessage(e.target.value);
    if (!user || !currentChatFriend || currentChatFriend.isGroup) return;
    const chatId = generateChatId(user.uid, currentChatFriend.uid);
    const typingRef = doc(db, "chats", chatId);
    try {
      await updateDoc(typingRef, {
        [`typing.${user.uid}`]: true,
      });
    } catch (err) {
      await setDoc(typingRef, {
        typing: { [user.uid]: true }
      }, { merge: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      try {
        await updateDoc(typingRef, {
          [`typing.${user.uid}`]: false,
        });
      } catch (err) { }
    }, 3000);
  }

  useEffect(() => {
    if (!user || !currentChatFriend || currentChatFriend.isGroup) {
      setTypingStatus({});
      return;
    }
    const chatId = generateChatId(user.uid, currentChatFriend.uid);
    const typingDocRef = doc(db, "chats", chatId);
    const unsubscribe = onSnapshot(typingDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setTypingStatus(docSnap.data().typing || {});
      } else {
        setTypingStatus({});
      }
    });
    return () => unsubscribe();
  }, [user, currentChatFriend]);

  // ----------- Online Status -----------
  async function setOnlineStatus(uid, isOnline) {
    try {
      const userStatusRef = doc(db, "status", uid);
      await setDoc(userStatusRef, {
        state: isOnline ? "online" : "offline",
        lastChanged: serverTimestamp(),
      });
    } catch (err) {}
  }

  useEffect(() => {
    if (!user) return;
    const handleBeforeUnload = () => { setOnlineStatus(user.uid, false); };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setOnlineStatus(user.uid, false);
    };
  }, [user]);

  function subscribeOnlineStatus(uid) {
    const statusRef = collection(db, "status");
    return onSnapshot(statusRef, (querySnapshot) => {
      const online = [];
      querySnapshot.forEach((doc) => {
        if (doc.data().state === "online") {
          online.push(doc.id);
        }
      });
      setOnlineUsers(online);
    });
  }

  // ----------- Password Change -----------
  async function changePassword() {
    if (!user) {
      setError("No user signed in");
      return;
    }
    if (!newPassword) {
      setError("Enter new password");
      return;
    }
    if (!reauthPassword) {
      setError("Enter current password");
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, reauthPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      alert("Password updated successfully!");
      setNewPassword("");
      setReauthPassword("");
      setShowPasswordChange(false);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  // ----------- Change Username with uniqueness -----------
  async function handleChangeUsername(newUsername) {
    if (!user) return;
    if (!newUsername.trim()) return;
    if (await isUsernameTaken(newUsername, user.uid)) {
      setError("Username already taken, try another.");
      return;
    }
    try {
      await updateDoc(doc(db, "users", user.uid), { username: newUsername });
      setUsername(newUsername);
      setUsernameInput(newUsername);
      setUsernameEdit(false);
      alert("Username updated successfully!");
    } catch (err) {
      setError("Failed to change username: " + err.message);
    }
  }

  // ----------- THEME switch -----------
  function handleThemeSwitch() {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.setAttribute("data-theme", newTheme);
  }

  // ----------- PER-CHAT PASSWORD -----------
  function openPasswordModal() {
    setShowChatPasswordModal(true);
    setChatPasswordInput("");
    setChatUnlockError("");
  }
  function closePasswordModal() {
    setShowChatPasswordModal(false);
    setChatPasswordInput("");
    setChatUnlockError("");
  }
  function handleSetChatPassword() {
    if (!currentChatFriend) return;
    const chatId = generateChatId(user.uid, currentChatFriend.uid);
    if (chatPasswordInput.trim() === "") return;
    const updated = { ...chatPasswords, [chatId]: chatPasswordInput };
    setChatPasswords(updated);
    localStorage.setItem("chatPasswords", JSON.stringify(updated));
    closePasswordModal();
  }
  function handleRemoveChatPassword() {
    if (!currentChatFriend) return;
    const chatId = generateChatId(user.uid, currentChatFriend.uid);
    const updated = { ...chatPasswords };
    delete updated[chatId];
    setChatPasswords(updated);
    localStorage.setItem("chatPasswords", JSON.stringify(updated));
    closePasswordModal();
  }
  function handleUnlockChat() {
    const chatId = chatPasswordPrompt;
    if (chatPasswordInput === chatPasswords[chatId]) {
      setRequirePassword(false);
      setChatPasswordPrompt("");
      setChatPasswordInput("");
      setChatUnlockError("");
    } else {
      setChatUnlockError("Incorrect password for this chat.");
    }
  }

  // ----------- CHAT WALLPAPER SETTING -----------
  function handleChatWallpaperChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      setChatWallpaper(ev.target.result);
      localStorage.setItem("chatWallpaper", ev.target.result);
    };
    reader.readAsDataURL(file);
  }
  function removeChatWallpaper() {
    setChatWallpaper("");
    localStorage.removeItem("chatWallpaper");
  }

  // ----------- LOADER SCREEN (Replaces Splash Video) -----------
  if (!user && showLoader) {
    return <LoaderScreen onEnd={() => setShowLoader(false)} />;
  }
  if (loading) return null;

  // ----------- MOBILE HEADER (login page) -----------
  if (!user && isMobile) {
    return (
      <div style={{
        minHeight: "100vh",
        background: theme === "dark" ? "#181818" : "#f0f2f5",
        display: "flex", flexDirection: "column", alignItems: "center"
      }}>
        <div style={{
          width: "100vw", height: 60, background: "#219653", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: "bold", fontSize: 24, letterSpacing: "1px"
        }}>
          <img src="/images/logo.jpeg" alt="icon" style={{
            width: 40, height: 40, borderRadius: "50%", marginRight: 12
          }} />
          Buddy Chat
        </div>
        <div style={{
          marginTop: 100,
          backgroundColor: theme === "dark" ? "#23272f" : 'white',
          padding: '24px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.08)',
          width: '90vw', maxWidth: 380
        }}>
          <input
            type="text"
            placeholder="Username"
            value={usernameInput}
            autoComplete="username"
            onChange={(e) => setUsernameInput(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '5px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px',
              background: theme === "dark" ? "#353535" : undefined,
              color: theme === "dark" ? "#fff" : undefined
            }}
          />
          {usernameAvailability === "taken" && (
            <div style={{ color: "#e74c3c", fontSize: 13, marginBottom: 8 }}>
              Username already exists!
            </div>
          )}
          {usernameAvailability === "available" && usernameInput.trim() && (
            <div style={{ color: "#219653", fontSize: 13, marginBottom: 8 }}>
              Username available!
            </div>
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px',
              background: theme === "dark" ? "#353535" : undefined,
              color: theme === "dark" ? "#fff" : undefined
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleLogin}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#219653',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
            <button
              onClick={handleSignup}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Signup
            </button>
          </div>
          {error && <p style={{ color: "#ff5858", textAlign: 'center', marginTop: '15px' }}>{error}</p>}
        </div>
      </div>
    );
  }

  // ----------- DESKTOP LOGIN FORM -----------
  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: theme === "dark" ? "#181818" : "#f0f2f5"
      }}>
        <div style={{
          width: "100vw", height: 60, background: "#219653", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: "bold", fontSize: 24, letterSpacing: "1px",
          position: "fixed", top: 0, left: 0, zIndex: 1000
        }}>
          <img src="/images/logo.jpeg" alt="icon" style={{
            width: 40, height: 40, borderRadius: "50%", marginRight: 12
          }} />
          Buddy Chat
        </div>
        <div style={{
          marginTop: 100,
          backgroundColor: theme === "dark" ? "#23272f" : 'white',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '400px'
        }}>
          <input
            type="text"
            placeholder="Username"
            value={usernameInput}
            autoComplete="username"
            onChange={(e) => setUsernameInput(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '5px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px',
              background: theme === "dark" ? "#353535" : undefined,
              color: theme === "dark" ? "#fff" : undefined
            }}
          />
          {usernameAvailability === "taken" && (
            <div style={{ color: "#e74c3c", fontSize: 13, marginBottom: 8 }}>
              Username already exists!
            </div>
          )}
          {usernameAvailability === "available" && usernameInput.trim() && (
            <div style={{ color: "#219653", fontSize: 13, marginBottom: 8 }}>
              Username available!
            </div>
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px',
              background: theme === "dark" ? "#353535" : undefined,
              color: theme === "dark" ? "#fff" : undefined
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleLogin}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#219653',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
            <button
              onClick={handleSignup}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Signup
            </button>
          </div>
          {error && <p style={{ color: "#ff5858", textAlign: 'center', marginTop: '15px' }}>{error}</p>}
        </div>
      </div>
    );
  }

  // ----------- MAIN APP -----------
  return (
    <ThemeContext.Provider value={{ theme, handleThemeSwitch }}>
      <div className="main-app" style={{
        display: "flex",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
        background: theme === "dark" ? "#23272f" : "#fff",
        flexDirection: "column"
      }}>
        <MobileHeader
          isMobile={isMobile}
          profilePhotoURL={profilePhotoURL}
          onSettings={() => setShowSettings(true)}
          onAbout={() => setShowAboutUs(true)}
        />

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Sidebar (hidden on chat in mobile) */}
          {!currentChatFriend && (
            <div
              style={{
                width: isMobile ? "100vw" : 320,
                background: theme === "dark" ? "#181c21" : "#f8f9fa",
                borderRight: isMobile ? "none" : "1px solid #ddd",
                paddingTop: isMobile ? 0 : 60,
                overflowY: "auto",
                zIndex: 1100,
                minHeight: "100vh"
              }}>
              {/* Meeting Room: Friends and Groups */}
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                  <img
                    src={profilePhotoURL || "/images/logo.jpeg"}
                    alt="Profile"
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: "50%", objectFit: "cover",
                      border: "3px solid #219653"
                    }}
                  />
                  <div style={{ marginLeft: 10 }}>
                    <div style={{ fontWeight: 900, color: "#219653", fontSize: 18 }}>
                      {usernameEdit ? (
                        <>
                          <input
                            value={usernameInput}
                            onChange={e => setUsernameInput(e.target.value)}
                            style={{ fontSize: 16, borderRadius: 4, border: "1px solid #bbb" }}
                          />
                          <button onClick={() => handleChangeUsername(usernameInput)} style={{ fontSize: 11, marginLeft: 2 }}>✔</button>
                          <button onClick={() => { setUsernameEdit(false); setUsernameInput(username); }} style={{ fontSize: 11, marginLeft: 2 }}>✖</button>
                        </>
                      ) : (
                        <>
                          {username}
                          <button onClick={() => setUsernameEdit(true)} style={{ fontSize: 11, marginLeft: 5 }}>✎</button>
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#666" }}>ID: <strong>{userId}</strong></div>
                  </div>
                </div>
                <div style={{ marginBottom: 15, marginTop: 12 }}>
                  <button onClick={() => setShowSettings(true)} style={{ marginRight: 8, background: "#219653", color: "#fff", border: "none", borderRadius: 5, padding: "5px 13px", fontSize: 13 }}>⚙️</button>
                  <button onClick={() => setShowAboutUs(true)} style={{ background: "#0d6efd", color: "#fff", border: "none", borderRadius: 5, padding: "5px 13px", fontSize: 13 }}>ℹ️</button>
                </div>
                <AddFriend sendFriendRequest={sendFriendRequest} />
                <button onClick={openGroupModal} style={{
                  width: "100%",
                  background: "#219653", color: "#fff",
                  border: "none", borderRadius: 5, padding: "8px", fontSize: 15, marginBottom: 8
                }}>+ Create Group</button>
                <h4 style={{ margin: "13px 0 6px 0" }}>Groups</h4>
                {groups.length === 0 ? (
                  <p style={{ margin: 0, color: '#666' }}>No groups yet</p>
                ) : (
                  groups.map((group) => (
                    <MeetingRoomGroupItem
                      key={group.id}
                      group={group}
                      currentUser={user}
                      openChat={fid => {
                        setCurrentChatFriend({ uid: group.id, isGroup: true });
                        if (isMobile) setShowSidebar(false);
                      }}
                      isCurrentChat={currentChatFriend?.uid === group.id}
                      theme={theme}
                    />
                  ))
                )}
                <h4 style={{ margin: "13px 0 6px 0" }}>Friends</h4>
                {meetingRoomChats.length === 0 ? (
                  <p style={{ margin: 0, color: '#666' }}>No friends yet</p>
                ) : (
                  meetingRoomChats.map((friendId) => (
                    <MeetingRoomFriendItem
                      key={friendId}
                      friendId={friendId}
                      currentUser={user}
                      openChat={fid => {
                        setCurrentChatFriend(fid);
                        if (isMobile) setShowSidebar(false);
                      }}
                      onlineUsers={onlineUsers}
                      isCurrentChat={currentChatFriend?.uid === friendId}
                      theme={theme}
                    />
                  ))
                )}
                {friendRequests.length > 0 && (
                  <>
                    <h4>Friend Requests</h4>
                    {friendRequests.map(req => (
                      <div key={req.id} style={{ background: "#fff", borderRadius: 7, padding: 8, marginBottom: 6 }}>
                        <b>{req.fromUsername || req.from}</b>
                        <button onClick={() => acceptFriendRequest(req.id, req.from)} style={{ marginLeft: 9, background: "#219653", color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 12 }}>Accept</button>
                        <button onClick={() => rejectFriendRequest(req.id)} style={{ marginLeft: 5, background: "#dc3545", color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 12 }}>Reject</button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Main Chat Area */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: theme === "dark" ? "#23272f" : undefined
          }}>
            {currentChatFriend ? (
              <>
                {/* Chat Header */}
                <div style={{
                  padding: 13,
                  borderBottom: "1px solid #ddd",
                  backgroundColor: theme === "dark" ? "#181c21" : "#fff",
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  display: "flex", alignItems: "center", position: "relative"
                }}>
                  <ChatFriendHeader
                    friendId={currentChatFriend.uid}
                    isGroup={currentChatFriend.isGroup}
                    onlineUsers={onlineUsers}
                    showBackButton={isMobile}
                    onBack={() => setCurrentChatFriend(null)}
                    theme={theme}
                  />
                  <div style={{ marginLeft: "auto", position: "relative", display: isMobile ? "none" : "block" }}>
                    {!currentChatFriend.isGroup && (
                      <>
                        <WallpaperMenu
                          chatWallpaper={chatWallpaper}
                          handleChatWallpaperChange={handleChatWallpaperChange}
                          removeChatWallpaper={removeChatWallpaper}
                          cleanChat={cleanChat}
                        />
                        <button
                          onClick={openPasswordModal}
                          style={{ marginLeft: 8, background: "#eee", color: "#219653", border: "none", borderRadius: 6, padding: "5px 11px", fontSize: 13, cursor: "pointer" }}
                        >🔑</button>
                      </>
                    )}
                  </div>
                </div>
                {/* Chat Messages */}
                <div style={{
                  flex: 1,
                  padding: 15,
                  overflowY: "auto",
                  backgroundColor: theme === "dark" ? "#181c21" : "#f8f9fa",
                  backgroundImage: chatWallpaper
                    ? !currentChatFriend.isGroup ? `url(${chatWallpaper})` : undefined
                    : theme === "dark"
                      ? undefined
                      : 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                  backgroundSize: chatWallpaper ? 'cover' : '20px 20px',
                  backgroundPosition: chatWallpaper ? 'center center' : '0 0, 0 10px, 10px -10px, -10px 0px',
                  transition: "background-image 0.3s"
                }}>
                  {requirePassword && !currentChatFriend.isGroup ? (
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 50
                    }}>
                      <h3>This chat is password protected.</h3>
                      <input
                        type="password"
                        placeholder="Enter chat password"
                        value={chatPasswordInput}
                        onChange={e => setChatPasswordInput(e.target.value)}
                        style={{
                          padding: 8,
                          fontSize: 16,
                          border: "1px solid #ccc",
                          borderRadius: 5,
                          marginTop: 8
                        }}
                      />
                      <button
                        onClick={handleUnlockChat}
                        style={{
                          marginTop: 10,
                          padding: "8px 15px",
                          background: "#219653",
                          color: "#fff",
                          border: "none",
                          borderRadius: 5,
                          fontSize: 16,
                          cursor: "pointer"
                        }}
                      >
                        Unlock
                      </button>
                      {chatUnlockError && <div style={{ color: "#e74c3c", marginTop: 8 }}>{chatUnlockError}</div>}
                    </div>
                  ) : (
                    <>
                      {messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages
                          .filter(msg => {
                            let deletedIds = JSON.parse(localStorage.getItem("deletedMsgIds") || "[]");
                            return !deletedIds.includes(msg.id);
                          })
                          .map((msg) => (
                            <MessageItem
                              key={msg.id}
                              message={msg}
                              currentUser={user.uid}
                              onDelete={() =>
                                msg.from === user.uid && new Date() - (msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt)) > 60000
                                  ? deleteMessage(msg.id, msg, true)
                                  : deleteMessage(msg.id, msg, false)
                              }
                              canDelete={msg.from === user.uid}
                              isSelfMsg={msg.from === user.uid}
                            />
                          ))
                      )}
                      {currentChatFriend && !currentChatFriend.isGroup && typingStatus[currentChatFriend.uid] && (
                        <div style={{
                          padding: '10px', backgroundColor: 'rgba(33,150,83,0.12)',
                          borderRadius: '15px', marginBottom: '10px', maxWidth: '200px'
                        }}>
                          <em style={{ color: '#219653' }}>Typing...</em>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {/* Chat Input */}
                {!requirePassword && (
                  <div style={{
                    padding: 15,
                    borderTop: "1px solid #ddd",
                    backgroundColor: theme === "dark" ? "#181c21" : "#fff",
                    boxShadow: '0 -2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type a message..."
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '25px',
                          fontSize: '14px',
                          outline: 'none',
                          background: theme === "dark" ? "#23272f" : undefined,
                          color: theme === "dark" ? "#fff" : undefined
                        }}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        style={{
                          padding: '12px 20px',
                          backgroundColor: newMessage.trim() ? '#219653' : '#ccc',
                          color: 'white',
                          border: 'none',
                          borderRadius: '25px',
                          cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                          fontSize: '14px'
                        }}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: 15, borderBottom: "1px solid #ddd", backgroundColor: theme === "dark" ? "#181c21" : "#fff" }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                  <h3>Meeting Room</h3>
                  <p>Select a chat from the friend/meeting panel to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal
            theme={theme}
            handleThemeSwitch={handleThemeSwitch}
            setShowSettings={setShowSettings}
            setShowPasswordChange={setShowPasswordChange}
            setShowBlockedUsers={setShowBlockedUsers}
            setShowProfileUpload={setShowProfileUpload}
            blockedUsers={blockedUsers}
            handleLogout={handleLogout}
            blockUserByUsername={blockUserByUsername}
            blockUserInput={blockUserInput}
            setBlockUserInput={setBlockUserInput}
            error={error}
            currentChatFriend={currentChatFriend}
            openPasswordModal={openPasswordModal}
          />
        )}

        {/* Change Password */}
        {showPasswordChange && (
          <ChangePasswordModal
            theme={theme}
            reauthPassword={reauthPassword}
            setReauthPassword={setReauthPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            changePassword={changePassword}
            setShowPasswordChange={setShowPasswordChange}
          />
        )}

        {/* Blocked Users */}
        {showBlockedUsers && (
          <BlockedUsersModal
            theme={theme}
            blockedUsers={blockedUsers}
            unblockUser={unblockUser}
            setShowBlockedUsers={setShowBlockedUsers}
          />
        )}

        {/* Set Chat Password Modal */}
        {showChatPasswordModal && (
          <SetChatPasswordModal
            theme={theme}
            chatPasswordInput={chatPasswordInput}
            setChatPasswordInput={setChatPasswordInput}
            handleSetChatPassword={handleSetChatPassword}
            handleRemoveChatPassword={handleRemoveChatPassword}
            closePasswordModal={closePasswordModal}
          />
        )}

        {/* ABOUT US MODAL */}
        {showAboutUs && (
          <AboutUsModal theme={theme} setShowAboutUs={setShowAboutUs} />
        )}

        {/* Group Modal */}
        {showGroupModal && (
          <GroupModal
            theme={theme}
            groupName={groupName}
            setGroupName={setGroupName}
            groupMembers={groupMembers}
            setGroupMembers={setGroupMembers}
            friends={friends}
            createGroup={createGroup}
            closeGroupModal={closeGroupModal}
            user={user}
            username={username}
          />
        )}

        {/* Media queries for responsive */}
        <style>{`
          @media (max-width: 800px) {
            .main-app {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    </ThemeContext.Provider>
  );
}

// ----------- MOBILE HEADER (App) -----------
function MobileHeader({ isMobile, profilePhotoURL, onSettings, onAbout }) {
  const [showDropdown, setShowDropdown] = useState(false);
  if (!isMobile) return null;
  return (
    <div style={{
      width: "100vw", height: 60, background: "#219653", color: "white",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      fontWeight: "bold", fontSize: 24, letterSpacing: "1px",
      position: "fixed", top: 0, left: 0, zIndex: 1200, boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
    }}>
      <img src={profilePhotoURL || "/images/logo.jpeg"} alt="icon"
        style={{
          width: 40, height: 40, borderRadius: "50%", marginLeft: 12, objectFit: "cover"
        }} />
      <span style={{ flex: 1, textAlign: "center", marginLeft: -40 }}>Buddy Chat</span>
      <div style={{ marginRight: 18, position: "relative" }}>
        <button
          style={{
            background: "none", border: "none", color: "white", fontSize: 26, cursor: "pointer"
          }}
          onClick={() => setShowDropdown(s => !s)}
        >☰</button>
        {showDropdown && (
          <div style={{
            position: "absolute", right: 0, top: 40, zIndex: 1300,
            background: "#fff", color: "#23272f", borderRadius: 8, boxShadow: "0 2px 14px rgba(0,0,0,0.18)", minWidth: 140
          }}>
            <button onClick={() => { setShowDropdown(false); onSettings(); }}
              style={{
                width: "100%", padding: 12, background: "none", border: "none",
                color: "#219653", textAlign: "left", fontWeight: 700, cursor: "pointer"
              }}>Settings</button>
            <button onClick={() => { setShowDropdown(false); onAbout(); }}
              style={{
                width: "100%", padding: 12, background: "none", border: "none",
                color: "#0d6efd", textAlign: "left", fontWeight: 700, cursor: "pointer"
              }}>About Us</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------- Settings Modal -----------
function SettingsModal({ theme, handleThemeSwitch, setShowSettings, setShowPasswordChange, setShowBlockedUsers, setShowProfileUpload, blockedUsers, handleLogout, blockUserByUsername, blockUserInput, setBlockUserInput, error, currentChatFriend, openPasswordModal }) {
  return (
    <div style={{
      position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", zIndex: 5001,
      background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center"
    }}
      onClick={() => setShowSettings(false)}
    >
      <div style={{
        background: theme === "dark" ? "#23272f" : "#fff",
        padding: 30, borderRadius: 12, minWidth: 330, boxShadow: "0 2px 18px rgba(0,0,0,0.12)", maxWidth: 370, position: "relative"
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: 15 }}>Settings</h3>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <span style={{ flex: 1 }}>Theme:</span>
          <button
            onClick={handleThemeSwitch}
            style={{
              padding: '6px 15px',
              backgroundColor: theme === "dark" ? "#333" : "#eee",
              color: theme === "dark" ? "#fff" : "#333",
              border: "1px solid #bbb",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            {theme === "dark" ? "Dark" : "Light"}
          </button>
        </div>
        <button
          onClick={() => { setShowProfileUpload(true); setShowSettings(false); }}
          style={{
            width: '100%', padding: '8px', backgroundColor: '#219653',
            color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: 8
          }}
        >
          📷 Profile Photo
        </button>
        <button
          onClick={() => { setShowPasswordChange(true); setShowSettings(false); }}
          style={{
            width: '100%', padding: '8px', backgroundColor: '#6c757d',
            color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: 8
          }}
        >
          🔐 Change Password
        </button>
        <button
          onClick={openPasswordModal}
          disabled={!currentChatFriend}
          style={{
            width: '100%', padding: '8px', backgroundColor: currentChatFriend ? "#219653" : "#ccc",
            color: "#fff", border: "none", borderRadius: "5px",
            cursor: currentChatFriend ? "pointer" : "not-allowed", marginBottom: 8
          }}
        >
          Set/Remove Chat Password
        </button>
        <button
          onClick={() => { setShowBlockedUsers(true); setShowSettings(false); }}
          style={{
            width: '100%', padding: '8px', backgroundColor: '#dc3545',
            color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: 8
          }}
        >
          🚫 Blocked Users ({blockedUsers.length})
        </button>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '8px', backgroundColor: '#219653',
            color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: 8
          }}
        >
          Logout
        </button>
        <h4 style={{ marginTop: "20px" }}>Block User</h4>
        <form onSubmit={e => { e.preventDefault(); blockUserByUsername(); }}>
          <input
            type="text"
            placeholder="Username to block"
            value={blockUserInput}
            onChange={e => setBlockUserInput(e.target.value)}
            style={{
              width: "100%", padding: 8, marginBottom: 6, border: "1px solid #ddd", borderRadius: 4,
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%", padding: 8, backgroundColor: "#dc3545", color: "#fff",
              border: "none", borderRadius: 4, cursor: "pointer"
            }}
          >
            Block User
          </button>
        </form>
        <button
          onClick={() => setShowSettings(false)}
          style={{
            width: '100%', padding: '8px', backgroundColor: '#ccc',
            color: '#23272f', border: 'none', borderRadius: '5px', cursor: 'pointer'
          }}
        >
          Close
        </button>
        {error && (
          <div style={{ color: "#e74c3c", marginTop: 8, textAlign: "center" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------- Change Password Modal -----------
function ChangePasswordModal({ theme, reauthPassword, setReauthPassword, newPassword, setNewPassword, changePassword, setShowPasswordChange }) {
  return (
    <div style={{
      position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", zIndex: 5002,
      background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center"
    }}
      onClick={() => setShowPasswordChange(false)}
    >
      <div style={{
        background: theme === "dark" ? "#23272f" : "#fff",
        padding: 30,
        borderRadius: 10,
        minWidth: 300,
        boxShadow: "0 2px 18px rgba(0,0,0,0.12)"
      }} onClick={e => e.stopPropagation()}>
        <h4 style={{ margin: '0 0 10px 0' }}>Change Password</h4>
        <input
          type="password"
          placeholder="Current Password"
          value={reauthPassword}
          onChange={(e) => setReauthPassword(e.target.value)}
          style={{
            width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px'
          }}
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{
            width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px'
          }}
        />
        <button
          onClick={changePassword}
          style={{
            width: '100%', padding: '8px', backgroundColor: '#219653',
            color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
          }}
        >
          Update Password
        </button>
      </div>
    </div>
  );
}

// ----------- Blocked Users Modal -----------
function BlockedUsersModal({ theme, blockedUsers, unblockUser, setShowBlockedUsers }) {
  return (
    <div style={{
      position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", zIndex: 5002,
      background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center"
    }}
      onClick={() => setShowBlockedUsers(false)}
    >
      <div style={{
        background: theme === "dark" ? "#23272f" : "#fff",
        padding: 30,
        borderRadius: 10,
        minWidth: 300,
        boxShadow: "0 2px 18px rgba(0,0,0,0.12)"
      }} onClick={e => e.stopPropagation()}>
        <h4 style={{ margin: '0 0 10px 0' }}>Blocked Users</h4>
        {blockedUsers.length === 0 ? (
          <p style={{ margin: 0, color: '#666' }}>No blocked users</p>
        ) : (
          blockedUsers.map((blockedId) => (
            <BlockedUserItem
              key={blockedId}
              userId={blockedId}
              onUnblock={() => unblockUser(blockedId)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ----------- Set Chat Password Modal -----------
function SetChatPasswordModal({ theme, chatPasswordInput, setChatPasswordInput, handleSetChatPassword, handleRemoveChatPassword, closePasswordModal }) {
  return (
    <div style={{
      position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", zIndex: 2000,
      background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center"
    }}
      onClick={closePasswordModal}
    >
      <div style={{
        background: theme === "dark" ? "#23272f" : "#fff",
        padding: 30, borderRadius: 10, minWidth: 300, boxShadow: "0 2px 18px rgba(0,0,0,0.12)"
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>Set chat password</h3>
        <input
          type="password"
          placeholder="Enter password for this chat"
          value={chatPasswordInput}
          onChange={e => setChatPasswordInput(e.target.value)}
          style={{
            width: "100%", padding: 8, borderRadius: 5, border: "1px solid #ccc", fontSize: 18, marginBottom: 10
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSetChatPassword}
            disabled={!chatPasswordInput.trim()}
            style={{
              flex: 1, background: "#219653", color: "#fff", border: "none",
              borderRadius: 5, padding: "8px 0", cursor: chatPasswordInput.trim() ? "pointer" : "not-allowed"
            }}
          >Set</button>
          <button
            onClick={handleRemoveChatPassword}
            style={{
              flex: 1, background: "#dc3545", color: "#fff", border: "none", borderRadius: 5, padding: "8px 0"
            }}
          >Remove</button>
          <button
            onClick={closePasswordModal}
            style={{
              flex: 1, background: "#ccc", color: "#23272f", border: "none", borderRadius: 5, padding: "8px 0"
            }}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ----------- About Us Modal -----------
function AboutUsModal({ theme, setShowAboutUs }) {
  return (
    <div style={{
      position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", zIndex: 5000,
      background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center"
    }}
      onClick={() => setShowAboutUs(false)}
    >
      <div style={{
        background: theme === "dark" ? "#23272f" : "#fff",
        padding: 32,
        borderRadius: 14,
        minWidth: 320,
        boxShadow: "0 6px 44px rgba(0,0,0,0.24)",
        textAlign: "center",
        maxWidth: 350
      }} onClick={e => e.stopPropagation()}>
        <img
          src="/images/About.jpg"
          alt="Developer"
          style={{
            width: 90, height: 90, borderRadius: "50%", marginBottom: 15, border: "3px solid #219653", objectFit: "cover"
          }}
          onError={e => { e.target.src = "/images/logo.jpeg"; }}
        />
        <h2 style={{ margin: "0 0 12px 0", color: "#219653" }}>Developer</h2>
        <p style={{ color: theme === "dark" ? "#eee" : "#23272f" }}>
          Hi! I'm <strong>Divyanshu Pandey</strong>, passionate about building privacy-first, modern and user-friendly web apps. <br /><br />
          This chat app was built with ❤️ love.<br /><br />
        </p>
        <button
          onClick={() => setShowAboutUs(false)}
          style={{
            marginTop: 13,
            background: "#219653",
            color: "#fff",
            border: "none",
            padding: "8px 25px",
            borderRadius: 7,
            fontSize: 16,
            cursor: "pointer"
          }}
        >Close</button>
      </div>
    </div>
  );
}

// ----------- Group Modal -----------
function GroupModal({ theme, groupName, setGroupName, groupMembers, setGroupMembers, friends, createGroup, closeGroupModal, user, username }) {
  // Load friend user details for selection
  const [friendUsers, setFriendUsers] = useState([]);
  useEffect(() => {
    async function loadFriends() {
      const arr = [];
      for (const uid of friends) {
        const docSnap = await getDoc(doc(getFirestore(), "users", uid));
        if (docSnap.exists()) {
          arr.push({ uid, username: docSnap.data().username || uid });
        }
      }
      setFriendUsers(arr);
    }
    loadFriends();
  }, [friends]);
  return (
    <div style={{
      position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", zIndex: 5002,
      background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center"
    }}
      onClick={closeGroupModal}
    >
      <div style={{
        background: theme === "dark" ? "#23272f" : "#fff",
        padding: 24, borderRadius: 10, minWidth: 320, maxWidth: 370, boxShadow: "0 2px 18px rgba(0,0,0,0.12)"
      }} onClick={e => e.stopPropagation()}>
        <h3>Create Group</h3>
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          style={{
            width: "100%", padding: 8, borderRadius: 5, border: "1px solid #ccc", fontSize: 16, marginBottom: 10
          }}
        />
        <div style={{ marginBottom: 10 }}>
          <b>Select Friends:</b>
          <div style={{ maxHeight: 120, overflowY: "auto", marginTop: 6 }}>
            {friendUsers.length === 0 ? (
              <div style={{ color: "#666" }}>No friends</div>
            ) : (
              friendUsers.map(f => (
                <label key={f.uid} style={{ display: "block", fontSize: 15 }}>
                  <input
                    type="checkbox"
                    checked={groupMembers.includes(f.uid)}
                    onChange={e => {
                      if (e.target.checked) setGroupMembers(arr => [...arr, f.uid]);
                      else setGroupMembers(arr => arr.filter(uid => uid !== f.uid));
                    }}
                  /> {f.username}
                </label>
              ))
            )}
          </div>
        </div>
        <button
          style={{
            width: "100%", background: "#219653", color: "#fff", border: "none",
            borderRadius: 5, padding: "10px", cursor: "pointer", fontWeight: 700, marginBottom: 7
          }}
          onClick={createGroup}
          disabled={!groupName.trim() || groupMembers.length === 0}
        >Create Group</button>
        <button
          onClick={closeGroupModal}
          style={{
            width: "100%", background: "#ccc", color: "#23272f", border: "none",
            borderRadius: 5, padding: "10px", cursor: "pointer", fontWeight: 700
          }}
        >Cancel</button>
      </div>
    </div>
  );
}

// ----------- Meeting Room Friend Item -----------
function MeetingRoomFriendItem({ friendId, currentUser, openChat, onlineUsers, isCurrentChat, theme }) {
  const [username, setUsername] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  useEffect(() => {
    async function fetchData() {
      try {
        const userDoc = await getDoc(doc(getFirestore(), "users", friendId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || friendId);
          setProfilePhoto(data.profilePhotoURL || null);
        }
      } catch (err) {}
    }
    fetchData();
  }, [friendId]);
  const isOnline = onlineUsers.includes(friendId);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 8,
        padding: 10,
        backgroundColor: isCurrentChat ? '#e3f2fd' : (theme === "dark" ? "#23272f" : "#fff"),
        borderRadius: '8px',
        border: isCurrentChat ? '2px solid #219653' : '1px solid #eee',
        cursor: "pointer",
        opacity: 1,
        position: 'relative'
      }}
      onClick={() => openChat({ uid: friendId })}
    >
      <div style={{ position: 'relative', marginRight: 12 }}>
        <img
          src={profilePhoto || "/images/logo.jpeg"}
          alt={username}
          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
        />
        <div style={{
          position: 'absolute', bottom: -2, right: -2, width: 12, height: 12,
          backgroundColor: isOnline ? '#4caf50' : '#fff', // green for online, white for offline
          borderRadius: '50%', border: '2px solid white', boxShadow: "0 0 0 1px #bbb"
        }}></div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', color: '#333' }}>{username}</div>
      </div>
    </div>
  );
}

// ----------- Meeting Room Group Item -----------
function MeetingRoomGroupItem({ group, openChat, isCurrentChat, theme }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 8,
        padding: 10,
        backgroundColor: isCurrentChat ? '#e3f2fd' : (theme === "dark" ? "#23272f" : "#fff"),
        borderRadius: '8px',
        border: isCurrentChat ? '2px solid #219653' : '1px solid #eee',
        cursor: "pointer",
        opacity: 1,
        position: 'relative'
      }}
      onClick={() => openChat({ uid: group.id, isGroup: true })}
    >
      <div style={{ position: 'relative', marginRight: 12 }}>
        <img
          src="/images/group-icon.png"
          alt={group.groupName}
          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
          onError={e => e.target.src = "/images/logo.jpeg"}
        />
        <div style={{
          position: 'absolute', bottom: -2, right: -2, width: 12, height: 12,
          backgroundColor: "#219653", borderRadius: '50%', border: '2px solid white'
        }}></div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', color: '#333' }}>{group.groupName}</div>
        <div style={{ fontSize: '12px', color: '#888' }}>
          Group
        </div>
      </div>
    </div>
  );
}

// ----------- MESSAGE ITEM COMPONENT -----------
function MessageItem({ message, currentUser, onDelete, canDelete, isSelfMsg }) {
  const [showDeleteOption, setShowDeleteOption] = useState(false);
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  let canDeleteNow = canDelete;
  if (isSelfMsg && message.createdAt) {
    const now = new Date();
    const msgTime = message.createdAt.toDate ? message.createdAt.toDate() : new Date(message.createdAt);
    if (now - msgTime > 60000) canDeleteNow = false;
  }
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: message.from === currentUser ? 'flex-end' : 'flex-start',
        marginBottom: 12,
        position: 'relative'
      }}
      onMouseEnter={() => setShowDeleteOption(true)}
      onMouseLeave={() => setShowDeleteOption(false)}
    >
      <div style={{
        maxWidth: '70%',
        padding: '10px 15px',
        borderRadius: message.from === currentUser ? '18px 18px 5px 18px' : '18px 18px 18px 5px',
        backgroundColor: message.from === currentUser ? '#219653' : '#fff',
        color: message.from === currentUser ? 'white' : '#333',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        <div style={{ wordBreak: 'break-word' }}>{message.text}</div>
        <div style={{
          fontSize: '11px', opacity: 0.8, marginTop: '4px', textAlign: 'right'
        }}>
          {formatTime(message.createdAt)}
        </div>
        {/* Dot: White for sent, green for received */}
        <div style={{
          position: "absolute", bottom: 2, right: -10, width: 10, height: 10,
          borderRadius: "50%", background: message.from === currentUser ? "#fff" : "#4caf50",
          border: "1px solid #bbb"
        }}></div>
        {showDeleteOption && canDelete && (
          <button
            onClick={onDelete}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Delete message"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ----------- ADD FRIEND COMPONENT -----------
function AddFriend({ sendFriendRequest }) {
  const [friendUsername, setFriendUsername] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (friendUsername.trim()) {
      sendFriendRequest(friendUsername.trim());
      setFriendUsername("");
    }
  };
  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex', gap: '8px', marginTop: 6, marginBottom: 10
    }}>
      <input
        type="text"
        placeholder="Add friend by username"
        value={friendUsername}
        onChange={(e) => setFriendUsername(e.target.value)}
        style={{
          flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px'
        }}
      />
      <button
        type="submit"
        disabled={!friendUsername.trim()}
        style={{
          padding: '8px 15px', backgroundColor: friendUsername.trim() ? '#219653' : '#ccc',
          color: 'white', border: 'none', borderRadius: '4px', cursor: friendUsername.trim() ? 'pointer' : 'not-allowed'
        }}
      >
        Add
      </button>
    </form>
  );
}

// ----------- CHAT FRIEND HEADER COMPONENT -----------
function ChatFriendHeader({ friendId, isGroup, onlineUsers, showBackButton, onBack, theme }) {
  const [username, setUsername] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  useEffect(() => {
    async function fetchData() {
      if (isGroup) {
        const docSnap = await getDoc(doc(getFirestore(), "groups", friendId));
        if (docSnap.exists()) {
          setUsername(docSnap.data().groupName || friendId);
          setProfilePhoto("/images/group-icon.png");
        }
      } else {
        const userDoc = await getDoc(doc(getFirestore(), "users", friendId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || friendId);
          setProfilePhoto(data.profilePhotoURL || null);
        }
      }
    }
    fetchData();
  }, [friendId, isGroup]);
  const isOnline = !isGroup && onlineUsers.includes(friendId);
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {showBackButton && (
        <button
          onClick={onBack}
          style={{
            marginRight: 15, fontSize: 22, background: "transparent", border: "none",
            color: "#219653", cursor: "pointer", fontWeight: "bold"
          }}
          aria-label="Back"
        >←</button>
      )}
      <div style={{ position: 'relative', marginRight: 12 }}>
        <img
          src={profilePhoto || "/images/logo.jpeg"}
          alt={username}
          style={{ width: 45, height: 45, borderRadius: "50%", objectFit: "cover" }}
        />
        {!isGroup && (
          <div style={{
            position: 'absolute', bottom: 2, right: 2, width: 12, height: 12,
            backgroundColor: isOnline ? '#4caf50' : '#fff', borderRadius: '50%', border: '2px solid white'
          }}></div>
        )}
      </div>
      <div>
        <h3 style={{ margin: 0, color: '#333' }}>{username}</h3>
        {!isGroup && (
          <p style={{ margin: 0, fontSize: '14px', color: isOnline ? '#4caf50' : '#999' }}>
            {isOnline ? 'Online' : 'Offline'}
          </p>
        )}
      </div>
    </div>
  );
}

// ----------- BLOCKED USER COMPONENT -----------
function BlockedUserItem({ userId, onUnblock }) {
  const [username, setUsername] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  useEffect(() => {
    async function fetchData() {
      try {
        const userDoc = await getDoc(doc(getFirestore(), "users", userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || userId);
          setProfilePhoto(data.profilePhotoURL || null);
        }
      } catch (err) { }
    }
    fetchData();
  }, [userId]);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '8px',
      backgroundColor: '#ffebee', borderRadius: '5px', marginBottom: '8px'
    }}>
      <img
        src={profilePhoto || "/images/About.jpg"}
        alt={username}
        style={{ width: 30, height: 30, borderRadius: "50%", marginRight: 10, objectFit: "cover" }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{username}</div>
      </div>
      <button
        onClick={onUnblock}
        style={{
          padding: '4px 8px', backgroundColor: '#4caf50', color: 'white',
          border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
        }}
      >
        Unblock
      </button>
    </div>
  );
}

// ----------- WALLPAPER MENU COMPONENT (3-dots) -----------
function WallpaperMenu({ chatWallpaper, handleChatWallpaperChange, removeChatWallpaper, cleanChat }) {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowMenu(m => !m)}
        style={{
          background: "transparent", border: "none", fontSize: 22, color: "#219653",
          padding: "2px 8px", cursor: "pointer",
        }}
        aria-label="Chat menu"
      >⋮</button>
      {showMenu && (
        <div
          style={{
            position: "absolute", right: 0, top: "110%",
            background: "#fff", border: "1px solid #ddd", borderRadius: 8,
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)", zIndex: 1001, minWidth: 180, padding: 12
          }}
          onMouseLeave={() => setShowMenu(false)}
        >
          <label style={{ display: "block", marginBottom: 6, cursor: "pointer", color: "#219653" }}>
            Set Chat Wallpaper
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={e => {
                handleChatWallpaperChange(e);
                setShowMenu(false);
              }}
            />
          </label>
          {chatWallpaper && (
            <button
              onClick={() => {
                removeChatWallpaper();
                setShowMenu(false);
              }}
              style={{
                background: "none", border: "none", color: "#dc3545", cursor: "pointer", display: "block", marginTop: 5
              }}
            >Remove Wallpaper</button>
          )}
          {cleanChat && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to clean this chat? This will delete all messages.")) {
                  cleanChat();
                  setShowMenu(false);
                }
              }}
              style={{
                background: "none", border: "none", color: "#dc3545", cursor: "pointer", display: "block", marginTop: 5
              }}
            >🧹 Clean Chat</button>
          )}
        </div>
      )}
    </div>
  );
}
