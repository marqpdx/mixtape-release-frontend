// /app/(auth)/login/page.tsx

"use client";

import AuthPage from "@components/auth/AuthPage";

export default function Login() {
  return <AuthPage type="login" />;
}

Login.layout = "auth";
