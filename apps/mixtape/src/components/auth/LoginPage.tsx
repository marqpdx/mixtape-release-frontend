// apps/mixtape/src/components/auth/LoginPage.tsx

"use client";

import {
  Box,
  Button,
  Center,
  Container,
  Heading,
  Input,
  InputGroup,
  IconButton,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useColorModeValue } from "@components/ui/color-mode";
import { safeRedirect, useAuth } from "@/lib/auth/AuthContext";
import { toaster } from "@mixtape/core/lib/toaster";
import * as authApi from "@mixtape/api/clients/auth/api";
import { fetchUserGroups } from "@mixtape/api/clients/group/groupApi";

import { LoginFormProps } from "./interfaces";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<LoginFormProps>({
    identifier: searchParams.get("username") || "",
    password: "",
  });

  useEffect(() => {
    // Entering login should start from a clean auth cookie state.
    // If refresh_token is stale (e.g., after server restart), clear it first.
    authApi.logout().catch(() => undefined);
  }, []);

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
      await login({
        identifier: formData.identifier,
        password: formData.password,
      });

      toaster.success({
        title: "Login successful",
        description: "Welcome back!",
      });

      // Post-invite flow: redirect to the member group page.
      const postInviteGroup = searchParams.get("post_invite_group");
      if (postInviteGroup) {
        router.push(`/groups/${encodeURIComponent(postInviteGroup)}`);
        return;
      }

      const requestedRedirect = searchParams.get("redirect");
      if (requestedRedirect) {
        const redirectTo = safeRedirect(requestedRedirect, "/dashboard");
        router.push(redirectTo);
        return;
      }

      // Single-group redirect: if the user belongs to exactly one group,
      // drop them directly into its members tab.
      try {
        const groups = await fetchUserGroups();
        if (groups.length === 1) {
          router.push(`/groups/${groups[0].slug}`);
          return;
        }
      } catch {
        // Fall through to dashboard on any fetch error
      }

      router.push("/dashboard");

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
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
              <InputGroup
                endElement={
                  <IconButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </IconButton>
                }
              >
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  bg={useColorModeValue("yellow.100", "gray.800")}
                  data-testid="password-input"
                  required
                  pr="3rem"
                />
              </InputGroup>

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
    </motion.div>
  );
};

export default LoginPage;
