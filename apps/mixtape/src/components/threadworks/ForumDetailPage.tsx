"use client"

import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Button,
  VStack,
  Text,
  HStack,
  Badge,
  Flex,
  Spacer,
  Input,
  Textarea,
  useDisclosure,
  Alert,
  Spinner,
  Center,
  Field
} from "@chakra-ui/react";
import { Divider } from "@components/common/Divider";
import AdminModal from "@components/admin/AdminModal";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { toaster } from "@mixtape/core/lib/toaster";
import {
  IconMessageCircle,
  IconClock,
  IconUser,
  IconPlus,
  IconPin,
  IconLock,
  IconSearch,
  IconChevronDown,
  IconChevronUp
} from "@tabler/icons-react";
import ConversationCard from "./ConversationCard";

// -----------------------------
// Types matching backend + posts
// -----------------------------

interface Forum {
  id: string;
  name: string;
  description?: string;
  slug: string;
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
  parent?: string | null; // For threaded replies
}

interface Topic {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  last_posted_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  author: User;
  post_count: number;
  posts?: Post[]; // Add posts array
  last_post?: {
    author: User;
    created_at: string;
  };
}

interface CreateTopicData {
  title: string;
  first_post_content: string;  // Changed from 'content' to match backend
}

// -----------------------------
// API Functions
// -----------------------------

// -----------------------------
// API Functions
// -----------------------------

const fetchForum = async (forumSlug: string): Promise<Forum> => {
  const response = await axiosInstance.get(`/api/threadworks/${forumSlug}`);
  return response.data;
};

const fetchTopics = async (forumSlug: string): Promise<Topic[]> => {
  const response = await axiosInstance.get(`/api/threadworks/${forumSlug}/topics`);
  const topics = response.data.results || response.data;

  // Fetch posts for each topic
  const topicsWithPosts = await Promise.all(
    topics.map(async (topic: Topic) => {
      try {
        const postsResponse = await axiosInstance.get(`/api/threadworks/${forumSlug}/topics/${topic.slug}/posts`);
        const posts = postsResponse.data.results || postsResponse.data;
        return { ...topic, posts };
      } catch (error) {
        console.error(`Failed to fetch posts for topic ${topic.slug}:`, error);
        return { ...topic, posts: [] };
      }
    })
  );

  return topicsWithPosts;
};

const createTopic = async (forumSlug: string, topicData: CreateTopicData): Promise<Topic> => {
  const response = await axiosInstance.post(`/api/threadworks/${forumSlug}/topics`, topicData);
  return response.data;
};

// -----------------------------
// Helper Functions
// -----------------------------

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  return date.toLocaleDateString();
};

const getDisplayName = (user: User): string => {
  if (user.name) return user.name;
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
  if (user.first_name) return user.first_name;
  return user.username || 'Unknown User';
};

const getTotalReplies = (posts: Post[]): number => {
  return posts.length - 1; // Subtract 1 for the main post
};

const getRecentParticipants = (posts: Post[], limit: number = 10): User[] => {
  const participantMap = new Map<string, { user: User; lastActivity: string }>();

  // Find the conversation starter (author of the first post)
  const conversationStarter = posts[0]?.author;

  posts.forEach(post => {
    const existing = participantMap.get(post.author.id);
    if (!existing || new Date(post.created_at) > new Date(existing.lastActivity)) {
      participantMap.set(post.author.id, {
        user: post.author,
        lastActivity: post.created_at
      });
    }
  });

  const allParticipants = Array.from(participantMap.values())
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    .map(p => p.user);

  // Put conversation starter first, then others
  const starterFirst = conversationStarter
    ? [conversationStarter, ...allParticipants.filter(p => p.id !== conversationStarter.id)]
    : allParticipants;

  return starterFirst.slice(0, limit);
};

// -----------------------------
// Components
// -----------------------------

const TopicCard = ({
  topic,
  onTopicClick
}: {
  topic: Topic;
  onTopicClick: (topic: Topic) => void;
}) => {
  return (
    <Box
      bg="white"
      borderWidth={1}
      borderColor="gray.200"
      borderRadius="xl"
      p={6}
      shadow="sm"
      _hover={{ shadow: "md", cursor: "pointer" }}
      transition="all 0.2s"
      onClick={() => onTopicClick(topic)}
    >
      <Flex align="start" justify="space-between">
        <Box flex={1}>
          <HStack gap={2} mb={2}>
            {topic.is_pinned && (
              <Badge colorScheme="blue" variant="subtle" size="sm">
                <IconPin size={12} style={{ marginRight: '4px' }} />
                Pinned
              </Badge>
            )}
            {topic.is_locked && (
              <Badge colorScheme="red" variant="subtle" size="sm">
                <IconLock size={12} style={{ marginRight: '4px' }} />
                Locked
              </Badge>
            )}
          </HStack>

          <Heading size="md" color="gray.800" mb={2} lineHeight="1.3">
            {topic.title}
          </Heading>

          <HStack gap={4} fontSize="sm" color="gray.500" mb={3}>
            <HStack gap={1}>
              <IconUser size={16} />
              <Text>{topic.author.name}</Text>
            </HStack>
            <HStack gap={1}>
              <IconClock size={16} />
              <Text>{formatTimeAgo(topic.created_at)}</Text>
            </HStack>
            <HStack gap={1}>
              <IconMessageCircle size={16} />
              <Text>{topic.post_count} {topic.post_count === 1 ? 'post' : 'posts'}</Text>
            </HStack>
          </HStack>

          {topic.last_post && (
            <Box bg="gray.50" p={3} borderRadius="md" fontSize="sm">
              <Text color="gray.600">
                Latest by <Text as="span" fontWeight="semibold">{topic.last_post.author.name}</Text>
                {' '}{formatTimeAgo(topic.last_post.created_at)}
              </Text>
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

const CreateTopicModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTopicData) => Promise<void>;
  isLoading: boolean;
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Both title and content are required");
      return;
    }

    try {
      await onSubmit({ title: title.trim(), first_post_content: content.trim() });
      setTitle("");
      setContent("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create topic");
    }
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    setError("");
    onClose();
  };

  return (
    <AdminModal
      title="Start New Conversation"
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
    >
      <VStack align="stretch" gap={6}>
        {error && (
          <Alert.Root status="error">
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        )}

        <Field.Root>
          <Field.Label>
            Topic Title
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="What would you like to discuss?"
            maxLength={200}
          />
          <Field.HelperText>Give your conversation a clear, descriptive title</Field.HelperText>
          <Field.ErrorText />
        </Field.Root>

        <Field.Root>
          <Field.Label>
            Your Message
            <Field.RequiredIndicator />
          </Field.Label>
          <Textarea
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            placeholder="Start the conversation..."
            minH="120px"
            resize="vertical"
          />
          <Field.HelperText>Share your thoughts, questions, or ideas to get the discussion started</Field.HelperText>
          <Field.ErrorText />
        </Field.Root>
      </VStack>
    </AdminModal>
  );
};

// -----------------------------
// Main Component
// -----------------------------

interface ForumDetailPageProps {
  forumSlug: string;
  onTopicSelect?: (topic: Topic) => void;
  onBack?: () => void;
}

const ForumDetailPage: React.FC<ForumDetailPageProps> = ({
  forumSlug,
  onTopicSelect,
  onBack
}) => {
  const [forum, setForum] = useState<Forum | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const { open, onOpen, onClose } = useDisclosure();

  // Load forum and topics on mount
  useEffect(() => {
    const loadData = async () => {
      console.log('ForumDetailPage loading data for slug:', forumSlug); // Debug log
      try {
        setLoading(true);
        setError("");

        console.log('Making API calls to:', `/api/threadworks/${forumSlug}`, `/api/threadworks/${forumSlug}/topics`); // Debug log

        const [forumData, topicsData] = await Promise.all([
          fetchForum(forumSlug),
          fetchTopics(forumSlug)
        ]);

        console.log('Forum data received:', forumData); // Debug log
        console.log('Topics data received:', topicsData); // Debug log

        setForum(forumData);
        setTopics(topicsData);
      } catch (err) {
        console.error('Failed to load forum data:', err);
        setError(err instanceof Error ? err.message : "Failed to load forum data");
        toaster.create({
          title: "Error",
          description: "Failed to load forum data.",
          type: "error",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (forumSlug) {
      loadData();
    }
  }, [forumSlug]);

  // Handle topic creation
  const handleCreateTopic = async (topicData: CreateTopicData) => {
    setCreateLoading(true);
    try {
      const newTopic = await createTopic(forumSlug, topicData);
      console.log('New topic created:', newTopic); // Debug log to see the structure

      // Now that backend returns full topic data, we can add it directly
      setTopics(prev => [newTopic, ...prev]);

      toaster.create({
        title: "Success",
        description: "Topic created successfully!",
        type: "success",
        duration: 3000,
      });
    } catch (err) {
      console.error('Failed to create topic:', err);
      toaster.create({
        title: "Error",
        description: "Failed to create topic.",
        type: "error",
        duration: 5000,
      });
      throw err; // Let the modal handle the error display
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle topic selection (if still needed for future features)
  const handleTopicClick = (topic: Topic) => {
    if (onTopicSelect) {
      onTopicSelect(topic);
    }
  };


  // Handle reply to conversation

  // Handle reply to conversation (update this in ForumDetailPage)
  const handleReply = async (topicSlug: string, content: string, parentPostId?: string) => {
    try {
      const postData = {
        content,
        ...(parentPostId && { parent: parentPostId }) // Add parent if replying to specific post
      };

      const response = await axiosInstance.post(`/api/threadworks/${forumSlug}/topics/${topicSlug}/posts`, postData);

      // Refresh the topics to get updated posts
      const updatedTopics = await fetchTopics(forumSlug);
      setTopics(updatedTopics);

      return response.data;
    } catch (error) {
      console.error('Failed to post reply:', error);
      throw error;
    }
  };


  // const handleReply = async (topicSlug: string, content: string) => {
  //   try {
  //     const response = await axiosInstance.post(`/api/threadworks/${forumSlug}/topics/${topicSlug}/posts`, {
  //       content
  //     });

  //     // Refresh the topics to get updated posts
  //     const updatedTopics = await fetchTopics(forumSlug);
  //     setTopics(updatedTopics);

  //     return response.data;
  //   } catch (error) {
  //     console.error('Failed to post reply:', error);
  //     throw error;
  //   }
  // };

  // Loading state
  if (loading) {
    return (
      <Box bg="gray.50" minH="100vh">
        <Center py={20}>
          <VStack gap={4}>
            <Spinner size="lg" color="blue.500" />
            <Text color="gray.600">Loading forum...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  // Error state
  if (error || !forum) {
    return (
      <Box bg="gray.50" minH="100vh">
        <Box maxW="4xl" mx="auto" py={8} px={6}>
          <Alert.Root status="error">
            <Alert.Description>
              {error || "Forum not found"}
            </Alert.Description>
          </Alert.Root>
        </Box>
      </Box>
    );
  }

  // Group topics: pinned first, then by last activity
  const sortedTopics = [...topics].sort((a, b) => {
    // Pinned topics first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;

    // Then by last activity
    return new Date(b.last_posted_at).getTime() - new Date(a.last_posted_at).getTime();
  });

  return (
    <Box bg="gray.50" minH="100vh">
      <Box maxW="4xl" mx="auto" py={8} px={6}>
        {/* Forum Header */}
        <Box mb={8}>
          <Flex justify="space-between" align="center" mb={4}>
            <Box>
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  mb={2}
                >
                  ← Back to Forums
                </Button>
              )}
              <Heading size="xl" color="gray.800">
                {forum.name}
              </Heading>
            </Box>

            <Button
              size="lg"
              onClick={onOpen}
            >
              <IconPlus size={20} />
              Start New Conversation
            </Button>
          </Flex>

          {forum.description && (
            <Text color="gray.600" fontSize="lg" lineHeight="1.6" mb={4}>
              {forum.description}
            </Text>
          )}
          <HStack gap={4}>
            <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="full">
              {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
            </Badge>
            <Badge colorScheme="green" variant="subtle" px={3} py={1} borderRadius="full">
              Active
            </Badge>
          </HStack>
        </Box>

        <Box mb={6}>
          <Divider />
        </Box>

        {/* Remove the old Create New Topic Button section */}

        {/* Topics as Conversation Cards */}
        {topics.length === 0 ? (
          <Center py={12}>
            <VStack gap={4}>
              <IconMessageCircle size={48} style={{ color: 'var(--chakra-colors-gray-400)' }} />
              <Text color="gray.500" fontSize="lg">No conversations yet</Text>
              <Text color="gray.400" textAlign="center">
                Be the first to start a conversation in this forum
              </Text>
              <Button onClick={onOpen}>
                Start First Conversation
              </Button>
            </VStack>
          </Center>
        ) : (
          <VStack align="stretch" gap={6}>
            {sortedTopics.map(topic => (
              <ConversationCard
                key={topic.id}
                topic={topic}
                onReply={handleReply}
              />
            ))}
          </VStack>
        )}

        {/* Create Topic Modal */}
        <CreateTopicModal
          isOpen={open}
          onClose={onClose}
          onSubmit={handleCreateTopic}
          isLoading={createLoading}
        />
      </Box>
    </Box>
  );
};

export default ForumDetailPage;



// "use client"

// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Heading,
//   Button,
//   VStack,
//   Text,
//   HStack,
//   Badge,
//   Flex,
//   Spacer,
//   Input,
//   Textarea,
//   useDisclosure,
//   Alert,
//   Spinner,
//   Center,
//   Field
// } from "@chakra-ui/react";
// import { Divider } from "@components/common/Divider";
// import AdminModal from "@components/admin/AdminModal";
// import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
// import { createStandaloneToast } from "@chakra-ui/toast";

// const { toast } = createStandaloneToast();
// import {
//   IconMessageCircle,
//   IconClock,
//   IconUser,
//   IconPlus,
//   IconPin,
//   IconLock
// } from "@tabler/icons-react";

// // -----------------------------
// // Types matching backend
// // -----------------------------

// interface Forum {
//   id: string;
//   name: string;
//   description?: string;
//   slug: string;
// }

// interface User {
//   id: string;
//   name: string;
//   email?: string;
//   avatar_url?: string;
// }

// interface Topic {
//   id: string;
//   title: string;
//   slug: string;
//   created_at: string;
//   last_posted_at: string;
//   is_pinned: boolean;
//   is_locked: boolean;
//   author: User;
//   post_count: number;
//   last_post?: {
//     author: User;
//     created_at: string;
//   };
// }

// interface CreateTopicData {
//   title: string;
//   first_post_content: string;  // Changed from 'content' to match backend
// }

// // -----------------------------
// // API Functions
// // -----------------------------

// // -----------------------------
// // API Functions
// // -----------------------------

// const fetchForum = async (forumSlug: string): Promise<Forum> => {
//   const response = await axiosInstance.get(`/api/threadworks/${forumSlug}`);
//   return response.data;
// };

// const fetchTopics = async (forumSlug: string): Promise<Topic[]> => {
//   const response = await axiosInstance.get(`/api/threadworks/${forumSlug}/topics`);
//   // Handle paginated response - extract results array
//   return response.data.results || response.data;
// };

// const createTopic = async (forumSlug: string, topicData: CreateTopicData): Promise<Topic> => {
//   const response = await axiosInstance.post(`/api/threadworks/${forumSlug}/topics`, topicData);
//   return response.data;
// };

// // -----------------------------
// // Helper Functions
// // -----------------------------

// const formatTimeAgo = (dateString: string) => {
//   const date = new Date(dateString);
//   const now = new Date();
//   const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

//   if (diffInHours < 1) return "Just now";
//   if (diffInHours < 24) return `${diffInHours}h ago`;
//   if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
//   return date.toLocaleDateString();
// };

// // -----------------------------
// // Components
// // -----------------------------

// const TopicCard = ({
//   topic,
//   onTopicClick
// }: {
//   topic: Topic;
//   onTopicClick: (topic: Topic) => void;
// }) => {
//   return (
//     <Box
//       bg="white"
//       borderWidth={1}
//       borderColor="gray.200"
//       borderRadius="xl"
//       p={6}
//       shadow="sm"
//       _hover={{ shadow: "md", cursor: "pointer" }}
//       transition="all 0.2s"
//       onClick={() => onTopicClick(topic)}
//     >
//       <Flex align="start" justify="space-between">
//         <Box flex={1}>
//           <HStack gap={2} mb={2}>
//             {topic.is_pinned && (
//               <Badge colorScheme="blue" variant="subtle" size="sm">
//                 <IconPin size={12} style={{ marginRight: '4px' }} />
//                 Pinned
//               </Badge>
//             )}
//             {topic.is_locked && (
//               <Badge colorScheme="red" variant="subtle" size="sm">
//                 <IconLock size={12} style={{ marginRight: '4px' }} />
//                 Locked
//               </Badge>
//             )}
//           </HStack>

//           <Heading size="md" color="gray.800" mb={2} lineHeight="1.3">
//             {topic.title}
//           </Heading>

//           <HStack gap={4} fontSize="sm" color="gray.500" mb={3}>
//             <HStack gap={1}>
//               <IconUser size={16} />
//               <Text>{topic.author.name}</Text>
//             </HStack>
//             <HStack gap={1}>
//               <IconClock size={16} />
//               <Text>{formatTimeAgo(topic.created_at)}</Text>
//             </HStack>
//             <HStack gap={1}>
//               <IconMessageCircle size={16} />
//               <Text>{topic.post_count} {topic.post_count === 1 ? 'post' : 'posts'}</Text>
//             </HStack>
//           </HStack>

//           {topic.last_post && (
//             <Box bg="gray.50" p={3} borderRadius="md" fontSize="sm">
//               <Text color="gray.600">
//                 Latest by <Text as="span" fontWeight="semibold">{topic.last_post.author.name}</Text>
//                 {' '}{formatTimeAgo(topic.last_post.created_at)}
//               </Text>
//             </Box>
//           )}
//         </Box>
//       </Flex>
//     </Box>
//   );
// };

// const CreateTopicModal = ({
//   isOpen,
//   onClose,
//   onSubmit,
//   isLoading
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   onSubmit: (data: CreateTopicData) => Promise<void>;
//   isLoading: boolean;
// }) => {
//   const [title, setTitle] = useState("");
//   const [content, setContent] = useState("");
//   const [error, setError] = useState("");

//   const handleSubmit = async () => {
//     setError("");

//     if (!title.trim() || !content.trim()) {
//       setError("Both title and content are required");
//       return;
//     }

//     try {
//       await onSubmit({ title: title.trim(), first_post_content: content.trim() });
//       setTitle("");
//       setContent("");
//       onClose();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to create topic");
//     }
//   };

//   const handleClose = () => {
//     setTitle("");
//     setContent("");
//     setError("");
//     onClose();
//   };

//   return (
//     <AdminModal
//       title="Start New Conversation"
//       isOpen={isOpen}
//       onClose={handleClose}
//       onSubmit={handleSubmit}
//       isSubmitting={isLoading}
//     >
//       <VStack align="stretch" gap={6}>
//         {error && (
//           <Alert.Root status="error">
//             <Alert.Description>{error}</Alert.Description>
//           </Alert.Root>
//         )}

//         <Field.Root>
//           <Field.Label>
//             Topic Title
//             <Field.RequiredIndicator />
//           </Field.Label>
//           <Input
//             value={title}
//             onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
//             placeholder="What would you like to discuss?"
//             maxLength={200}
//           />
//           <Field.HelperText>Give your conversation a clear, descriptive title</Field.HelperText>
//           <Field.ErrorText />
//         </Field.Root>

//         <Field.Root>
//           <Field.Label>
//             Your Message
//             <Field.RequiredIndicator />
//           </Field.Label>
//           <Textarea
//             value={content}
//             onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
//             placeholder="Start the conversation..."
//             minH="120px"
//             resize="vertical"
//           />
//           <Field.HelperText>Share your thoughts, questions, or ideas to get the discussion started</Field.HelperText>
//           <Field.ErrorText />
//         </Field.Root>
//       </VStack>
//     </AdminModal>
//   );
// };

// // -----------------------------
// // Main Component
// // -----------------------------

// interface ForumDetailPageProps {
//   forumSlug: string;
//   onTopicSelect?: (topic: Topic) => void;
//   onBack?: () => void;
// }

// const ForumDetailPage: React.FC<ForumDetailPageProps> = ({
//   forumSlug,
//   onTopicSelect,
//   onBack
// }) => {
//   const [forum, setForum] = useState<Forum | null>(null);
//   const [topics, setTopics] = useState<Topic[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [createLoading, setCreateLoading] = useState(false);

//   const { open, onOpen, onClose } = useDisclosure();

//   // Load forum and topics on mount
//   useEffect(() => {
//     const loadData = async () => {
//       console.log('ForumDetailPage loading data for slug:', forumSlug); // Debug log
//       try {
//         setLoading(true);
//         setError("");

//         console.log('Making API calls to:', `/api/threadworks/${forumSlug}`, `/api/threadworks/${forumSlug}/topics`); // Debug log

//         const [forumData, topicsData] = await Promise.all([
//           fetchForum(forumSlug),
//           fetchTopics(forumSlug)
//         ]);

//         console.log('Forum data received:', forumData); // Debug log
//         console.log('Topics data received:', topicsData); // Debug log

//         setForum(forumData);
//         setTopics(topicsData);
//       } catch (err) {
//         console.error('Failed to load forum data:', err);
//         setError(err instanceof Error ? err.message : "Failed to load forum data");
//         toast({
//           title: "Error",
//           description: "Failed to load forum data.",
//           status: "error",
//           duration: 5000,
//           isClosable: true,
//         });
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (forumSlug) {
//       loadData();
//     }
//   }, [forumSlug]);

//   // Handle topic creation
//   const handleCreateTopic = async (topicData: CreateTopicData) => {
//     setCreateLoading(true);
//     try {
//       const newTopic = await createTopic(forumSlug, topicData);
//       console.log('New topic created:', newTopic); // Debug log to see the structure

//       // Now that backend returns full topic data, we can add it directly
//       setTopics(prev => [newTopic, ...prev]);

//       toast({
//         title: "Success",
//         description: "Topic created successfully!",
//         status: "success",
//         duration: 3000,
//         isClosable: true,
//       });
//     } catch (err) {
//       console.error('Failed to create topic:', err);
//       toast({
//         title: "Error",
//         description: "Failed to create topic.",
//         status: "error",
//         duration: 5000,
//         isClosable: true,
//       });
//       throw err; // Let the modal handle the error display
//     } finally {
//       setCreateLoading(false);
//     }
//   };

//   // Handle topic selection
//   const handleTopicClick = (topic: Topic) => {
//     if (onTopicSelect) {
//       onTopicSelect(topic);
//     } else {
//       // Default behavior - you might want to navigate to topic detail
//       console.log('Selected topic:', topic);
//     }
//   };

//   // Loading state
//   if (loading) {
//     return (
//       <Box bg="gray.50" minH="100vh">
//         <Center py={20}>
//           <VStack gap={4}>
//             <Spinner size="lg" color="blue.500" />
//             <Text color="gray.600">Loading forum...</Text>
//           </VStack>
//         </Center>
//       </Box>
//     );
//   }

//   // Error state
//   if (error || !forum) {
//     return (
//       <Box bg="gray.50" minH="100vh">
//         <Box maxW="4xl" mx="auto" py={8} px={6}>
//           <Alert.Root status="error">
//             <Alert.Description>
//               {error || "Forum not found"}
//             </Alert.Description>
//           </Alert.Root>
//         </Box>
//       </Box>
//     );
//   }

//   // Group topics: pinned first, then by last activity
//   const sortedTopics = [...topics].sort((a, b) => {
//     // Pinned topics first
//     if (a.is_pinned && !b.is_pinned) return -1;
//     if (!a.is_pinned && b.is_pinned) return 1;

//     // Then by last activity
//     return new Date(b.last_posted_at).getTime() - new Date(a.last_posted_at).getTime();
//   });

//   return (
//     <Box bg="gray.50" minH="100vh">
//       <Box maxW="4xl" mx="auto" py={8} px={6}>
//         {/* Forum Header */}
//         <Box mb={8}>
//           {onBack && (
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={onBack}
//               mb={4}
//             >
//               ← Back to Forums
//             </Button>
//           )}
//           <Heading size="xl" color="gray.800" mb={3}>
//             {forum.name}
//           </Heading>
//           {forum.description && (
//             <Text color="gray.600" fontSize="lg" lineHeight="1.6" mb={4}>
//               {forum.description}
//             </Text>
//           )}
//           <HStack gap={4}>
//             <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="full">
//               {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
//             </Badge>
//             <Badge colorScheme="green" variant="subtle" px={3} py={1} borderRadius="full">
//               Active
//             </Badge>
//           </HStack>
//         </Box>

//         <Box mb={6}>
//           <Divider />
//         </Box>

//         {/* Create New Topic Button */}
//         <Box mb={6}>
//           <Button
//             colorScheme="blue"
//             size="lg"
//             onClick={onOpen}
//           >
//             <IconPlus size={20} />
//             Start New Conversation
//           </Button>
//         </Box>

//         {/* Topics List */}
//         {topics.length === 0 ? (
//           <Center py={12}>
//             <VStack gap={4}>
//               <IconMessageCircle size={48} style={{ color: 'var(--chakra-colors-gray-400)' }} />
//               <Text color="gray.500" fontSize="lg">No conversations yet</Text>
//               <Text color="gray.400" textAlign="center">
//                 Be the first to start a conversation in this forum
//               </Text>
//               <Button colorScheme="blue" onClick={onOpen}>
//                 Start First Conversation
//               </Button>
//             </VStack>
//           </Center>
//         ) : (
//           <VStack align="stretch" gap={4}>
//             {sortedTopics.map(topic => (
//               <TopicCard
//                 key={topic.id}
//                 topic={topic}
//                 onTopicClick={handleTopicClick}
//               />
//             ))}
//           </VStack>
//         )}

//         {/* Create Topic Modal */}
//         <CreateTopicModal
//           isOpen={open}
//           onClose={onClose}
//           onSubmit={handleCreateTopic}
//           isLoading={createLoading}
//         />
//       </Box>
//     </Box>
//   );
// };

// export default ForumDetailPage;