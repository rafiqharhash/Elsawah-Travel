"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStudent } from "@/contexts/StudentContext";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export default function HomePage() {
  const router = useRouter();
  const {
    student,
    isLoading
  } = useStudent();
  useEffect(() => {
    if (isLoading) return;
    if (student) {
      router.replace("/student");
    } else {
      router.replace("/student/login");
    }
  }, [student, isLoading, router]);
  return /*#__PURE__*/_jsxDEV("div", {
    className: "min-h-screen flex items-center justify-center bg-background",
    children: /*#__PURE__*/_jsxDEV("div", {
      className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
    }, void 0, false)
  }, void 0, false);
}