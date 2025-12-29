// packages/core/src/lib/toaster.ts
import { createToaster } from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "bottom-end",
  pauseOnPageIdle: true,
});
