"use client";

import React from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Slider,
  Select,
  Switch,
  Code,
  Kbd,
  createListCollection,
} from "@chakra-ui/react";

import { Divider } from "@components/common/Divider";

// Tabler Icons
import {
  IconUsers,
  IconMessageCircle,
  IconBook2,
  IconCalendar,
  IconWorld,
  IconHeart,
  IconLeaf,
} from "@tabler/icons-react";

// Lucide Icons
import {
  Users as LucideUsers,
  MessageCircle as LucideMessageCircle,
  Book as LucideBook,
  Calendar as LucideCalendar,
  Globe as LucideGlobe,
  Wrench as LucideWrench,
  Heart as LucideHeart,
  Sprout as LucideSprout,
} from "lucide-react";

// Phosphor Icons
import {
  UsersThree as PhUsers,
  ChatsCircle as PhChatsCircle,
  Book as PhBook,
  Calendar as PhCalendar,
  GlobeHemisphereWest as PhGlobe,
  Wrench as PhWrench,
  Heart as PhHeart,
  Leaf as PhLeaf,
  type IconProps as PhIconProps,
} from "phosphor-react";

// Heroicons (outline)
import {
  UsersIcon as HeroUsers,
  ChatBubbleLeftRightIcon as HeroChat,
  BookOpenIcon as HeroBook,
  CalendarDaysIcon as HeroCalendar,
  GlobeAltIcon as HeroGlobe,
  WrenchScrewdriverIcon as HeroWrench,
  HeartIcon as HeroHeart,
  SparklesIcon as HeroSparkles,
} from "@heroicons/react/24/outline";

// Iconoir
import {
  Group as IconoirGroup,
  ChatBubble as IconoirChat,
  Book as IconoirBook,
  Calendar as IconoirCalendar,
  Globe as IconoirGlobe,
  Tools as IconoirTools,
  Heart as IconoirHeart,
  Leaf as IconoirLeaf,
} from "iconoir-react";

// Boring Avatars
import Avatar from "boring-avatars";

// Utility: deterministic HSL from slug
function hashToHSL(slug: string, s = 65, l = 48) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} ${s}% ${l}%)`;
}

const items = [
  { label: "Members", slug: "members", emoji: "🧑‍🤝‍🧑" },
  { label: "Threads", slug: "threadworks", emoji: "🧵" },
  { label: "Dispatch", slug: "dispatch", emoji: "📤" },
  { label: "Lantern", slug: "lantern", emoji: "🏮" },
  { label: "Almanac", slug: "almanac", emoji: "📆" },
  { label: "Constellation", slug: "constellation", emoji: "✨" },
  { label: "Tapestry", slug: "tapestry", emoji: "🗺️" },
  { label: "EarthLab", slug: "earthlab", emoji: "🌱" },
] as const;

const tablerMap: Record<(typeof items)[number]["slug"], React.ElementType> = {
  members: IconUsers,
  threadworks: IconMessageCircle,
  dispatch: IconBook2,
  lantern: IconHeart,
  almanac: IconCalendar,
  constellation: IconWorld,
  tapestry: IconLeaf,
  earthlab: IconHeart,
};

const lucideMap: Record<(typeof items)[number]["slug"], React.ElementType> = {
  members: LucideUsers,
  threadworks: LucideMessageCircle,
  dispatch: LucideBook,
  lantern: LucideWrench,
  almanac: LucideCalendar,
  constellation: LucideGlobe,
  tapestry: LucideSprout,
  earthlab: LucideHeart,
};

const phosphorMap: Record<(typeof items)[number]["slug"], React.ElementType> = {
  members: PhUsers,
  threadworks: PhChatsCircle,
  dispatch: PhBook,
  lantern: PhWrench,
  almanac: PhCalendar,
  constellation: PhGlobe,
  tapestry: PhLeaf,
  earthlab: PhHeart,
};

const heroMap: Record<(typeof items)[number]["slug"], React.ElementType> = {
  members: HeroUsers,
  threadworks: HeroChat,
  dispatch: HeroBook,
  lantern: HeroWrench,
  almanac: HeroCalendar,
  constellation: HeroSparkles,
  tapestry: HeroGlobe,
  earthlab: HeroHeart,
};

const iconoirMap: Record<(typeof items)[number]["slug"], React.ElementType> = {
  members: IconoirGroup,
  threadworks: IconoirChat,
  dispatch: IconoirBook,
  lantern: IconoirTools,
  almanac: IconoirCalendar,
  constellation: IconoirGlobe,
  tapestry: IconoirLeaf,
  earthlab: IconoirHeart,
};

// Chakra v3 Select requires a ListCollection
const weightCollection = createListCollection({
  items: [
    { label: "thin", value: "thin" },
    { label: "light", value: "light" },
    { label: "regular", value: "regular" },
    { label: "bold", value: "bold" },
    { label: "fill", value: "fill" },
    { label: "duotone", value: "duotone" },
  ] as const,
});

type WeightValue = (typeof weightCollection.items)[number]["value"];

function SectionHeading({ title, note }: { title: string; note?: string }) {
  return (
    <HStack justify="space-between" align="end" mt={10} mb={3}>
      <Heading size="md">{title}</Heading>
      {note ? (
        <Text fontSize="sm" opacity={0.7}>
          {note}
        </Text>
      ) : null}
    </HStack>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <Box
      borderWidth="1px"
      borderRadius="2xl"
      p={4}
      _light={{ bg: "white" }}
      _dark={{ bg: "blackAlpha.400" }}
      shadow="sm"
    >
      {children}
    </Box>
  );
}

function Badge({ children, bg }: { children: React.ReactNode; bg?: string }) {
  return (
    <Box
      as="span"
      px={2}
      py={0.5}
      borderRadius="full"
      fontSize="xs"
      fontWeight="semibold"
      bg={bg || "blackAlpha.200"}
    >
      {children}
    </Box>
  );
}

function IconGrid({
  map,
  render,
}: {
  map: Record<(typeof items)[number]["slug"], React.ElementType>;
  render: (Icon: React.ElementType, color: string) => React.ReactNode;
}) {
  return (
    <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={4}>
      {items.map((it) => {
        const Icon = map[it.slug];
        const color = hashToHSL(it.slug);
        return (
          <Card key={`${it.slug}`}>
            <VStack>
              {render(Icon, color)}
              <Text fontWeight="semibold">{it.label}</Text>
              <Code fontSize="xs">{it.slug}</Code>
            </VStack>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}

export default function IconsDemoPage() {
  const [size, setSize] = React.useState<number>(28);
  const [phWeight, setPhWeight] = React.useState<Exclude<PhIconProps["weight"], undefined>>("regular");
  const [useStroke, setUseStroke] = React.useState<boolean>(true);

  return (
    <Container maxW="6xl" py={10}>
      <VStack align="stretch" gap={6}>
        <VStack align="start" gap={2}>
          <Heading size="lg">Icons & Identicons – Demo</Heading>
          <Text opacity={0.8}>
            Quick side-by-side of <Badge>Tabler</Badge>, <Badge>Lucide</Badge>, <Badge>Phosphor</Badge>,
            <Badge>Heroicons</Badge>, <Badge>Iconoir</Badge>, <Badge>Boring Avatars</Badge>, <Badge>DiceBear</Badge>,
            and <Badge>Emoji</Badge>. Colors are derived from a deterministic <Kbd>slug → HSL</Kbd> hash.
          </Text>
        </VStack>

        <Card>
          <HStack gap={6} flexWrap="wrap">
            <HStack gap={2}>
              <Text fontSize="sm" opacity={0.8}>
                Icon size
              </Text>
              <Slider.Root
                value={[size]}
                onValueChange={({ value }) => setSize(value[0] ?? 28)}
                max={64}
                min={16}
                step={2}
                w="200px"
              >
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumb index={0}>
                  <Slider.DraggingIndicator />
                  <Slider.HiddenInput />
                </Slider.Thumb>
              </Slider.Root>
              <Code>{size}px</Code>
            </HStack>

            <HStack gap={2}>
              <Text fontSize="sm" opacity={0.8}>
                Phosphor weight
              </Text>
              <Select.Root
                collection={weightCollection}
                value={[phWeight]}
                onValueChange={({ value }) =>
                  setPhWeight(((value[0] as WeightValue | undefined) ?? "regular") as Exclude<PhIconProps["weight"], undefined>)
                }
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                    <Select.ClearTrigger />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {weightCollection.items.map((it) => (
                      <Select.Item key={it.value} item={it}>
                        {it.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </HStack>

            <Switch.Root checked={useStroke} onCheckedChange={(e) => setUseStroke(e.checked)}>
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Label>Outline style (Tabler/Lucide)</Switch.Label>
            </Switch.Root>
          </HStack>
        </Card>

        <SectionHeading title="Tabler Icons" note="Outline icons; color via slug→HSL" />
        <IconGrid
          map={tablerMap}
          render={(Icon, color) => <Icon size={size} stroke={useStroke ? 2 : 1} color={color} />}
        />

        <Divider />

        <SectionHeading title="Lucide" note="Outline-first; easy stroke width control" />
        <IconGrid
          map={lucideMap}
          render={(Icon, color) => <Icon size={size} strokeWidth={useStroke ? 2 : 1.25} color={color} />}
        />

        <Divider />

        <SectionHeading title="Phosphor" note="Huge set with weights (thin→bold, fill, duotone)" />
        <IconGrid
          map={phosphorMap}
          render={(Icon, color) => <Icon size={size} weight={phWeight} color={color} />}
        />

        <Divider />

        <SectionHeading title="Heroicons" note="Crisp, producty, consistent outline set" />
        <IconGrid
          map={heroMap}
          render={(Icon, color) => (
            <Box color={color}>
              <Icon width={size} height={size} />
            </Box>
          )}
        />

        <Divider />

        <SectionHeading title="Iconoir" note="Clean line style, lots of icons" />
        <IconGrid
          map={iconoirMap}
          render={(Icon, color) => (
            <Box color={color}>
              <Icon width={size} height={size} strokeWidth={useStroke ? 2 : 1.5} />
            </Box>
          )}
        />

        <Divider />

        <SectionHeading title="Boring Avatars (identicons)" note="Great when you don't have a logo yet" />
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={4}>
          {items.map((it) => (
            <Card key={`boring-${it.slug}`}>
              <VStack>
                <Avatar
                  size={size * 2}
                  name={it.slug}
                  variant="beam"
                  colors={["#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"]}
                />
                <Text fontWeight="semibold">{it.label}</Text>
                <Code fontSize="xs">{it.slug}</Code>
              </VStack>
            </Card>
          ))}
        </SimpleGrid>

        <Divider />

        <SectionHeading title="DiceBear (URL-based)" note="Zero deps – use an <img> with a generated URL" />
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={4}>
          {items.map((it) => {
            const url = `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(it.slug)}`;
            return (
              <Card key={`dice-${it.slug}`}>
                <VStack>
                  <img src={url} width={size * 2} height={size * 2} alt={it.slug} />
                  <Text fontWeight="semibold">{it.label}</Text>
                  <Code fontSize="xs">{it.slug}</Code>
                </VStack>
              </Card>
            );
          })}
        </SimpleGrid>

        <Divider />

        <SectionHeading title="Emoji" note="Ridiculously fast to scan; great defaults" />
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={4}>
          {items.map((it) => (
            <Card key={`emoji-${it.slug}`}>
              <VStack>
                <Box fontSize={`${Math.round(size * 1.6)}px`}>{it.emoji}</Box>
                <Text fontWeight="semibold">{it.label}</Text>
                <Code fontSize="xs">{it.slug}</Code>
              </VStack>
            </Card>
          ))}
        </SimpleGrid>

        <Divider />

        <VStack align="start" gap={2}>
          <Heading size="sm">Install notes</Heading>
          <Code p={2} borderRadius="md" whiteSpace="pre-wrap">
            yarn add @tabler/icons-react lucide-react phosphor-react boring-avatars @heroicons/react iconoir-react
          </Code>
          <Text fontSize="sm" opacity={0.8}>
            DiceBear uses a hosted URL in this demo, so no package install is required.
          </Text>
        </VStack>
      </VStack>
    </Container>
  );
}
