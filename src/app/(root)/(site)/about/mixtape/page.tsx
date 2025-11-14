"use client";

import {
  Box,
  Grid,
  Heading,
  Text,
  Card,
  Button,
  Avatar,
  Link as ChakraLink,
} from "@chakra-ui/react";
import NextLink from "next/link";

export default function AboutMixtapePage() {
  return (
    <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 10, md: 20 }}>
      <Heading as="h1" size="2xl" mb={6}>
        About Mixtape
      </Heading>

      <Text fontSize="lg" mb={12} maxW="3xl">
        Mixtape is a digital ecosystem for communities, creators, and organizations who want
        deeper connection, collaborative knowledge, and meaningful real-world impact.
      </Text>

      <Grid
        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
        gap={8}
      >
        {/* Crossroads */}
        <Card.Root width="100%">
          <Card.Body gap="2">
            <Avatar.Root size="lg" shape="rounded">
              <Avatar.Fallback name="Crossroads" />
            </Avatar.Root>
            <Card.Title mt="2">Crossroads</Card.Title>
            <Card.Description>
              Mixtape’s vibrant community spaces where members post, share updates,
              and connect. Crossroads powers everything from member directories
              to group hubs and event listings.
            </Card.Description>
          </Card.Body>
          <Card.Footer justifyContent="flex-end">
            <ChakraLink as={NextLink} href="/about/mixtape/crossroads" _hover={{ textDecoration: "none" }}>
              <Button variant="outline">Explore Crossroads</Button>
            </ChakraLink>
          </Card.Footer>
        </Card.Root>

        {/* Livewire */}
        <Card.Root width="100%">
          <Card.Body gap="2">
            <Avatar.Root size="lg" shape="rounded">
              <Avatar.Fallback name="Livewire" />
            </Avatar.Root>
            <Card.Title mt="2">Livewire</Card.Title>
            <Card.Description>
              Real-time chat for private messages, group discussions, and rapid collaboration.
              Livewire keeps conversations flowing and communities connected.
            </Card.Description>
          </Card.Body>
          <Card.Footer justifyContent="flex-end">
            <ChakraLink as={NextLink} href="/about/mixtape/livewire" _hover={{ textDecoration: "none" }}>
              <Button variant="outline">Livewire</Button>
            </ChakraLink>
          </Card.Footer>
        </Card.Root>

        {/* Loom & Codex */}
        <Card.Root width="100%">
          <Card.Body gap="2">
            <Avatar.Root size="lg" shape="rounded">
              <Avatar.Fallback name="Loom & Codex" />
            </Avatar.Root>
            <Card.Title mt="2">Loom & Codex</Card.Title>
            <Card.Description>
              A powerful knowledge library where communities curate documents, guides, and
              collective wisdom. Perfect for wikis, best practices, and shared resources.
            </Card.Description>
          </Card.Body>
          <Card.Footer justifyContent="flex-end">
            <ChakraLink as={NextLink} href="/about/mixtape/livewire" _hover={{ textDecoration: "none" }}>
              <Button variant="outline">Browse Loom & Codex</Button>
            </ChakraLink>
          </Card.Footer>
        </Card.Root>

        {/* Constellation */}
        <Card.Root width="100%">
          <Card.Body gap="2">
            <Avatar.Root size="lg" shape="rounded">
              <Avatar.Fallback name="Constellation" />
            </Avatar.Root>
            <Card.Title mt="2">Constellation</Card.Title>
            <Card.Description>
              A visual map of relationships between people, ideas, and groups.
              Constellation reveals hidden connections and sparks new collaborations.
            </Card.Description>
          </Card.Body>
          <Card.Footer justifyContent="flex-end">
            <ChakraLink as={NextLink} href="/about/mixtape/livewire" _hover={{ textDecoration: "none" }}>
              <Button variant="outline">View Constellation</Button>
            </ChakraLink>
          </Card.Footer>
        </Card.Root>

        {/* EarthLab */}
        <Card.Root width="100%">
          <Card.Body gap="2">
            <Avatar.Root size="lg" shape="rounded">
              <Avatar.Fallback name="EarthLab" />
            </Avatar.Root>
            <Card.Title mt="2">EarthLab</Card.Title>
            <Card.Description>
              Hybrid learning and real-life collaboration. EarthLab combines online courses,
              local gatherings, and project-based circles—bridging the digital and physical world.
            </Card.Description>
          </Card.Body>
          <Card.Footer justifyContent="flex-end">
            <ChakraLink as={NextLink} href="/about/mixtape/livewire" _hover={{ textDecoration: "none" }}>
              <Button variant="outline">Visit EarthLab

              </Button>
            </ChakraLink>
          </Card.Footer>
        </Card.Root>
      </Grid>

      <Box mt={16}>
        <Heading as="h3" size="lg" mb={4}>
          Why Mixtape?
        </Heading>
        <Text fontSize="md" maxW="3xl">
          Mixtape offers curated communities, expressive relationship mapping,
          data privacy and self-hosting options, federation across servers,
          and powerful tools for knowledge sharing and hybrid learning.
          It’s an alternative to fragmented platforms like Facebook, Slack, Notion,
          and even Coursera—bringing everything together in one cohesive ecosystem.
        </Text>
      </Box>
    </Box>
  );
}
