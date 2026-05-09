"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/services/api";

export interface StudentProfile {
  _id: string;
  name: string;
  studentNumber: string;
  email: string;
  phone: string;
  relativePhone?: string;
  role: "Student";
}

interface StudentContextValue {
  student: StudentProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, student: StudentProfile) => void;
  logout: () => void;
}

const StudentContext = createContext<StudentContextValue>({
  student: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
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

  const login = (newToken: string, profile: StudentProfile) => {
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

  return (
    <StudentContext.Provider value={{ student, token, isLoading, login, logout }}>
      {children}
    </StudentContext.Provider>
  );
}

export const useStudent = () => useContext(StudentContext);
