// src/components/auth/AuthPage.tsx

"use client";

import React, { Suspense } from "react";

import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import ForgotPasswordPage from "./ForgotPasswordPage";

type AuthPageProps = {
  type: "login" | "register" | "resetPassword";
};

export const AuthPage: React.FC<AuthPageProps> = ({ type }) => {
  switch (type) {
    case "register":
      return (
        <Suspense fallback={null}>
          <RegisterPage />;
        </Suspense>
      )
    case "resetPassword":
      return (
        <Suspense fallback={null}>
            <ForgotPasswordPage />;
        </Suspense>
      )
    default:
      return (
        <Suspense fallback={null}>
          <LoginPage />
        </Suspense>
      );
  }
};

export default AuthPage;
