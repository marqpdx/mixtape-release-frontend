// app/welcome/start/page.tsx
"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Link,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { useForm } from "react-hook-form";
import { IconArrowRight } from "@tabler/icons-react";

// Minimal data shape for onboarding step
type StartForm = {
  firstInitial: string;
  lastName: string;
  locale: string; // city, region, or postal code
};

export default function WelcomeStartPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    watch,
  } = useForm<StartForm>({
    mode: "onChange",
    defaultValues: { firstInitial: "", lastName: "", locale: "" },
  });

  const onSubmit = async (data: StartForm) => {
    // TODO: POST to your API, e.g. /api/auth/onboarding/start
    // await axios.post("/api/onboarding/start", data)

    // Optional: stash locally for continuity if API not wired yet
    if (typeof window !== "undefined") {
      try {
        const minimal = {
          firstInitial: data.firstInitial.trim().toUpperCase().slice(0, 1),
          lastName: data.lastName.trim(),
          locale: data.locale.trim(),
        };
        window.localStorage.setItem("onboarding_minimal_profile", JSON.stringify(minimal));
      } catch (_) {}
    }

    router.push("/welcome/agreements"); // Page 3
  };

  // Live uppercase for first initial (UI only)
  const firstInitial = watch("firstInitial");

  return (
    <Box minH="100vh" bg="theme.bg" py={{ base: 10, md: 16 }} px={{ base: 6, md: 8 }}>
      <Container maxW="lg" px={0}>
        {/* Step header */}
        <VStack align="start" gap={2} mb={6}>
          <Text fontSize="sm" color="theme.textSecondary" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
            Step 1 of 3
          </Text>
          <Heading as="h1" size="xl" color="theme.text" fontWeight="800">
            Welcome — let’s get you set up
          </Heading>
          <Text color="theme.textSecondary">
            Just a few basics. You can edit everything later.
          </Text>
        </VStack>

        {/* Card */}
        <Box bg="theme.surface" border="1px solid" borderColor="theme.border" borderRadius="2xl" p={{ base: 6, md: 8 }} shadow="md">
          <VStack as="form" onSubmit={handleSubmit(onSubmit)} align="stretch" gap={5}>
            {/* First Initial */}
            <Box>
              <Text color="theme.text" fontWeight="600" mb={2}>
                First initial <Text as="span" color="red.500">*</Text>
              </Text>
              <Input
                placeholder="M"
                maxLength={1}
                value={(firstInitial || "").toUpperCase()}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().slice(0, 1);
                  // Manually sync with RHF
                  const fakeEvent = { target: { name: "firstInitial", value: val } } as unknown as React.ChangeEvent<HTMLInputElement>;
                  // @ts-ignore - RHF accepts a synthetic-like event
                  register("firstInitial").onChange(fakeEvent);
                }}
                bg="theme.surface"
                borderColor={errors.firstInitial ? "red.400" : "theme.border"}
                _focus={{ borderColor: errors.firstInitial ? "red.400" : "theme.accent", boxShadow: "none" }}
              />
              {errors.firstInitial && (
                <Text mt={1} fontSize="sm" color="red.400">Please enter one letter.</Text>
              )}
            </Box>

            {/* Last Name */}
            <Box>
              <Text color="theme.text" fontWeight="600" mb={2}>
                Last name <Text as="span" color="red.500">*</Text>
              </Text>
              <Input
                placeholder="Lilly"
                {...register("lastName", {
                  required: true,
                  validate: (v) => v.trim().length >= 2,
                })}
                bg="theme.surface"
                borderColor={errors.lastName ? "red.400" : "theme.border"}
                _focus={{ borderColor: errors.lastName ? "red.400" : "theme.accent", boxShadow: "none" }}
              />
              {errors.lastName && (
                <Text mt={1} fontSize="sm" color="red.400">Please enter your last name.</Text>
              )}
            </Box>

            {/* Locale */}
            <Box>
              <Text color="theme.text" fontWeight="600" mb={2}>
                Locale (city or postal code) <Text as="span" color="red.500">*</Text>
              </Text>
              <Input
                placeholder="Helsinki or 00100"
                {...register("locale", {
                  required: true,
                  validate: (v) => v.trim().length >= 2,
                })}
                bg="theme.surface"
                borderColor={errors.locale ? "red.400" : "theme.border"}
                _focus={{ borderColor: errors.locale ? "red.400" : "theme.accent", boxShadow: "none" }}
              />
              {errors.locale && (
                <Text mt={1} fontSize="sm" color="red.400">Please enter a city or postal code.</Text>
              )}
            </Box>

            {/* Actions */}
            <HStack justify="space-between" pt={2}>
              <Link as={NextLink} href="/about/how-it-works" color="theme.textSecondary" _hover={{ color: "theme.accent" }}>
                Learn more about Crossroads
              </Link>
              <Button
                type="submit"
                bg="theme.accent"
                color="white"
                borderRadius="xl"
                px={6}
                py={5}
                size="lg"
                loading={isSubmitting}
                disabled={!isValid}
                _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
              >
                <IconArrowRight size={18} />
                Continue
              </Button>
            </HStack>
          </VStack>
        </Box>

        {/* Step hint */}
        <HStack mt={6} gap={2} color="theme.textSecondary">
          <Text fontSize="sm">Next: Community Agreements</Text>
        </HStack>
      </Container>
    </Box>
  );
}
