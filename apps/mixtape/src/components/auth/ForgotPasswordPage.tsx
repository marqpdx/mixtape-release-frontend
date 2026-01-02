// src/components/auth/ForgotPasswordPage.tsx
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
import { useRouter } from "next/navigation";
import { useColorModeValue } from "@components/ui/color-mode";
import { toaster } from "@mixtape/core/lib/toaster";

const ForgotPasswordPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement password reset API endpoint
      // await fetch(`${process.env.NEXT_PUBLIC_ROOT_API_URL}/api/auth/password-reset`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      // });

      toaster.success({
        title: "Reset link sent",
        description: "If an account exists with this email, you'll receive a password reset link.",
      });

      setEmail("");
    } catch {
      toaster.error({
        title: "Error",
        description: "Could not send password reset link. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Center minH="100vh">
      <Container
        maxW="md"
        p={8}
        borderRadius="md"
        boxShadow="lg"
        bg={useColorModeValue("white", "gray.700")}
      >
        <Stack gap={6}>
          <Box textAlign="center">
            <Heading size="lg" color={useColorModeValue("gray.800", "white")}>
              Forgot Password
            </Heading>
            <Text color={useColorModeValue("gray.600", "gray.400")}>
              Enter your email to receive a password reset link
            </Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                bg={useColorModeValue("yellow.100", "gray.800")}
                required
              />

              <Button
                type="submit"
                loading={isSubmitting}
                size="lg"
                colorScheme="blue"
              >
                Send Reset Link
              </Button>

              <Stack direction="row" justify="center" fontSize="sm">
                <Text color={useColorModeValue("gray.600", "gray.400")}>
                  Remember your password?
                </Text>
                <Link
                  color="blue.500"
                  onClick={() => router.push("/login")}
                  _hover={{ textDecoration: "underline" }}
                >
                  Sign In
                </Link>
              </Stack>
            </Stack>
          </form>
        </Stack>
      </Container>
    </Center>
  );
};

export default ForgotPasswordPage;
