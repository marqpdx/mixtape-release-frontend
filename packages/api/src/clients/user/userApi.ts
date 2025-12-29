// src/lib/user/userApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { UserIdentity } from "@mixtape/core/types/auth";

/**
 * Fetch all users in the system
 */
export const fetchUsers = async (): Promise<UserIdentity[]> => {
  const response = await axiosInstance.get<UserIdentity[]>("/api/users/");
  return response.data;
};

/**
 * Fetch a single user by username
 */
export const fetchUser = async (username: string): Promise<UserIdentity> => {
  const response = await axiosInstance.get<UserIdentity>(`/api/users/${username}/`);
  return response.data;
};
