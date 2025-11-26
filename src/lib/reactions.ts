// src/lib/reactions.ts
import {
  IconThumbUp,
  IconHeart,
  IconMoodSmile as IconMoodSmileReaction,
  IconMoodSad,
  IconFlame,
  IconEye,
  IconBolt,
  IconStar,
  IconMoodWink,
  IconMoodAngry,
  IconMoodConfuzed,
  IconCheck
} from "@tabler/icons-react";

export type ReactionConfig = {
  name: string;
  icon: React.ComponentType<any>;
  emoji: string;
  label: string;
  color?: string;
};

export const AVAILABLE_REACTIONS: ReactionConfig[] = [
  { name: 'thumbs_up', icon: IconThumbUp, emoji: '👍', label: 'Thumbs Up', color: 'blue' },
  { name: 'heart', icon: IconHeart, emoji: '❤️', label: 'Love', color: 'red' },
  { name: 'laugh', icon: IconMoodSmileReaction, emoji: '😄', label: 'Laugh', color: 'yellow' },
  { name: 'sad', icon: IconMoodSad, emoji: '😢', label: 'Sad', color: 'blue' },
  { name: 'fire', icon: IconFlame, emoji: '🔥', label: 'Fire', color: 'orange' },
  { name: 'eyes', icon: IconEye, emoji: '👀', label: 'Eyes', color: 'gray' },
  { name: 'lightning', icon: IconBolt, emoji: '⚡', label: 'Lightning', color: 'yellow' },
  { name: 'star', icon: IconStar, emoji: '⭐', label: 'Star', color: 'yellow' },
  { name: 'crazy', icon: IconMoodWink, emoji: '🤪', label: 'Wacky', color: 'purple' },
  { name: 'angry', icon: IconMoodAngry, emoji: '😡', label: 'Angry', color: 'red' },
  { name: 'confused', icon: IconMoodConfuzed, emoji: '😕', label: 'Confused', color: 'gray' },
  { name: 'check', icon: IconCheck, emoji: '✅', label: 'Check', color: 'green' },
];

// Toggle between emoji and icon display
export const USE_EMOJI_DISPLAY = true;

export const getReactionByName = (name: string): ReactionConfig | undefined =>
  AVAILABLE_REACTIONS.find(r => r.name === name);

export const getReactionDisplay = (name: string, useIcons = !USE_EMOJI_DISPLAY) => {
  const reaction = getReactionByName(name);
  if (!reaction) return name;
  return useIcons ? reaction.icon : reaction.emoji;
};

export const getReactionNames = (): string[] =>
  AVAILABLE_REACTIONS.map(r => r.name);