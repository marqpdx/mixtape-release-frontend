// src/threadworks/interfaces.ts

export interface Forum {
  id: string
  slug: string
  title: string
  description: string
  visibility: 'public' | 'members' | 'group'
  topic_count: number
  sponsor_type: string
  sponsor_id: string | number
  recent_participants: Array<{
    id: string
    username: string
    first_name: string
    last_name: string
    avatar_url: string
    last_activity: string
  }>
  created_at: string
  updated_at: string
}

interface User {
  id: string;
  name?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

interface Post {
  id: string;
  author: User;
  content: string;
  created_at: string;
  parent?: string | null;
  replies?: Post[];
}

export interface Topic {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  last_posted_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  author: User;
  post_count: number;
  posts?: Post[];
  last_post?: {
    author: User;
    created_at: string;
  };
}
