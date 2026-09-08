"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/services/api";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
const StudentContext = /*#__PURE__*/createContext({
  student: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {}
});
export function StudentProvider({
  children
}) {
  const [student, setStudent] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("student_token");
      const savedProfile = localStorage.getItem("student_profile");
      if (saved && savedProfile) {
        setToken(saved);
        setStudent(JSON.parse(savedProfile));
        // Attach token to all API requests
        api.defaults.headers.common["Authorization"] = `Bearer ${saved}`;
      }
    } catch {
      // ignore parse errors
    } finally {
      setIsLoading(false);
    }
  }, []);
  const login = (newToken, profile) => {
    setToken(newToken);
    setStudent(profile);
    localStorage.setItem("student_token", newToken);
    localStorage.setItem("student_profile", JSON.stringify(profile));
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  };
  const logout = () => {
    setToken(null);
    setStudent(null);
    localStorage.removeItem("student_token");
    localStorage.removeItem("student_profile");
    delete api.defaults.headers.common["Authorization"];
  };
  return /*#__PURE__*/_jsxDEV(StudentContext.Provider, {
    value: {
      student,
      token,
      isLoading,
      login,
      logout
    },
    children: children
  }, void 0, false);
}
export const useStudent = () => useContext(StudentContext);