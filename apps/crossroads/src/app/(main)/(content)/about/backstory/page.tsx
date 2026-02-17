// apps/crossroads/src/app/about/backstory/page.tsx

"use client";

import { Box, Heading, HStack, Link, Text, VStack } from "@chakra-ui/react";
import NextLink from "next/link";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";

export default function AboutBackstoryPage() {
  return (
    <>
      <UnifiedNavbar extraCompact />
      <Box maxW="900px" mx="auto" py={{ base: 10, md: 16 }} px={{ base: 5, md: 8 }}>
        <HStack gap={4} mb={{ base: 6, md: 8 }}>
          <Link as={NextLink} href="/" textDecoration="underline">
            Home
          </Link>
          <Link as={NextLink} href="/about" textDecoration="underline">
            About
          </Link>
        </HStack>

        <Heading as="h1" size="xl" mb={{ base: 6, md: 8 }}>
          About: Backstory
        </Heading>

        <VStack align="start" gap={5}>
          <Text fontSize="lg">
            Crossroads has come about because for decades I have wanted better ways to support the
            gatherings I became part of. I was blessed to come up with Street Yoga, which grew to
            allow me to travel to Europe, Canada, and all over the U.S. sharing of the topic we
            coined &#39;yoga service&#39;. We would combine spreadsheets with giant bcc email lists,
            and lots of email to bring folks together in Cleveland, Denver, Boston, New Port Richey,
            Los Angeles, and countless others. It was a tremendous blessing.
          </Text>

          <Text fontSize="lg">
            Where I fell short of my own envisioning was after weekend trainings, or after 4 week
            Wednesday afternoon sessions—I&apos;d want us to stay in touch and keep sharing and
            collaborating but I lacked the tools to pull this off. I could have devoted most of my
            work-a-day energies to this and succeeded, but other calls (income, for example) arose and
            the project was back-burnered for 20+ years. It stewed in my thoughts, but what I
            envisioned was five people for 18 months of discovery and devlopment, and that wasn&apos;t
            then feasible for me.
          </Text>

          <Text fontSize="lg">
            Enter April 1, 2025, newly (gratefully) laid off, b/c it was time, and I decided to brush
            up my ai skills, and started using chatgpt and claude to answer questions and suggest new
            opportunities for learning. I brought up my long-held desire for a unified set of
            tooling, loosely but discerningly interconnected, something that serves human togetherness
            rather than takes a lot of effort, mental and otherwise. I asked ai to code a few things,
            then a few more, and in 10 minutes would arise 120 lines of tight code that did what I
            wanted, code that would have taken me a day and a half to type myself, so I did anothe ten
            minutes, then half an hour, and suddenly complexity was being generated line by line,
            working code, and I was off.
          </Text>

          <Text fontSize="lg">
            It&#39;s taken me ten months to bring Mixtape—the software family of Crossroads—to first
            harvest, where we are now in winter of 2026.
          </Text>

          <Text fontSize="lg">
            A couple of idea bits before leaving this writing: one, we use the notion of _decorators_
            quite regularly. This is the notion for groups, that certain things can be added or
            subtrated from a group to redefine it&#39;s shape, its nature. for example one decorator
            could be &quot;offers events&quot;, and another would be &quot;can sell products&quot; or
            &quot;requires invites to join&quot; or or or. There are only four core types of groups,
            and the rest is all decorators. The reason is that this is how stuff seems to work in
            real life. Yes the four young musicians name themselves a &quot;band&quot;, and so it is
            in Mixtape; _isBand_ is a decorator.
          </Text>

          <Text fontSize="lg">
            The second pattern that&#39;s common is the notion of serving in the background. For
            example when writing in any webbrowseer, it always drives me crazy if there&#39;s a glitch
            and data/typing/words are lost, so we built an autoSave: three seconds after you slightly
            pause from typing, it autosaves, all the time. Similarly, there are a set of tools called
            Copy Desk; I&#39;m excited about this. Currently, the main piece is an auto-summarizer. As
            one types (200 words or more to kick it off), the text will run through a local LLM and
            return a tidy 35 word summary of whatever you are typing about. What&#39;s nice, though,
            and this is the pattern, it merely suggests. A little green button alerts you a summary
            is ready, but you can ignore it for ever; or, click one button to expand the Copy Desk and
            avail yourself of the summary, the suggested summary.
          </Text>

          <Text fontSize="lg">
            There are other patterns, but mostly is the sense of excited curiosity. I believe most
            people are decent, interesting; I know all people matter deeply to whatever Creator any of
            us has even envisioned; in fact all beings matter, b/c we&#39;re all part of one amazing
            vitality. This software, this offering, is intended to support our universal and mutual
            flourishing. Where it falls short let us know and we&#39;ll seek to do it better.
          </Text>

          <Text fontSize="lg">
            We have work to do people, and millions of us already are committing to Love, to Earth
            Reverence, and we need to keep nurturing that every day. I am very hopeful.
          </Text>
          <Text fontSize="lg">
            Sincerely, mark a. lilly
          </Text>
        </VStack>
      </Box>
    </>
  );
}
