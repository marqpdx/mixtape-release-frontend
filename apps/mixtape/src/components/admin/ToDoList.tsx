// apps/mixtape/src/components/admin/ToDoList.tsx

"use client";

import { Button } from "@/theme/recipes/button.recipe";
import { VStack, Text, HStack, Badge, Box } from "@chakra-ui/react";
// import { Button } from "@theme/recipes/button.recipe";
import { AdminTodoItem } from "@mixtape/api/clients/admin/adminApi";

interface ToDoListProps {
  todos: AdminTodoItem[];
  onComplete: (id: number) => void;
}

export default function ToDoList({ todos, onComplete }: ToDoListProps) {
  if (todos.length === 0) {
    return <Text color="gray.500">No to-dos yet.</Text>;
  }

  const incomplete = todos.filter(todo => !todo.is_completed);
  const completed = todos.filter(todo => todo.is_completed);
  const ordered = [...incomplete, ...completed];

  return (
    <VStack align="stretch" gap={3}>
      {ordered.map((todo) => (
        <Box key={todo.id} p={3} borderRadius="md" bg="gray.50">
          <HStack justify="space-between" align="center">
            <VStack align="start" gap={1}>
              <Text
                fontWeight="semibold"
                textDecoration={todo.is_completed ? "line-through" : "none"}
              >
                {todo.title}
              </Text>
              <Badge colorScheme={todo.is_completed ? "green" : "orange"}>
                {todo.is_completed ? "Completed" : "Pending"}
              </Badge>
            </VStack>
            {!todo.is_completed && (
              <Button size="sm" onClick={() => onComplete(todo.id)}>
                Complete
              </Button>
            )}
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}
