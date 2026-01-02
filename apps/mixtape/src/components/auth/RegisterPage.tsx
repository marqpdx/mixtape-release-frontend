// src/components/auth/RegisterPage.tsx
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
import { useRouter } from "next/navigation";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { toaster } from "@mixtape/core/lib/toaster";

import { RegisterFormProps } from "./interfaces";

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<RegisterFormProps>({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(formData);

      toaster.success({
        title: "Registration successful",
        description: "Your account has been created. Please log in.",
      });

      // AuthContext redirects to login automatically
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create account";
      toaster.error({
        title: "Registration failed",
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
              Create Your Account
            </Heading>
            <Text color={useColorModeValue("gray.600", "gray.400")}>
              Join Crossroads
            </Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                bg={useColorModeValue("yellow.100", "gray.800")}
                required
              />
              <Input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First Name"
                bg={useColorModeValue("yellow.100", "gray.800")}
                required
              />
              <Input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last Name"
                bg={useColorModeValue("yellow.100", "gray.800")}
                required
              />
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                bg={useColorModeValue("yellow.100", "gray.800")}
                required
              />
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                bg={useColorModeValue("yellow.100", "gray.800")}
                required
                minLength={8}
              />

              <Button
                type="submit"
                loading={isLoading}
                size="lg"
                colorScheme="blue"
              >
                Sign Up
              </Button>

              <Stack direction="row" justify="center" fontSize="sm">
                <Text color={useColorModeValue("gray.600", "gray.400")}>
                  Already have an account?
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

export default RegisterPage;
