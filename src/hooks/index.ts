import { useState, useEffect, useCallback } from "react";

export default function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser =
      sessionStorage.getItem("user") || localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        console.error("Failed to parse stored user data");
      }
    }
  }, []);

  const saveUser = useCallback((userData: any, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return { user, saveUser, logout };
}