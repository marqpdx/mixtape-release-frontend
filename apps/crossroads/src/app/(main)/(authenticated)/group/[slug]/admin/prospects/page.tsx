"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import NextLink from "next/link";

interface Prospect {
  id: string;
  name: string;
  slug: string;
  status: string;
  primary_contact_name: string;
  primary_contact_email: string;
  created_at: string;
}


export default function ProspectsListPage() {
  const params = useParams();
  const groupSlug = params.slug as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const cardBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/prospects/?group=${groupSlug}`);
      setProspects(res.data);
    } catch {
      setError("Could not load prospects.");
    } finally {
      setLoading(false);
    }
  }, [groupSlug]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
  }, [authLoading, isAuthenticated, load]);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await axiosInstance.post("/api/prospects/", {
        name: name.trim(),
        sponsor_group_slug: groupSlug,
        primary_contact_name: contactName.trim(),
        primary_contact_email: contactEmail.trim(),
      });
      setProspects((p) => [res.data, ...p]);
      setName("");
      setContactName("");
      setContactEmail("");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setCreateError(msg || "Could not create prospect.");
    } finally {
      setCreating(false);
    }
  }

  if (authLoading || loading) {
    return <Box px="6" py="20" textAlign="center"><Spinner size="lg" /></Box>;
  }

  if (!isAuthenticated || !user?.is_superuser) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Text color={mutedColor}>Superuser access required.</Text>
      </Box>
    );
  }

  return (
    <Box maxW="3xl" mx="auto" px="6" py="10">
      <HStack mb="6" justify="space-between" align="center">
        <Heading size="lg">Prospects</Heading>
        <ChakraLink asChild fontSize="sm" color="blue.500">
          <NextLink href={`/group/${groupSlug}`}>← Group</NextLink>
        </ChakraLink>
      </HStack>

      <Box p="5" border="1px solid" borderColor={borderColor} borderRadius="md" bg={cardBg} mb="8">
        <Text fontWeight="600" mb="3">Add prospect</Text>
        <VStack gap="2" align="stretch">
          <Input size="sm" placeholder="Business name *" value={name} onChange={(e) => setName(e.target.value)} />
          <Input size="sm" placeholder="Contact name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <Input size="sm" placeholder="Contact email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          {createError && <Text fontSize="sm" color="red.500">{createError}</Text>}
          <HStack>
            <Button size="sm" colorPalette="blue" onClick={handleCreate} loading={creating} disabled={!name.trim()}>
              Create
            </Button>
          </HStack>
        </VStack>
      </Box>

      {error && <Text color="red.500" mb="4">{error}</Text>}

      {prospects.length === 0 ? (
        <Box p="6" border="1px solid" borderColor={borderColor} borderRadius="md" bg={cardBg} textAlign="center">
          <Text color={mutedColor}>No prospects yet.</Text>
        </Box>
      ) : (
        <VStack gap="2" align="stretch">
          {prospects.map((p) => (
            <ChakraLink asChild key={p.id} _hover={{ textDecoration: "none" }}>
              <NextLink href={`/group/${groupSlug}/admin/prospects/${p.slug}`}>
                <Box
                  p="4" border="1px solid" borderColor={borderColor} borderRadius="md" bg={cardBg}
                  _hover={{ borderColor: "blue.300" }} transition="border-color 0.15s" cursor="pointer"
                >
                  <HStack justify="space-between">
                    <Text fontWeight="500">{p.name}</Text>
                    <Text fontSize="xs" color={mutedColor} textTransform="capitalize">{p.status.replace(/_/g, " ")}</Text>
                  </HStack>
                  {p.primary_contact_name && (
                    <Text fontSize="sm" color={mutedColor}>{p.primary_contact_name}{p.primary_contact_email ? ` · ${p.primary_contact_email}` : ""}</Text>
                  )}
                </Box>
              </NextLink>
            </ChakraLink>
          ))}
        </VStack>
      )}
    </Box>
  );
}
