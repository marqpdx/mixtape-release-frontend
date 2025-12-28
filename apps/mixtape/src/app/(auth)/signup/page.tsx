// /app/(auth)/register/page.tsx

"use client";

import AuthPage from "@components/auth/AuthPage";

export default function Register() {
  return <AuthPage type="register" />;
}

Register.layout = "auth";
