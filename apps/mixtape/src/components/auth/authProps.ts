// src/components/auth/authProps.ts
// Simplified auth props without Refine dependencies

import { BoxProps } from "@chakra-ui/react";
import { SystemStyleObject } from "@chakra-ui/react";

/* ---------- Shared Wrapper & Content Props ---------- */
export type WrapperProps = BoxProps & {
  customStyles?: SystemStyleObject;
};

export type ContentProps = BoxProps & {
  customStyles?: SystemStyleObject;
};

/* ---------- Form Props ---------- */
export interface FormPropsType<TFormType> {
  onSubmit?: (values: TFormType) => void;
}

/* ---------- Login ---------- */
export interface LoginFormTypes {
  identifier: string;
  password: string;
  remember?: boolean;
}

export type LoginProps = {
  wrapperProps?: WrapperProps;
  contentProps?: ContentProps;
  formProps?: FormPropsType<LoginFormTypes>;
};

/* ---------- Register ---------- */
export interface RegisterFormTypes {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export type RegisterProps = {
  wrapperProps?: WrapperProps;
  contentProps?: ContentProps;
  formProps?: FormPropsType<RegisterFormTypes>;
};

/* ---------- Forgot Password ---------- */
export interface ForgotPasswordFormTypes {
  email: string;
}

export type ForgotPasswordProps = {
  wrapperProps?: WrapperProps;
  contentProps?: ContentProps;
  formProps?: FormPropsType<ForgotPasswordFormTypes>;
};

/* ---------- General Auth Props ---------- */
export type AuthProps = {
  type: "login" | "register" | "resetPassword";
};
