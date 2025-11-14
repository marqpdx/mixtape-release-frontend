// src/components/auth/AuthPage.tsx

"use client";

import React from "react";

import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import ForgotPasswordPage from "./ForgotPasswordPage";

type AuthPageProps = {
  type: "login" | "register" | "resetPassword";
};

export const AuthPage: React.FC<AuthPageProps> = ({ type }) => {
  switch (type) {
    case "register":
      return <RegisterPage />;
    case "resetPassword":
      return <ForgotPasswordPage />;
    default:
      return <LoginPage />;
  }
};

export default AuthPage;
