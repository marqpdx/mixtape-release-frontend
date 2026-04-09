// apps/mixtape/src/app/(authenticated)/aperture/page.tsx

import { Box } from "@chakra-ui/react";
import WorkTable from "@components/initiatives/WorkTable";

export default function AperturePage() {
  return (
    <Box h="100%" display="flex" flexDirection="column" minH="0">
      <WorkTable />
    </Box>
  );
}
