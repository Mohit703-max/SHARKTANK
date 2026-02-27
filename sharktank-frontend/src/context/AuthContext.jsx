import { createContext, useState } from "react";
import { loginUser, registerUser, logout } from "../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    setUser(res);
    return res;
  };

  const register = async (data) => {
    const res = await registerUser(data);
    setUser(res);
    return res;
  };

  const logoutUser = () => {
    logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};