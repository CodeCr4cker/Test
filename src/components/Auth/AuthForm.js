import React, { useState } from "react";
import { register, login } from "../../firebase/auth";
import { createUserProfile } from "../../firebase/db";

export default function AuthForm({ onAuth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        const user = await register(email, password, username);
        await createUserProfile(user.uid, {
          email,
          username,
          userId: user.uid,
          profilePhotoUrl: "",
          friends: [],
          blocked: [],
        });
        onAuth(user);
      } else {
        const userCred = await login(email, password);
        onAuth(userCred.user);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isRegister ? "Register" : "Login"}</h2>
      {isRegister && (
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">{isRegister ? "Sign Up" : "Login"}</button>
      <div>
        <button type="button" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Have an account? Login" : "No account? Register"}
        </button>
      </div>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
}