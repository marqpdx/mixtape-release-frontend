// src/components/invitations/AcceptInviteForm.tsx

"use client";

import {
  Box,
  Button,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toaster } from "@/components/ui/toaster";
import axios from "axios";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import { Filter } from "bad-words";

const filter = new Filter();

const isValidUsername = (username: string) =>
  /^[a-zA-Z0-9_]{3,20}$/.test(username);

const containsProfanity = (username: string) => filter.isProfane(username);

const checkUsernameAvailable = async (username: string) => {
  try {
    const res = await axiosInstance.get(`/api/auth/check-username/${username}`);
    return res.data.available;
  } catch (err) {
    return false;
  }
};

interface AcceptInviteFormProps {
  shortcode: string;
  isNewUser: boolean; // true for /new route, false for existing users
}

export function AcceptInviteForm({ shortcode, isNewUser }: AcceptInviteFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const NEXT_PUBLIC_ROOT_API_URL = process.env.NEXT_PUBLIC_ROOT_API_URL ?? "";
  const acceptInviteUrl = `${NEXT_PUBLIC_ROOT_API_URL}/api/auth/accept-invite`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: any) => {
    setSubmitting(true);

    try {
      if (!shortcode) throw new Error("Missing invite shortcode");

      // Build payload based on user type
      const payload: any = {
        shortcode,
      };

      if (isNewUser) {
        // New users need username and password
        payload.username = data.username;
        payload.password = data.password;
      }
      // Existing users just need the shortcode (and their auth token in headers)

      console.log("Submitting invite acceptance:", payload);

      const res = isNewUser
        ? await axios.post(acceptInviteUrl, payload)
        : await axiosInstance.post(acceptInviteUrl, payload);

      // const res = await axios.post(acceptInviteUrl, payload);

      console.log("Accept Invite Response:", res.data);

      toaster.success({
        title: isNewUser ? "Welcome!" : "Success!",
        description: isNewUser
          ? "Your account has been activated."
          : `You've joined ${res.data.group?.title || 'the group'}!`,
      });

      // Redirect based on user type
      if (isNewUser) {
        router.push("/login");
      } else {
        // Redirect to the group page
        const groupSlug = res.data.group?.slug;
        router.push(groupSlug ? `/groups/${groupSlug}` : "/dashboard");
      }
    } catch (err: any) {
      console.error("Invite acceptance error:", err);

      toaster.error({
        title: "Invalid or expired invite",
        description:
          err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Could not accept invitation.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maxW="lg" mx="auto" mt={12} px={4}>
      <Heading mb={4}>
        {isNewUser ? "Accept Your Invitation" : "Join Group"}
      </Heading>
      <Text color="gray.600" mb={6}>
        {isNewUser
          ? "Set your username and password to activate your account and join the group."
          : "Click below to accept this invitation and join the group."
        }
      </Text>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={4}>
          {isNewUser && (
            <>
              <Box>
                <Input
                  type="text"
                  data-testid="username-input"
                  placeholder="Choose a username"
                  {...register("username", {
                    required: "Username is required",
                    validate: async (value) => {
                      if (!isValidUsername(value))
                        return "Only letters, numbers, and _ allowed (3-20 characters)";
                      if (containsProfanity(value))
                        return "Inappropriate username";
                      const available = await checkUsernameAvailable(value);
                      return available || "Username already taken";
                    },
                  })}
                />
                {errors.username && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {errors.username.message as string}
                  </Text>
                )}
              </Box>

              <Box>
                <Input
                  type="password"
                  data-testid="password-input"
                  placeholder="Choose a password (min 8 characters)"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters"
                    }
                  })}
                />
                {errors.password && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {errors.password.message as string}
                  </Text>
                )}
              </Box>
            </>
          )}

          <Button
            type="submit"
            loading={submitting}
            colorScheme="green"
            size="lg"
          >
            {isNewUser ? "Activate Account" : "Accept Invitation"}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}