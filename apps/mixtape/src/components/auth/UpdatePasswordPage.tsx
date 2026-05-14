"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Center,
  Container,
  Heading,
  Input,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useColorModeValue } from "@components/ui/color-mode";
import { toaster } from "@mixtape/core/lib/toaster";
import * as authApi from "@mixtape/api/clients/auth/api";

const UpdatePasswordPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const cardBg = useColorModeValue("white", "gray.700");
  const labelColor = useColorModeValue("gray.600", "gray.400");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toaster.error({ title: "Passwords don't match" });
      return;
    }
    if (!uid || !token) {
      toaster.error({ title: "Invalid reset link", description: "Please request a new one." });
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.confirmPasswordReset(uid, token, newPassword);
      setDone(true);
      toaster.success({ title: "Password updated", description: "You can now sign in with your new password." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not reset password.";
      toaster.error({ title: "Error", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Center minH="100vh">
      <Container maxW="md" p={8} borderRadius="md" boxShadow="lg" bg={cardBg}>
        <Stack gap={6}>
          <Box textAlign="center">
            <Heading size="lg">Choose a new password</Heading>
            <Text color={labelColor}>Enter and confirm your new password below.</Text>
          </Box>

          {done ? (
            <Stack gap={4} textAlign="center">
              <Text color="green.500" fontWeight="medium">Password updated successfully.</Text>
              <Button colorScheme="blue" onClick={() => router.push("/login")}>
                Sign In
              </Button>
            </Stack>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack gap={4}>
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={4}
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={4}
                />
                <Button type="submit" loading={isSubmitting} size="lg" colorScheme="blue">
                  Update Password
                </Button>
                <Stack direction="row" justify="center" fontSize="sm">
                  <Text color={labelColor}>Remember your password?</Text>
                  <Link color="blue.500" onClick={() => router.push("/login")}>
                    Sign In
                  </Link>
                </Stack>
              </Stack>
            </form>
          )}
        </Stack>
      </Container>
    </Center>
  );
};

export default UpdatePasswordPage;
