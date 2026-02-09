// src/components/auth/LoginPage.tsx

"use client";

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
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useColorModeValue } from "@components/ui/color-mode";
import { safeRedirect, useAuth } from "@/lib/auth/AuthContext";
import { toaster } from "@mixtape/core/lib/toaster";

import { LoginFormProps } from "./interfaces";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<LoginFormProps>({
    identifier: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userData = await login({
        identifier: formData.identifier,
        password: formData.password,
      });

      toaster.success({
        title: "Login successful",
        description: "Welcome back!",
      });

      const fallback = `/member/${userData.username}`;
      const redirectTo = safeRedirect(searchParams.get("redirect"), fallback);

      console.log("LoginPage redirecting to:", redirectTo);

      // Use router.push to avoid losing in-memory access token
      router.push(redirectTo);

      console.log("LoginPage login successful");

    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid credentials";
      toaster.error({
        title: "Login failed",
        description: message,
      });
    } finally {
      setIsLoading(false);
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
              Sign in to Crossroads
            </Heading>
            <Text color={useColorModeValue("gray.600", "gray.400")}>
              Welcome back
            </Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="Username or Email"
                bg={useColorModeValue("yellow.100", "gray.800")}
                data-testid="identifier-input"
                required
              />
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                bg={useColorModeValue("yellow.100", "gray.800")}
                data-testid="password-input"
                required
              />

              <Button
                type="submit"
                data-testid="login-button"
                loading={isLoading}
                size="lg"
                colorScheme="blue"
              >
                Sign In
              </Button>

              <Stack direction="row" justify="space-between" fontSize="sm">
                <Link
                  color="blue.500"
                  onClick={() => router.push("/forgot-password")}
                  _hover={{ textDecoration: "underline" }}
                >
                  Forgot password?
                </Link>
                <Link
                  color="blue.500"
                  onClick={() => router.push("/signup")}
                  _hover={{ textDecoration: "underline" }}
                >
                  Sign up
                </Link>
              </Stack>
            </Stack>
          </form>
        </Stack>
      </Container>
    </Center>
  );
};

export default LoginPage;
