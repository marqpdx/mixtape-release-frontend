// src/components/shared/CrossroadsLogo.tsx

import { Box } from "@chakra-ui/react";

// Crossroads Logo Component - FIXED VERSION
interface CrossroadsLogoProps {
  size?: number;
  color?: string;
}

export function CrossroadsLogo({ size = 328, color = "white" }: CrossroadsLogoProps) {
  console.log("Rendering CrossroadsLogo with size:", size, "and color:", color);

  return (
    <Box
      className='logoWrapper'
      width={`${size}px`}
      height="60px"  // ✅ FIXED: Much smaller fixed height instead of size * 0.25
      overflow="visible"  // ✅ ADDED: Allow SVG to extend beyond container if needed
    >
      <svg
        width={size}  // ✅ CHANGED: Use actual size instead of 100%
        height="80"   // ✅ CHANGED: Fixed height for the SVG
        viewBox="0 0 400 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          display: 'block'  // ✅ ADDED: Remove any extra spacing
        }}
      >
        <text
          x="200"
          y="60"
          fontFamily="'Brush Script MT', 'Lucida Handwriting', 'Comic Sans MS', cursive"
          // fontSize="48"

          fontWeight="bold"
          fill={color}
          textAnchor="middle"
          style={{ letterSpacing: '2px', fontSize: `${size * 0.075}px` }}
        >
          crossroads
        </text>

        <path
          d="M 50 75 Q 200 85 350 75"
          stroke={color}
          strokeWidth="2"
          fill="none"
          opacity="0.8"
        />
      </svg>
    </Box>
  );
}
