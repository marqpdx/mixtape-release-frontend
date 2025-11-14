// src/components/groups/GroupAssetsTable.tsx

"use client";

import {
  Table,
  Spinner,
  Text,
  Box,
} from "@chakra-ui/react";
import { GroupAsset } from "../interfaces";
import { Button } from "@theme/recipes/button.recipe";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";


export default function GroupAssetsTable({
  assets,
  loading,
}: {
  assets: GroupAsset[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (assets.length === 0) {
    return <Text color="gray.500">No assets uploaded yet.</Text>;
  }

  return (
    <Box overflowX="auto">
      <Table.Root striped>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Type</Table.ColumnHeader>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Folder</Table.ColumnHeader>
            <Table.ColumnHeader>Uploaded At</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {assets.map((groupAsset) => (
            <Table.Row key={groupAsset.id}>
              <Table.Cell>{groupAsset.asset.file_type}</Table.Cell>
              <Table.Cell>{groupAsset.asset.file_name}</Table.Cell>
              <Table.Cell>{groupAsset.asset.file_path || "(root)"}</Table.Cell>
              <Table.Cell>
                {new Date(groupAsset.asset.created).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell>
                <Button
                  onClick={async () => {
                    const res = await axiosInstance.get(
                      `/api/groups/group-asset/${groupAsset.id}/presign`
                    );
                    window.open(res.data.url, "_blank");
                  }}
                >
                  Download
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
