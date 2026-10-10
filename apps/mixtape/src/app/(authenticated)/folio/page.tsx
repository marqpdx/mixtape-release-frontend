"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Container, Heading, HStack, Input, Link, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useCreateFolio, useFolios } from "@mixtape/api/hooks/folio";

// The writer's Folios — each opens its Workbench (Folio Notes PoC Phase 5).

export default function FolioIndexPage() {
  const router = useRouter();
  const { data: folios, isLoading } = useFolios();
  const { mutate: create, isPending } = useCreateFolio();
  const [title, setTitle] = useState("");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Container className="fidx-root" maxW="640px" py={12}>
      <Heading size="lg" mb={2}>
        Folios
      </Heading>
      <Text fontSize="sm" color={mutedColor} mb={6}>
        Each Folio collects the notes you capture for one body of work. Open one to browse and organize its notes.
      </Text>

      <HStack className="fidx-create" mb={8} gap={2}>
        <Input placeholder="New Folio title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <Button
          loading={isPending}
          disabled={!title.trim()}
          onClick={() => create(title.trim(), { onSuccess: (folio) => router.push(`/folio/${folio.id}/notes`) })}
        >
          Create
        </Button>
      </HStack>

      {isLoading ? (
        <Skeleton height="80px" />
      ) : (
        <VStack className="fidx-list" align="stretch" gap={2}>
          {(folios ?? []).map((folio) => (
            <Box
              key={folio.id}
              asChild
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              p={3}
              _hover={{ borderColor: "theme.accent" }}
            >
              <NextLink href={`/folio/${folio.id}/notes`}>
                <Text fontWeight="600">{folio.title || "Untitled Folio"}</Text>
              </NextLink>
            </Box>
          ))}
          {!folios?.length && (
            <Text color={mutedColor} fontSize="sm">
              No Folios yet. Create one here, or from the Folio tab in the mobile app.
            </Text>
          )}
        </VStack>
      )}

      <Text fontSize="sm" color={mutedColor} mt={8}>
        Starting from a raw idea instead?{" "}
        <Link asChild>
          <NextLink href="/folio/new">Begin with an inception</NextLink>
        </Link>
        . Arranging a work into Chapters and Scenes happens in{" "}
        <Link asChild>
          <NextLink href="/storyboard">Storyboard</NextLink>
        </Link>
        .
      </Text>
    </Container>
  );
}
