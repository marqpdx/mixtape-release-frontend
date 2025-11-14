// src/components/groups/GroupAssetsWorkArea.tsx

"use client";

import { Box, Heading, Text, Button, HStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import GroupAssetUploadForm from "../forms/GroupAssetUploadForm";
import GroupAssetsTable from "./GroupAssetsTable";
import { GroupAsset } from "@components/groups/interfaces";
import AssetGrid from "@components/assets/AssetGrid";
import MotionWrapper from "@components/common/MotionWrapper";
import { motion } from "framer-motion";

export default function GroupAssetsWorkArea({
  group,
  setActiveSection,
}: {
  group: any;
  setActiveSection: (section: string) => void;
}) {
  const [assets, setAssets] = useState<GroupAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>("");
  const [assetUrls, setAssetUrls] = useState<{
    [assetId: string]: string;
  }>({});

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/groups/${group.id}/assets`);
      setAssets(res.data.results ?? res.data);
      console.log("[GroupAssetsWorkArea] Loaded assets:", res.data);
    } catch (err) {
      console.error("[GroupAssetsWorkArea] Error loading assets", err);
    } finally {
      setLoading(false);
    }
  };

  function smartFetchAssets(attempt = 1) {
    console.log(`[GroupAssetsWorkArea] 📡 Fetch attempt #${attempt}`);

    axiosInstance
      .get(`/api/groups/${group.id}/assets`)
      .then((res) => {
        console.log("[smartFetchAssets] response:", res.data);

        const newAssets = res.data.results ?? res.data;
        console.log("[GroupAssetsWorkArea] - [smartFetchAssets] new assets:", newAssets);
        setAssets((prev) => {
          const merged = [...prev];
          for (const newAsset of newAssets) {
            const index = merged.findIndex((a) => a.id === newAsset.id);
            if (index !== -1) {
              merged[index] = newAsset;
            } else {
              merged.push(newAsset);
            }
          }
          return merged;
        });

        const stillQueued = newAssets.some(
          (a: GroupAsset) => a.asset.upload_status === "queued"
        );

        console.log(
          "[smartFetchAssets] still queued?",
          stillQueued
        );

        if (stillQueued && attempt < 3) {
          const delay = attempt === 1 ? 2000 : 5000;
          console.log(
            `[smartFetchAssets] Waiting ${delay / 1000}s before next attempt...`
          );
          setTimeout(() => smartFetchAssets(attempt + 1), delay);
        }
      })
      .catch((error) => {
        console.error("[smartFetchAssets] error:", error);
      });
  }

  const fetchFolders = async () => {
    try {
      const res = await axiosInstance.get(
        `/api/groups/${group.id}/assets/folders`
      );
      setFolders(res.data);
    } catch (e) {
      console.error("Failed to load folders", e);
    }
  };

  useEffect(() => {
    fetchAssets();
    if (!group?.id) return;
    fetchFolders();
  }, []);

  useEffect(() => {
    console.log("[GroupAssetsWorkArea] Assets currently loaded:", assets);

    const completedAssets = assets.filter(
      (a) =>
        a.asset.upload_status === "completed" &&
        !assetUrls[a.id]
    );

    console.log(
      "[GroupAssetsWorkArea] Completed assets needing presign:",
      completedAssets
    );

    if (completedAssets.length === 0) return;

    const fetchPresignedUrls = async () => {
      const urlMap: { [id: string]: string } = {};

      for (const groupAsset of completedAssets) {
        try {
          const res = await axiosInstance.get(
            `/api/groups/group-asset/${groupAsset.id}/presign`
          );
          urlMap[groupAsset.id] = res.data.url;
        } catch (e) {
          console.error("Failed to get presign URL for asset", groupAsset.id, e);
        }
      }

      setAssetUrls((prev) => ({ ...prev, ...urlMap }));
    };

    fetchPresignedUrls();
  }, [assets, assetUrls]);



  const visibleFolders = folders
  .filter((f) => {
    if (!currentFolder) {
      // Top-level folders only
      return !f.slice(0, f.length - 1).includes("/");
    }
    return f.startsWith(currentFolder) &&
      f !== currentFolder &&
      f.replace(currentFolder, "").split("/").length === 2;
  });



  return (
    <Box>
      <Heading size="md" mb={4}>
        Group Assets :)
      </Heading>

      <Button size="sm" mb={4} onClick={() => setShowUpload(!showUpload)}>
        {showUpload ? "Hide Upload Form" : "Upload New Asset"}
      </Button>

      {showUpload && (
        <GroupAssetUploadForm
          currentFolder={currentFolder}
          groupId={group.id}
          folders={folders}
          fetchFolders={fetchFolders}
          onUploadSuccess={() => {
            setTimeout(() => {
              console.log("[smartFetchAssets] going throug", )
              smartFetchAssets();
            }, 1000);
          }}
        />
      )}


{/* Breadcrumb */}
<HStack mb={4}>
  {currentFolder ? (
    <>
      <Box
        cursor="pointer"
        onClick={() => setCurrentFolder("")}
        fontWeight="bold"
      >
        Root
      </Box>
      {currentFolder.split("/").filter(Boolean).map((part, index, arr) => {
        const path = arr.slice(0, index + 1).join("/") + "/";
        return (
          <HStack key={path} gap={1}>
            <Text>/</Text>
            <Box
              cursor="pointer"
              onClick={() => setCurrentFolder(path)}
              fontWeight={
                path === currentFolder ? "bold" : "normal"
              }
            >
              {part}
            </Box>
          </HStack>
        );
      })}
    </>
  ) : (
    <Box fontWeight="bold">Root</Box>
  )}
</HStack>





{/* Folders */}
<Box mb={4}>
  {visibleFolders.map((folder) => (
    <Box
      key={folder}
      px={3}
      py={2}
      borderRadius="md"
      cursor="pointer"
      bg={currentFolder === folder ? "blue.100" : "transparent"}
      _hover={{ bg: "gray.100" }}
      onClick={() => setCurrentFolder(folder)}
    >
      {folder}
    </Box>
  ))}

  {visibleFolders.length === 0 && (
    <Text color="gray.500">No subfolders.</Text>
  )}
</Box>




      {assets.some(
        (a) =>
          a.asset.file_type.startsWith("image/") ||
          a.asset.file_type.startsWith("video/")
      ) ? (
        <MotionWrapper>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box minH="280px">
              {/* <AssetGrid
                assets={assets.filter(
                  (a) => a.asset.folder_path === currentFolder
                )}
                assetUrls={assetUrls}
              /> */}

              <AssetGrid
                assets={assets.filter((a) => {
                  const folder = a.asset.folder_path || "";
                  return currentFolder ? folder === currentFolder : !folder;
                })}
                assetUrls={assetUrls}
              />
            </Box>
          </motion.div>
        </MotionWrapper>
      ) : (
        <GroupAssetsTable assets={assets} loading={loading} />
      )}
    </Box>
  );
}
