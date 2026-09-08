"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export default function AdminRoot() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);
  return /*#__PURE__*/_jsxDEV("div", {
    className: "min-h-screen flex items-center justify-center bg-background",
    children: /*#__PURE__*/_jsxDEV("div", {
      className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
    }, void 0, false)
  }, void 0, false);
}