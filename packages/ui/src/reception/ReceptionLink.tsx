import { Link as ChakraLink } from "@chakra-ui/react";

/**
 * The subtle, consistent link every section Reception shows back to Main
 * Reception (decisions/writing-surface-adr §3, WR-5). Built once so future
 * section Receptions reuse the same placement/weight instead of each
 * re-inventing it. Deliberately low-contrast — it should never compete with
 * a section's own accent color or its Outer Rim.
 */
export interface ReceptionLinkProps {
  /** Route to the campus Main Reception, e.g. `/groups/{slug}/reception`. */
  href: string;
  label?: string;
}

export function ReceptionLink({ href, label = "Main Reception" }: ReceptionLinkProps) {
  return (
    <ChakraLink
      href={href}
      fontSize="xs"
      color="fg.muted"
      _hover={{ color: "fg.default", textDecoration: "underline" }}
    >
      ↩ {label}
    </ChakraLink>
  );
}
