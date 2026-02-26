// apps/mixtape/src/components/emblems/EmblemPicker.tsx

// Supports core library + custom seed generation

"use client";
import { useEffect, useState, useRef } from "react";
import {
  Box, Button, SimpleGrid, VStack, HStack, Input as CInput,
  Text, Spinner, Center, Tabs, IconButton
} from "@chakra-ui/react";
import { IconRefresh } from "@tabler/icons-react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { EmblemDisplay } from "./EmblemDisplay";
import { EmblemInline } from "@mixtape/core/types/emblemTypes";
import { Beacon } from "@components/feedback/Beacon";


type EmblemFull = EmblemInline & {
  license?: string;
  reuse_policy?: string;
  attribution_text?: string;
  attribution_url?: string;
};

type EmblemType = {
  id: string;
  engine: string;
  style: string;
  category?: string;
  is_generator?: boolean;
  is_upload?: boolean;
  supports_fg?: boolean;
  supports_bg?: boolean;
  supports_initials?: boolean;
};

const getErrorMessage = (err: unknown): string => {
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return "Something went wrong.";
};
export function EmblemPicker({
  isOpen,
  onClose,
  onSelect,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emblemId: string) => Promise<void> | void;
  onReset?: () => Promise<void> | void;
}) {
  const pickerRef = useRef<HTMLDivElement>(null);

  const [mine, setMine] = useState<EmblemFull[] | null>(null);
  const [pub, setPub] = useState<EmblemFull[] | null>(null);
  const [types, setTypes] = useState<EmblemType[]>([]);
  const [tab, setTab] = useState<string>("public");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customInitials, setCustomInitials] = useState("");
  const [customSeed, setCustomSeed] = useState("");
  const [initialsColor, setInitialsColor] = useState("#2F855A");

  const fetchLists = async () => {
    setError(null);
    setLoading(true);
    try {
      const [a, b, c] = await Promise.all([
        axiosInstance.get("/api/identity/emblem-avatars/mine"),
        axiosInstance.get("/api/identity/emblem-avatars/public"),
        axiosInstance.get("/api/identity/emblem-avatar-types"),
      ]);
      setMine(a.data?.results ?? a.data);
      setPub(b.data?.results ?? b.data);
      setTypes(c.data?.results ?? c.data);
    } catch {
      setError("Unable to load emblems.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTab("abstract");
      setCustomSeed("");
      void fetchLists();

      // Smooth scroll into view
      setTimeout(() => {
        if (pickerRef.current) {
          pickerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 100);
    }
  }, [isOpen]);

  const handleSelectEmblem = async (emblemId: string) => {
    await onSelect(emblemId);
    onClose();
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);

      const form = new FormData();
      form.append("file", file);
      const up = await axiosInstance.post("/api/identity/emblem-image", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const image_path = up.data.path || up.data.url;

      const uploadType = types.find((t) => t.engine === "upload" && t.style === "image");
      if (!uploadType) throw new Error("Upload type not available.");

      const created = await axiosInstance.post("/api/identity/emblem-avatars", {
        type: uploadType.id,
        image_path,
        reuse_policy: "owner_only",
        license: "PRO",
      });

      await handleSelectEmblem(created.data.id);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateCustom = async () => {
    if (!customSeed.trim()) return;

    try {
      setGenerating(true);
      setError(null);

      // Find a generator type (prefer dicebear identicon)
      const genType = types.find((t) => t.engine === "dicebear" && t.style === "identicon")
        || types.find((t) => t.is_generator);

      if (!genType) throw new Error("No generator types available.");

      // Create emblem with custom seed (will auto-render via signal)
      const created = await axiosInstance.post("/api/identity/emblem-avatars", {
        type: genType.id,
        seed: customSeed.trim().toLowerCase(),
        reuse_policy: "owner_only",
        license: "PRO",
      });

      // Poll for rendering completion
      await pollUntilRendered(created.data.id);

      await handleSelectEmblem(created.data.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to generate emblem.");
    } finally {
      setGenerating(false);
    }
  };

  const pollUntilRendered = async (emblemId: string, maxAttempts = 30) => {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between checks

      const response = await axiosInstance.get(`/api/identity/emblem-avatars/${emblemId}`);
      if (response.data.size_96_url || response.data.size_96) return;
    }
    throw new Error("Rendering timeout - the emblem is still being generated. Please check 'Your library' tab in a moment.");
  };

  if (!isOpen) return null;

  return (
    <Box
      ref={pickerRef}
      p={4}
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      rounded="lg"
      shadow="lg"
      w="100%"
      maxH="600px"
      overflowY="auto"
      overflowX="hidden"
    >
      <HStack justify="space-between" mb={4}>
        <HStack gap={2}>
          <Text fontSize="lg" fontWeight="semibold">Choose emblem</Text>
          <Beacon
            beaconKey="emblems_v1"
            areaLabel="Emblems"
            position="inline"
            featureContext={
              "Emblems are curated from public-domain and permissively licensed sources, chosen for clarity at small sizes. We welcome feedback on missing visual categories, balance between abstract/person styles, and open-source libraries we should consider. Requests for proprietary art or custom logos are out of scope."
            }
          />
        </HStack>
        <HStack gap={2}>
          {onReset && (
            <Button size="sm" variant="outline" onClick={async () => { await onReset(); onClose(); }}>
              Reset
            </Button>
          )}
          <Button size="sm" onClick={onClose} variant="ghost">Close</Button>
        </HStack>
      </HStack>

      {loading ? (
        <Center py={20}><Spinner size="lg" /></Center>
      ) : error ? (
        <Center py={12}><Text color="red.600">{error}</Text></Center>
      ) : (
        <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value)}>
          <Tabs.List mb={4}>
            <Tabs.Trigger value="abstract">Abstract ({pub?.filter(e => e.type?.category === 'abstract' || !e.type?.category).length || 0})</Tabs.Trigger>
            <Tabs.Trigger value="person">Person ({pub?.filter(e => e.type?.category === 'person').length || 0})</Tabs.Trigger>
            <Tabs.Trigger value="mine">Your library ({mine?.length || 0})</Tabs.Trigger>
            <Tabs.Trigger value="generate">Generate</Tabs.Trigger>
            <Tabs.Trigger value="upload">Upload</Tabs.Trigger>
            <Tabs.Indicator />
          </Tabs.List>

          <Tabs.Content value="abstract">
            {(pub ?? []).filter(e => e.type?.category === 'abstract' || !e.type?.category).length === 0 ? (
              <Center py={12}>
                <Text color="gray.500">No abstract emblems available yet.</Text>
              </Center>
            ) : (
              <SimpleGrid columns={{ base: 4, md: 7, lg: 10 }} gap={3} minH="300px" py={4}>
                {(pub ?? []).filter(e => e.type?.category === 'abstract' || !e.type?.category).map((e) => (
                  <Box
                    key={e.id}
                    p={2}
                    border="2px solid"
                    borderColor="gray.200"
                    rounded="md"
                    onClick={() => handleSelectEmblem(e.id)}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ borderColor: "green.400", transform: "scale(1.1)" }}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    bg="white"
                    aspectRatio="1"
                    minH="70px"
                  >
                    <EmblemDisplay emblem={e} size={48} showLoading />
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Tabs.Content>

          <Tabs.Content value="person">
            {(pub ?? []).filter(e => e.type?.category === 'person').length === 0 ? (
              <Center py={12}>
                <Text color="gray.500">No person emblems available yet.</Text>
              </Center>
            ) : (
              <SimpleGrid columns={{ base: 4, md: 7, lg: 10 }} gap={3} minH="300px" py={4}>
                {(pub ?? []).filter(e => e.type?.category === 'person').map((e) => (
                  <Box
                    key={e.id}
                    p={2}
                    border="2px solid"
                    borderColor="gray.200"
                    rounded="md"
                    onClick={() => handleSelectEmblem(e.id)}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ borderColor: "green.400", transform: "scale(1.1)" }}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    bg="white"
                    aspectRatio="1"
                    minH="70px"
                  >
                    <EmblemDisplay emblem={e} size={48} showLoading />
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Tabs.Content>

          <Tabs.Content value="mine">
            {(mine ?? []).length === 0 ? (
              <Center py={12}>
                <Text color="gray.500">No emblems yet. Try generating or uploading one!</Text>
              </Center>
            ) : (
              <SimpleGrid columns={{ base: 5, md: 10, lg: 14 }} gap={2} minH="250px">
                {(mine ?? []).map((e) => (
                  <Box
                    key={e.id}
                    p={1}
                    border="2px solid"
                    borderColor="gray.200"
                    rounded="md"
                    onClick={() => handleSelectEmblem(e.id)}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ borderColor: "green.400", transform: "scale(1.1)" }}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    minH="50px"
                  >
                    <EmblemDisplay emblem={e} size={32} showLoading />
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Tabs.Content>


          <Tabs.Content value="initials">
            <VStack align="stretch" gap={3}>
              <Text fontSize="sm" color="gray.600">
                Create a custom initials emblem (1-3 characters).
              </Text>
              <HStack>
                <CInput
                  placeholder="e.g., ML, ABC, 42"
                  value={customInitials}
                  onChange={(e) => setCustomInitials(e.target.value.toUpperCase().slice(0, 3))}
                  maxLength={3}
                />
                <CInput
                  type="color"
                  value={initialsColor}
                  onChange={(e) => setInitialsColor(e.target.value)}
                  width="80px"
                />
              </HStack>
              <Button
                colorScheme="green"
                onClick={async () => {
                  if (!customInitials.trim()) return;

                  try {
                    setGenerating(true);
                    const initialsType = types.find((t) => t.engine === "initials" && t.style === "rounded");
                    if (!initialsType) throw new Error("Initials type not available.");

                    const created = await axiosInstance.post("/api/identity/emblem-avatars", {
                      type: initialsType.id,
                      seed: customInitials.toLowerCase(),
                      initials: customInitials,
                      fg: "#FFFFFF",
                      bg: initialsColor,
                      reuse_policy: "owner_only",
                      license: "PRO",
                    });

                    await pollUntilRendered(created.data.id);
                    await handleSelectEmblem(created.data.id);
                    setCustomInitials("");
                  } catch (err: unknown) {
                    setError(getErrorMessage(err) || "Failed to create initials emblem.");
                  } finally {
                    setGenerating(false);
                  }
                }}
                disabled={!customInitials.trim() || generating}
                loading={generating}
              >
                {generating ? "Creating..." : "Create initials emblem"}
              </Button>
            </VStack>
          </Tabs.Content>



          <Tabs.Content value="generate">
            <VStack align="stretch" gap={3}>
              <Text fontSize="sm" color="gray.600">
                Generate a unique emblem from any word or phrase.
                Each seed creates a different design.
              </Text>
              <HStack>
                <CInput
                  placeholder="e.g., dragon, moonlight, forest..."
                  value={customSeed}
                  onChange={(e) => setCustomSeed(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleGenerateCustom();
                  }}
                />
                <IconButton
                  aria-label="Random seed"
                  onClick={() => {
                    const seeds = ["dragon", "phoenix", "mountain", "river", "star", "moon"];
                    setCustomSeed(seeds[Math.floor(Math.random() * seeds.length)]);
                  }}
                >
                  <IconRefresh />
                </IconButton>
              </HStack>
              <Button
                colorScheme="green"
                onClick={handleGenerateCustom}
                disabled={!customSeed.trim() || generating}
                loading={generating}
              >
                {generating ? "Generating..." : "Generate emblem"}
              </Button>
              {generating && (
                <HStack>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="gray.600">
                    Creating and rendering your emblem...
                  </Text>
                </HStack>
              )}
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="upload">
            <VStack align="stretch" gap={3}>
              <Text fontSize="sm" color="gray.600">
                Upload an image to create a new emblem in your library.
              </Text>
              <CInput
                type="file"
                accept="image/*"
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  if (f) void handleUpload(f);
                }}
              />
              {uploading && <HStack><Spinner size="sm" /><Text>Uploading…</Text></HStack>}
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      )}
    </Box>
  );
}
