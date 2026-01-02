// // /src/components/forms/common/FileUploadField.tsx

"use client";

import {
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
  Icon,
  Button,
} from "@chakra-ui/react";
import { FieldErrors, FieldValues, UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { IconFile } from "@tabler/icons-react";
import Progress from "@components/common/Progress";

interface FileUploadFieldProps {
  errors: FieldErrors<FieldValues>;
  register: UseFormRegister<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  pending: boolean;
  fieldName: string;
  label?: string;
  allowedFileTypes?: string[];
  doHandleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  setValue: UseFormSetValue<FieldValues>;
}

export const FileUploadField = forwardRef<
  { clearFileInput: () => void },
  FileUploadFieldProps
>((props, ref) => {
  const {
    errors,
    register,
    pending,
    watch,
    setValue,
    fieldName,
    label,
    allowedFileTypes,
    doHandleFileChange,
  } = props;

  const { ref: registerRef, onChange: registerOnChange, ...registerProps } =
    register(fieldName);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number | null>(null);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileName(file?.name || "");
    setFileSize(file?.size || null);
    await doHandleFileChange(e);
    setValue(fieldName, e.target.files);
  };

  const clearFileInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setFileName("");
    setFileSize(null);
    setValue(fieldName, undefined);
  };

  useImperativeHandle(ref, () => ({
    clearFileInput,
  }));

  const uploadedFile = watch(fieldName) as FileList | undefined;
  const uploadedFilePath = uploadedFile?.[0]?.name;

  return (
    <Box mb={8} pt={4} width="100%">
      <Heading as="h5" size="sm" mb={1}>
        {label || "Upload File"}
      </Heading>

      <Flex direction="column" gap={3}>
        <Box>
          <label htmlFor={`file-input-${fieldName}`}>
            <Button as="span" cursor="pointer">
              Browse...
            </Button>
          </label>

          <input
            ref={(node) => {
              registerRef(node);
              inputRef.current = node;
            }}
            id={`file-input-${fieldName}`}
            type="file"
            accept={allowedFileTypes?.join(",")}
            style={{ display: "none" }}
            {...registerProps}
            onChange={async (event) => {
              registerOnChange?.(event);
              await handleInputChange(event);
            }}
          />

          {pending && (
            <VStack mt={3}>
              <Text>Uploading...</Text>
              <Progress value={37} size="sm" w="180px" label="Saving your file..." />
            </VStack>
          )}
        </Box>

        {uploadedFilePath && (
          <HStack gap={2}>
            <Icon as={IconFile} boxSize={5} color="gray.600" />
            <Text fontSize="sm" truncate>
              {uploadedFilePath} {fileSize && `(${(fileSize / 1024).toFixed(1)} KB)`}
            </Text>
          </HStack>
        )}

        {!uploadedFilePath && (
          <Text fontSize="sm" color="gray.500">
            {fileName || "No file selected."}
          </Text>
        )}

        {errors[fieldName] && (
          <Text color="red.500" mt={2}>
            {`${errors[fieldName]?.message}`}
          </Text>
        )}
      </Flex>
    </Box>
  );
});

FileUploadField.displayName = "FileUploadField";
