import { Box, HStack } from "@chakra-ui/react";
import { SummaryReadinessPie, type ReadinessState, type SummaryFieldReadiness } from "./SummaryReadinessPie";

export type CraftDimension = "tags" | "category" | "summaries" | "series" | "relations";
export type CraftReadiness = Record<CraftDimension, ReadinessState> & {
  overall: string;
  ignored: string[];
  summary_fields: SummaryFieldReadiness;
};

const dimensions: CraftDimension[] = ["tags", "category", "summaries", "series", "relations"];
const colors: Record<ReadinessState, string> = {
  untouched: "orange.400",
  partial: "yellow.400",
  confirmed: "green.400",
  deferred: "gray.400",
};

export function CraftReadinessDots({ readiness }: { readiness?: CraftReadiness }) {
  if (!readiness) return null;
  return (
    <HStack className="crdo-dots" gap={1.5} aria-label="Shape readiness">
      {dimensions.map((dimension) => dimension === "summaries" && readiness.summary_fields ? (
        <SummaryReadinessPie key={dimension} states={readiness.summary_fields} size="8px" />
      ) : (
        <Box
          key={dimension}
          w="8px"
          h="8px"
          borderRadius="full"
          flexShrink={0}
          bg={colors[readiness[dimension]]}
          title={`${dimension}: ${readiness.ignored?.includes(dimension) ? "ignored" : readiness[dimension]}`}
        />
      ))}
    </HStack>
  );
}
