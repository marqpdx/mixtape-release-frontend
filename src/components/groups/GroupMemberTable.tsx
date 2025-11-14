"use client";

import {
  Box,
  Button,
  Input,
  Table,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { IconArrowUp, IconArrowDown } from "@tabler/icons-react";

interface Member {
  id: number;
  username: string;
  role: string;
  status: string;
  date_joined: string;
}

interface GroupMembersTableProps {
  members: Member[];
  onSendMessage: (userId: number) => void;
}

const columnHelper = createColumnHelper<Member>();

export default function GroupMembersTable({
  members,
  onSendMessage,
}: GroupMembersTableProps) {
  // const [sorting, setSorting] = useState([]);
  // const [columnFilters, setColumnFilters] = useState([]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = [
    columnHelper.accessor("username", {
      header: "Username",
      cell: info => info.getValue(),
    }),
    columnHelper.accessor("role", {
      header: "Role",
      cell: info => info.getValue(),
    }),
    // columnHelper.accessor("status", {
    //   header: "Status",
    //   cell: info => info.getValue(),
    // }),
    columnHelper.accessor("date_joined", {
      header: "Date Joined",
      cell: info => info.getValue().slice(0, 10),
    }),
    columnHelper.accessor("id", {
      header: "User ID",
      cell: info => info.getValue(),
    }),
    columnHelper.display({
      id: "actions",
      header: () => "Actions",
      cell: ({ row }) => (
        <Button size="sm" onClick={() => onSendMessage(row.original.id)}>
          Send Message
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: members,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <VStack align="stretch" gap={4}>
      {/* Filters */}
      <HStack gap={4}>
        {table.getHeaderGroups()[0].headers.map(header =>
          header.column.getCanFilter() ? (
            <Input
              key={header.id}
              placeholder={`Filter ${header.column.id}`}
              value={(header.column.getFilterValue() ?? "") as string}
              onChange={e => header.column.setFilterValue(e.target.value)}
              size="sm"
            />
          ) : null
        )}
      </HStack>

      {/* Table */}
      <Table.Root variant="outline" size="md">
        <Table.Header>
          {table.getHeaderGroups().map(headerGroup => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <Table.ColumnHeader
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler?.()}
                  cursor={header.column.getCanSort() ? "pointer" : "default"}
                >
                  <HStack gap={1}>
                    <Text>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </Text>
                    {header.column.getIsSorted() === "asc" && (
                      <IconArrowUp size={14} stroke={1.5} />
                    )}
                    {header.column.getIsSorted() === "desc" && (
                      <IconArrowDown size={14} stroke={1.5} />
                    )}
                  </HStack>
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          ))}
        </Table.Header>

        <Table.Body>
          {table.getRowModel().rows.map(row => (
            <Table.Row key={row.id}>
              {row.getVisibleCells().map(cell => (
                <Table.Cell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {members.length === 0 && (
        <Text textAlign="center" mt={4}>
          No members found.
        </Text>
      )}
    </VStack>
  );
}
