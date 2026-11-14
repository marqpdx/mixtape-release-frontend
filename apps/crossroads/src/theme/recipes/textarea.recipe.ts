import { defineRecipe } from "@chakra-ui/react";
import { controlColors, inputRecipe } from "./input.recipe";

// Chakra supplies textarea padding, rows and resize behavior; reuse only the
// control colours/variants so inputs and multiline fields agree in every mode.
export const textareaRecipe = defineRecipe({
  base: controlColors,
  variants: { variant: inputRecipe.variants!.variant },
  defaultVariants: { variant: "outline" },
});
