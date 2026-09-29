import { Box } from "@chakra-ui/react";

export type SummaryFieldKey = "public_synopsis" | "linkedin_synopsis" | "internal_abstract";
export type ReadinessState = "untouched" | "partial" | "confirmed" | "deferred";
export type SummaryFieldReadiness = Record<SummaryFieldKey, ReadinessState>;

const fields: SummaryFieldKey[] = ["public_synopsis", "linkedin_synopsis", "internal_abstract"];

export function SummaryReadinessPie({ states, size = "10px" }: {
  states: SummaryFieldReadiness;
  size?: string;
}) {
  const ready = fields.every((field) => states[field] === "confirmed");
  return (
    <Box
      as="span"
      display="inline-block"
      w={size}
      h={size}
      borderRadius="full"
      flexShrink={0}
      bg={ready ? "green.400" : "orange.400"}
      title={`Public: ${states.public_synopsis}; LinkedIn: ${states.linkedin_synopsis}; Internal: ${states.internal_abstract}`}
      aria-label="Summary readiness by field"
      role="img"
    />
  );
}
