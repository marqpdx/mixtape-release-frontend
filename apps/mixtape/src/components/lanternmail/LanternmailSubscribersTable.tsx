// apps/mixtape/src/components/lanternmail/LanternSubscribersTable.tsx

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Heading,
  Spinner,
  Text,
  Table,
  Button,
} from "@chakra-ui/react";
import { Avatar } from "@chakra-ui/react";
import { lanternmailApi } from "@mixtape/api/clients/lanternmail/lanternmailApi";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
  type HeaderGroup,
  type Row,
  type Cell,
} from "@tanstack/react-table";
import type { GroupSubscriberAggregated } from "@mixtape/core/types/lanternmailTypes";

interface LanternmailSubscribersTableProps {
  groupSlug: string;
  filterListId: number | null;
}

export default function LanternmailSubscribersTable({ groupSlug, filterListId }: LanternmailSubscribersTableProps) {
  const [subscribers, setSubscribers] = useState<GroupSubscriberAggregated[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  // Fetch subscribers on mount and when filters change
  const fetchSubscribers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await lanternmailApi.getAllGroupSubscribers(
        groupSlug,
        { list_id: filterListId }
      );
      setSubscribers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
      const message = error instanceof Error ? error.message : "Failed to load subscribers";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [groupSlug, filterListId]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleRemoveSubscriber = useCallback(async (email: string) => {
    if (!filterListId) {
      return;
    }
    const confirmed = window.confirm(`Remove ${email} from this list?`);
    if (!confirmed) {
      return;
    }
    try {
      setRemovingEmail(email);
      await lanternmailApi.removeListSubscriber(groupSlug, filterListId, email);
      await fetchSubscribers();
    } catch (error) {
      console.error("Failed to remove subscriber:", error);
      const message = error instanceof Error ? error.message : "Failed to remove subscriber";
      setError(message);
    } finally {
      setRemovingEmail(null);
    }
  }, [fetchSubscribers, filterListId, groupSlug]);

  const columns = useMemo<ColumnDef<GroupSubscriberAggregated, unknown>[]>(
    () => [
      {
        id: "avatar",
        accessorKey: "avatar",
        header: "",
        cell: ({ row }) => (
          <Avatar.Root size="md">
            <Avatar.Image
              alt={row.original.name}
              src={row.original.avatar || undefined}
            />
            <Avatar.Fallback>{row.original.name.charAt(0)}</Avatar.Fallback>
          </Avatar.Root>
        ),
        enableSorting: false,
      },
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        cell: (info) => info.getValue() || "-",
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
        cell: (info) => info.getValue(),
      },
      {
        id: "status",
        accessorKey: "overall_subscription_status",
        header: "Status",
        cell: (info) => {
          const status = info.getValue() as string;
          return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        },
      },
      {
        id: "subscribed",
        accessorKey: "subscribed_lists_count",
        header: "Subscribed",
        cell: (info) => `${info.getValue()} / ${info.row.original.total_lists}`,
      },
      {
        id: "invited",
        accessorKey: "latest_invited_at",
        header: "Last Invited",
        cell: (info) => {
          const value = info.getValue() as string | undefined;
          return value?.slice(0, 10) || "-";
        },
      },
      {
        id: "remove",
        header: "",
        cell: (info) => {
          const email = info.row.original.email;
          return (
            <Button
              size="sm"
              variant="outline"
              disabled={!filterListId || removingEmail === email}
              loading={removingEmail === email}
              onClick={() => handleRemoveSubscriber(email)}
            >
              Remove
            </Button>
          );
        },
        enableSorting: false,
      },
    ],
    [filterListId, removingEmail, handleRemoveSubscriber]
  );

  const table = useReactTable({
    data: subscribers,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} borderWidth={1} borderRadius="md" borderColor="red.200" bg="red.50">
        <Text color="red.600">{error}</Text>
      </Box>
    );
  }

  if (!subscribers.length) {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.500">No subscribers found.</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="md" mb={4}>
        {filterListId ? "Filtered Subscribers" : "All Subscribers"} ({subscribers.length})
      </Heading>
      <Table.Root variant="outline" size="md">
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup: HeaderGroup<GroupSubscriberAggregated>) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.ColumnHeader
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  cursor={header.column.getCanSort() ? "pointer" : "default"}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === "asc" && " 🔼"}
                  {header.column.getIsSorted() === "desc" && " 🔽"}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          ))}
        </Table.Header>

        <Table.Body>
          {table.getRowModel().rows.map((row: Row<GroupSubscriberAggregated>) => (
            <Table.Row key={row.id}>
              {row.getVisibleCells().map((cell: Cell<GroupSubscriberAggregated, unknown>) => (
                <Table.Cell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
