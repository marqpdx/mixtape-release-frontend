// // src/theme/recipes/heading.recipe.ts

import { chakra, defineRecipe } from "@chakra-ui/react";
import { sharedHeadingConfig } from "./heading.shared";

export const headingFrontRecipe = defineRecipe({
  ...sharedHeadingConfig,
  base: {
    ...sharedHeadingConfig.base,
    fontFamily: "heading",
    fontWeight: "500",
  },
});

export const HeadingFront = chakra("h2", headingFrontRecipe);
