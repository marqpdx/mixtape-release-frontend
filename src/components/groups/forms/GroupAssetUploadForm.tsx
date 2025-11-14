// src/components/groups/forms/GroupAssetUploadForm.tsx

"use client";

import {
  Box,
  VStack,
  Button,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import { createStandaloneToast } from "@chakra-ui/toast";
import AssetPrivacySelect from "@components/assets/AssetPrivacySelect";
// import FolderPathSelect from "@components/assets/FolderPathSelect";
import { FileUploadField } from "@components/forms/common/FileUploadField";
import AssetTypeSelect from "@components/assets/AssetTypeSelect";
import { useRef, useState } from "react";
import { Input } from "@theme/recipes/input.recipe";
import FolderPathAutocomplete from "@components/assets/FolderPathAutocomplete";

const privacyCollection = {
  items: [
    { value: "public", label: "Public" },
    { value: "partners", label: "Partners Only" },
    { value: "members", label: "Group Members Only" },
    { value: "admins", label: "Admins Only" },
  ],
};

export default function GroupAssetUploadForm({
  groupId,
  onUploadSuccess,
  folders,
  currentFolder,
  fetchFolders,
}: {
  groupId: string;
  onUploadSuccess: () => void;
  folders: string[];
  currentFolder?: string;
  fetchFolders: () => Promise<void>;
}) {

  const { control, register, handleSubmit, reset, setValue, watch,
    formState: { errors },
   } = useForm();

  const [search, setSearch] = useState(watch("folder_path") || "");

  const { toast } = createStandaloneToast();

  // ✅ Create a ref to hold the exposed clear function
  const fileUploadFieldRef = useRef<{ clearFileInput: () => void }>(null);

  const onSubmit = async (values: any) => {
    try {
      const file = values.asset_file?.[0];

      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", values.title || "");
      formData.append("description", values.description || "");
      formData.append("privacy", values.privacy || "members");
      formData.append("type", values.type || "document");
      if (values.folder_path) {
        formData.append("folder_path", values.folder_path);
      }

      console.log("in on submit formData", formData);

      await axiosInstance.post(
        `/api/groups/${groupId}/assets/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      await fetchFolders();

      toast({
        title: "Upload successful!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      reset();

      fileUploadFieldRef.current?.clearFileInput();

      onUploadSuccess();
    } catch (error) {
      console.error(error);
      toast({
        title: "Upload failed",
        description: "Something went wrong. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} mb={4}>
      <VStack align="stretch" gap={4}>

        <AssetTypeSelect
          register={register}
          value={watch("type")}
          onChange={(val) => setValue("type", val)}
        />

        <AssetPrivacySelect
          register={register}
          value={watch("privacy")}
          onChange={(val) => setValue("privacy", val)}
        />

        <Box>
          <label htmlFor="folder_path">Folder Path</label>

          <FolderPathAutocomplete
            folders={folders}
            // value={watch("folder_path") || ""}
            value={currentFolder || ""}
            onChange={(val) => {
              setSearch(val);
              setValue("folder_path", val, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </Box>

        <FileUploadField
          ref={fileUploadFieldRef}
          errors={errors}
          register={register}
          pending={false}
          watch={watch}
          setValue={setValue}
          fieldName="asset_file"
          label="Upload Asset File"
          allowedFileTypes={["image/*", "application/pdf", "video/*"]}
          doHandleFileChange={async () => {
            // No-op for now.
          }}
        />

        <Button type="submit" colorScheme="green">
          Upload Asset
        </Button>
      </VStack>
    </Box>
  );
}

