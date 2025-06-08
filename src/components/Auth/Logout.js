import { logout } from "../../firebase/auth";

export default function Logout({ onLogout }) {
  const handleLogout = async () => {
    await logout();
    onLogout();
  };
  return <button onClick={handleLogout}>Logout</button>;
}