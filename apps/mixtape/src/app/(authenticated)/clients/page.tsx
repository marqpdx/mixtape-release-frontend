"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Link,
  Spinner,
  Table,
  Text,
} from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

interface ClientRecord {
  id: string;
  group_slug: string;
  group_title: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  website: string;
  business_type: string;
  prospect_slug: string | null;
  created_at: string | null;
}

export default function ClientsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStaff = user?.is_staff || user?.is_superuser;

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/business/clients");
      setClients(res.data);
    } catch {
      setError("Could not load clients.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isStaff) load();
    else if (!authLoading && !isStaff) setLoading(false);
  }, [authLoading, isStaff, load]);

  if (authLoading || loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!isStaff) {
    return (
      <Container maxW="xl" py={20}>
        <Text color="red.500">Staff access required.</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="xl" py={20}>
        <Text color="red.500">{error}</Text>
      </Container>
    );
  }

  return (
    <Container maxW="5xl" py={10}>
      <Heading size="lg" mb={6}>
        Clients
      </Heading>

      {clients.length === 0 ? (
        <Text color="gray.500">No clients yet.</Text>
      ) : (
        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Group</Table.ColumnHeader>
              <Table.ColumnHeader>Contact</Table.ColumnHeader>
              <Table.ColumnHeader>Email</Table.ColumnHeader>
              <Table.ColumnHeader>Type</Table.ColumnHeader>
              <Table.ColumnHeader>Since</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {clients.map((c) => (
              <Table.Row key={c.id}>
                <Table.Cell>
                  <Link href={`/groups/${c.group_slug}`} color="blue.500">
                    {c.group_title}
                  </Link>
                </Table.Cell>
                <Table.Cell>{c.primary_contact_name || "—"}</Table.Cell>
                <Table.Cell>
                  {c.primary_contact_email ? (
                    <Link href={`mailto:${c.primary_contact_email}`} color="blue.500">
                      {c.primary_contact_email}
                    </Link>
                  ) : "—"}
                </Table.Cell>
                <Table.Cell>{c.business_type || "—"}</Table.Cell>
                <Table.Cell>
                  {c.created_at
                    ? new Date(c.created_at).toLocaleDateString()
                    : "—"}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Container>
  );
}
