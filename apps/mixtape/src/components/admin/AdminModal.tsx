// src/components/admin/AdminModal.tsx

import {
  Dialog,
  Portal,
  CloseButton,
  Button,
} from "@chakra-ui/react";
import { ReactNode, ComponentProps, useMemo } from "react";

type ModalSize =
  | "xs" | "sm" | "md" | "lg" | "xl"
  | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl"
  | "full";

const SIZE_MAP: Record<Exclude<ModalSize, "full">, string> = {
  xs:  "20rem", // 320px
  sm:  "24rem", // 384px
  md:  "28rem", // 448px
  lg:  "32rem", // 512px
  xl:  "36rem", // 576px
  "2xl": "42rem", // 672px
  "3xl": "48rem", // 768px
  "4xl": "56rem", // 896px
  "5xl": "64rem", // 1024px
  "6xl": "72rem", // 1152px
  "7xl": "80rem", // 1280px
};

export default function AdminModal({
  title,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  children,
  submitText = "Save",
  size = "lg",
  maxH = "80vh",
  contentProps,
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  children: ReactNode;
  submitText?: string;
  size?: ModalSize;
  maxH?: string | number;
  contentProps?: ComponentProps<typeof Dialog.Content>;
}) {
  const resolvedMaxW = useMemo(() => {
    if (size === "full") return "96vw";
    return SIZE_MAP[size] ?? SIZE_MAP.lg;
  }, [size]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={({ open }: { open: boolean }) => !open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            // Mobile-first: near-full width on small screens, mapped size on md+
            maxW={{ base: "96vw", md: resolvedMaxW }}
            w="100%"
            maxH={maxH}
            overflowY="auto"
            p={2}
            rounded="2xl"
            bg="background.surface"
            {...contentProps} // allow caller to override if needed
          >
            <Dialog.Header mb={2}>
              <Dialog.Title fontSize="xl" fontWeight="bold">
                {title}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" position="absolute" top="4" right="4" />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>{children}</Dialog.Body>

            {(onSubmit || typeof onSubmit === "function") && (
              <Dialog.Footer justifyContent="space-between" mt="6">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={onSubmit} loading={isSubmitting}>
                  {submitText || "Save"}
                </Button>
              </Dialog.Footer>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
