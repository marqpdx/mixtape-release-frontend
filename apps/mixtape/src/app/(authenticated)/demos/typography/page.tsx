// /src/app/(authenticated)/demos/typography/page.tsx

"use client";

import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Separator,
  Grid,
  Code,
} from '@chakra-ui/react';
import { useTheme } from '@contexts/ThemeContext';

export default function TypographyDemoPage() {
  const themeContext = useTheme();
  const currentTheme = themeContext?.currentTheme?.name || 'Gallery Minimal';
  const colorMode = themeContext?.colorMode || 'light';
  const contrastMode = themeContext?.contrastMode || 'normal';
  const fontScale = themeContext?.fontScale || 1;

  return (
    <Container maxW="4xl" py={8}>
      <VStack gap={8} align="stretch">

        {/* Header */}
        <Box>
          <Text textStyle="display1" mb={2}>
            Typography System
          </Text>
          <Text textStyle="bodyLarge" color="theme.textSecondary">
            Comprehensive text styles for Mixtape Release
          </Text>
          <HStack gap={4} mt={4} fontSize="sm" color="theme.textSecondary">
            <Text>Theme: <strong>{currentTheme}</strong></Text>
            <Text>Mode: <strong>{colorMode}</strong></Text>
            <Text>Contrast: <strong>{contrastMode}</strong></Text>
            <Text>Scale: <strong>{fontScale}x</strong></Text>
          </HStack>
        </Box>

        <Separator />

        {/* Display Styles */}
        <Section title="Display Styles" subtitle="Large, impactful headlines">
          <VStack gap={4} align="stretch">
            <DemoItem
              style="display1"
              text="Welcome to Crossroads"
              code='<Text textStyle="display1">'
            />
            <DemoItem
              style="display2"
              text="Your Creative Journey"
              code='<Text textStyle="display2">'
            />
          </VStack>
        </Section>

        <Separator />

        {/* Body Styles */}
        <Section title="Body Text" subtitle="Paragraph and content text">
          <VStack gap={4} align="stretch">
            <DemoItem
              style="bodyLarge"
              text="This is large body text for emphasis and introductory paragraphs. Perfect for opening statements."
              code='<Text textStyle="bodyLarge">'
            />
            <DemoItem
              style="body"
              text="This is the default body text style. Use it for main content, paragraphs, and standard readable text throughout the application."
              code='<Text textStyle="body">'
            />
            <DemoItem
              style="bodySmall"
              text="This is small body text for metadata, dates, or secondary information that needs less visual weight."
              code='<Text textStyle="bodySmall">'
            />
          </VStack>
        </Section>

        <Separator />

        {/* UI Text */}
        <Section title="UI Text" subtitle="Labels, captions, and interface elements">
          <VStack gap={4} align="stretch">
            <DemoItem
              style="label"
              text="Email Address"
              code='<Text textStyle="label">'
              description="Use for form labels and UI element labels"
            />
            <DemoItem
              style="caption"
              text="This is helper text or a caption for an image or form field"
              code='<Text textStyle="caption">'
              description="Secondary information, help text, image captions"
            />
            <DemoItem
              style="overline"
              text="Account Settings"
              code='<Text textStyle="overline">'
              description="Section headers, category labels"
            />
          </VStack>
        </Section>

        <Separator />

        {/* Interactive Text */}
        <Section title="Interactive Text" subtitle="Links and actionable elements">
          <VStack gap={4} align="stretch">
            <Box>
              <Text textStyle="link" as="a" cursor="pointer">
                <a href="">This is a styled link</a>
              </Text>
              <Code fontSize="xs" mt={2} display="block" p={2} bg="bg.subtle">
                {'<Text textStyle="link" as="a" href="#">'}
              </Code>
            </Box>
          </VStack>
        </Section>

        <Separator />

        {/* Code Text */}
        <Section title="Code & Monospace" subtitle="Code snippets and technical text">
          <VStack gap={4} align="stretch">
            <Box>
              <Text>Install dependencies: <Text textStyle="code" as="span">npm install</Text></Text>
              <Code fontSize="xs" mt={2} display="block" p={2} bg="bg.subtle">
                {'<Text textStyle="code">npm install</Text>'}
              </Code>
            </Box>
          </VStack>
        </Section>

        <Separator />

        {/* Font Information */}
        <Section title="Font Stack" subtitle="Typography foundations">
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
            <Box p={4} bg="theme.surface" borderRadius="md" border="1px solid" borderColor="theme.border">
              <Text textStyle="label" mb={2}>Body Font</Text>
              <Text fontFamily="body" fontSize="2xl" mb={2}>Inter</Text>
              <Text textStyle="bodySmall" color="theme.textSecondary">
                Clean, modern sans-serif optimized for UI and readability
              </Text>
            </Box>
            <Box p={4} bg="theme.surface" borderRadius="md" border="1px solid" borderColor="theme.border">
              <Text textStyle="label" mb={2}>Heading Font</Text>
              <Text fontFamily="heading" fontSize="2xl" mb={2}>DM Serif Display</Text>
              <Text textStyle="bodySmall" color="theme.textSecondary">
                Elegant serif for headlines and display text
              </Text>
            </Box>
          </Grid>
        </Section>

        <Separator />

        {/* Accessibility Info */}
        <Section title="Accessibility Features" subtitle="Built-in support for all users">
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
            <FeatureCard
              title="High Contrast"
              description="Toggle between normal and high contrast modes for better visibility"
            />
            <FeatureCard
              title="Font Scaling"
              description="Adjust text size from 0.875x to 1.5x to suit your reading preference"
            />
            <FeatureCard
              title="Reduced Motion"
              description="Automatically respects prefers-reduced-motion system settings"
            />
          </Grid>
        </Section>

        {/* Usage Guide */}
        <Box mt={8} p={6} bg="theme.surface" borderRadius="lg" border="1px solid" borderColor="theme.border">
          <Text textStyle="label" mb={3}>Usage Example</Text>
          <Code display="block" p={4} bg="bg.subtle" borderRadius="md" whiteSpace="pre" fontSize="xs">
{`import { Text } from '@chakra-ui/react';

// Display text
<Text textStyle="display1">Hero Headline</Text>

// Body text
<Text textStyle="body">Main paragraph content</Text>

// UI labels
<Text textStyle="label">Form Label</Text>

// Helper text
<Text textStyle="caption">Helper text</Text>

// Links
<Text textStyle="link" as="a" href="/about">Link</Text>

// Code
<Text textStyle="code">npm install</Text>`}
          </Code>
        </Box>

      </VStack>
    </Container>
  );
}

// Helper Components
type DemoTextStyle =
  | "display1"
  | "display2"
  | "bodyLarge"
  | "body"
  | "bodySmall"
  | "label"
  | "caption"
  | "overline";

function Section({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Text textStyle="overline" color="theme.accent" mb={1}>
        {title}
      </Text>
      <Text textStyle="bodySmall" color="theme.textSecondary" mb={4}>
        {subtitle}
      </Text>
      {children}
    </Box>
  );
}

function DemoItem({
  style,
  text,
  code,
  description
}: {
  style: DemoTextStyle;
  text: string;
  code: string;
  description?: string;
}) {
  return (
    <Box p={4} bg="theme.surface" borderRadius="md" border="1px solid" borderColor="theme.border">
      <Text textStyle={style} mb={2}>
        {text}
      </Text>
      {description && (
        <Text textStyle="caption" mb={2}>
          {description}
        </Text>
      )}
      <Code fontSize="xs" display="block" p={2} bg="bg.subtle">
        {code}
      </Code>
    </Box>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Box p={4} bg="theme.surface" borderRadius="md" border="1px solid" borderColor="theme.border">
      <Text textStyle="label" mb={2} color="theme.accent">
        {title}
      </Text>
      <Text textStyle="bodySmall" color="theme.textSecondary">
        {description}
      </Text>
    </Box>
  );
}
