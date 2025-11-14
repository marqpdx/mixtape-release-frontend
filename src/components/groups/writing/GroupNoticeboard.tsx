import { Card, Flex, Heading, Button, VStack, Link, Text } from "@chakra-ui/react";
import { useNoticeboard } from "./useNoticeboard";
import { NoticeCard } from "@components/write/NoticeCard";


// / GroupLanding noticeboard integration
export function GroupNoticeboard({ group }: { group: any }) {
  const {
    items: noticeboard,
    loading: nbLoading,
    error: nbError,
    hasMore,
    loadMore
  } = useNoticeboard(group.slug);

  return (
    <Card.Root>
      <Card.Header>
        <Flex justify="space-between" align="center">
          <Heading size="md">Noticeboard</Heading>
          <Button variant="ghost" size="sm">
            <Link href={`/groups/${group.slug}/noticeboard`}>View all</Link>
          </Button>
        </Flex>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap={3}>
          {nbError && <Text color="red.500">Failed to load: {nbError}</Text>}

          {nbLoading && noticeboard.length === 0 && (
            <Text color="gray.500">Loading…</Text>
          )}

          {noticeboard.map((item) => (
            <NoticeCard key={item.id} item={item} groupSlug={group.slug} />
          ))}

          {hasMore && (
            <Button
              onClick={loadMore}
              variant="outline"
              size="sm"
              alignSelf="center"
              loading={nbLoading}
            >
              Load more
            </Button>
          )}

          {!nbLoading && noticeboard.length === 0 && !nbError && (
            <Text color="gray.500" textAlign="center" py={4}>
              No posts yet. Be the first to share something!
            </Text>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}