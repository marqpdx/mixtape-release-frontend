// src/components/auth/AuthPage.tsx

"use client";

import React, { Suspense } from "react";

import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import UpdatePasswordPage from "./UpdatePasswordPage";

type AuthPageProps = {
  type: "login" | "register" | "resetPassword" | "forgotPassword" | "updatePassword";
};

export const AuthPage: React.FC<AuthPageProps> = ({ type }) => {
  switch (type) {
    case "register":
      return (
        <Suspense fallback={null}>
          <RegisterPage />
        </Suspense>
      );
    case "resetPassword":
    case "forgotPassword":
      return (
        <Suspense fallback={null}>
          <ForgotPasswordPage />
        </Suspense>
      );
    case "updatePassword":
      return (
        <Suspense fallback={null}>
          <UpdatePasswordPage />
        </Suspense>
      );
    default:
      return (
        <Suspense fallback={null}>
          <LoginPage />
        </Suspense>
      );
  }
};

export default AuthPage;
