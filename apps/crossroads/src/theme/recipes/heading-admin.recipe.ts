// // src/theme/recipes/heading-front.recipe.ts

import { chakra, defineRecipe } from "@chakra-ui/react";
import { sharedHeadingConfig } from "./heading.shared";

export const headingAdminRecipe = defineRecipe({
  ...sharedHeadingConfig,
  base: {
    ...sharedHeadingConfig.base,
    fontFamily: "headingAdmin",
  },
  variants: {
    ...sharedHeadingConfig.variants,
    level: {
      h1: {
        fontSize: { base: "1.75rem", md: "2.25rem" },
      },
      h2: {
        fontSize: { base: "1.5rem", md: "1.75rem" },
      },
      h3: {
        fontSize: { base: "1.25rem", md: "1.5rem" },
      },
      h4: {
        fontSize: { base: "1rem", md: "1.125rem" },
      },
      h5: {
        fontSize: { base: "0.875rem", md: "1rem" },
      },
      h6: {
        fontSize: { base: "0.875rem", md: "0.875rem" },
      },
    },
  },
});

export const HeadingAdmin = chakra("h2", headingAdminRecipe);
