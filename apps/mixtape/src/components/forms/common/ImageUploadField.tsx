// src/components/forms/common/ImageUploadField.tsx

import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Image,
  Progress,
  Button,
  Dialog
} from "@chakra-ui/react";
import { capitalizeFirstLetter } from "@utils/misc";
import { FieldErrors, FieldValues, Path, UseFormRegister, UseFormWatch } from "react-hook-form";
import { useEffect, useState } from "react";

// Make the interface generic while maintaining backward compatibility
interface DefaultImageFormControlProps<T extends FieldValues = FieldValues> {
  errors: FieldErrors<T>;
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
}

interface ImageUploadFieldProps<T extends FieldValues = FieldValues> extends DefaultImageFormControlProps<T> {
  pending: boolean;
  imageType: string;
  label?: string;
  imageUrl?: string; // Presigned URL for display (computed by backend)
  doHandleImageChange: (event: React.ChangeEvent<HTMLInputElement>, imgType: string) => Promise<void>;
}

// Make the component generic with more flexible constraints
export const ImageUploadField = <T extends FieldValues = FieldValues>({
  errors,
  register,
  pending,
  watch,
  label,
  imageType,
  imageUrl,
  doHandleImageChange
}: ImageUploadFieldProps<T>) => {
  void watch;
  const fieldName = `${imageType}_image_path` as Path<T>;
  const capLabel = capitalizeFirstLetter(imageType);
  const [fileName, setFileName] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // NEW: local preview URL (either existing backend URL or object URL for new file)
  const [previewSrc, setPreviewSrc] = useState<string | undefined>(imageUrl);

  // Keep preview in sync with server-provided imageUrl when props change
  useEffect(() => {
    setPreviewSrc(imageUrl);
  }, [imageUrl]);

  // optional: track & revoke object URLs to avoid leaks
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    setFileName(file?.name || "");
    setHasError(false);
    setIsLoaded(false);

    if (file) {
      // Immediate local preview before server round-trip
      const nextUrl = URL.createObjectURL(file);
      // Revoke previous object URL if any
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setObjectUrl(nextUrl);
      setPreviewSrc(nextUrl);
    }

    // Still let the caller upload + update *_image_path via setValue
    await doHandleImageChange(e, imageType);
  };

  // const thumbnailHeight = "120px";
  // const fallbackImage = "/placeholder.png";

  // const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   setFileName(file?.name || "");
  //   await doHandleImageChange(e, imageType);
  // };

  // Use the provided imageUrl (computed by backend) or fall back to watching form field
  // const image = imageUrl || (watch(fieldName) as string | undefined);
  const thumbnailHeight = "120px";
  const fallbackImage = "/placeholder.png";

  const image = previewSrc; // keep it simple if you rely on props only

  return (
    <Box mb={8} pt={4} width="100%">
      <Heading as="h5" size="sm" mb={1}>
        {label ?? `${capLabel} Image`}
      </Heading>

      <Flex direction={{ base: "column", md: "row" }} alignItems="flex-start" gap={6}>
        <Box p={4} borderRadius="md">
          <label htmlFor={`file-input-${imageType}`}>
            <Button bg={'gray.500'} color={'blue'} as="span" cursor="pointer">
              Browse...
            </Button>
          </label>

          <input
            id={`file-input-${imageType}`}
            type="file"
            style={{ display: "none" }}
            accept="image/jpg,image/jpeg,image/png,image/gif,image/webp"
            onChange={handleInputChange}
          />

          {pending && (
            <VStack mt={3}>
              <Text>Saving...</Text>
              <Progress.Root value={50} max={100} style={{ width: "86px", height: "10px" }}>
                <Progress.Track>
                  <Progress.Range style={{ backgroundColor: "#68D391", height: "100%" }} />
                </Progress.Track>
                <Progress.Label>50%</Progress.Label>
              </Progress.Root>
            </VStack>
          )}

          <input type="hidden" {...register(fieldName, { required: false })} />
        </Box>

        <VStack align="flex-start" gap={2}>
          {image && (
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Box
                  cursor="pointer"
                  overflow="hidden"
                  borderRadius="md"
                  height={thumbnailHeight}
                  transition="all 0.3s ease"
                >
                  <Image
                    src={hasError ? fallbackImage : image}
                    alt={`${capLabel} Thumbnail`}
                    height={thumbnailHeight}
                    objectFit="cover"
                    opacity={isLoaded ? 1 : 0}
                    transition="opacity 0.4s ease-in"
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setHasError(true)}
                  />
                </Box>
              </Dialog.Trigger>

              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content maxW="90vw" maxH="90vh">
                  <Dialog.CloseTrigger />
                  <Dialog.Body display="flex" justifyContent="center" alignItems="center" bg="gray.50" p={6}>
                    <Image
                      src={hasError ? fallbackImage : image}
                      alt={`${capLabel} Full Preview`}
                      maxH="80vh"
                      maxW="100%"
                      objectFit="contain"
                      borderRadius="lg"
                      onError={() => setHasError(true)}
                    />
                  </Dialog.Body>
                </Dialog.Content>
              </Dialog.Positioner>
            </Dialog.Root>
          )}
        </VStack>
      </Flex>

      <Text fontSize="sm" mt={2}>
        {fileName || "No file selected."}
      </Text>

      {errors[fieldName] && (
        <Text color="red.500" mt={2}>
          {`${errors[fieldName]?.message}`}
        </Text>
      )}
    </Box>
  );
};
