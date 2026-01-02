"use client"

import { IconButton } from "@chakra-ui/react"
import { forwardRef } from "react"
import type { ComponentProps } from "react"

type CloseButtonProps = Omit<ComponentProps<typeof IconButton>, "aria-label"> & {
  size?: "sm" | "md" | "lg"
}

export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  function CloseButton(props, ref) {
    return (
      <IconButton variant="ghost" aria-label="Close" ref={ref} {...props}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </IconButton>
    )
  }
)
