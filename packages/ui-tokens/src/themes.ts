// apps/mixtape/src/theme/themes.ts

export type ColorMode = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  bgSecondary?: string;
  surface: string;
  accent: string;
  /** Text color that achieves WCAG AA contrast on the accent background. */
  accentText?: string;
  text: string;
  textSecondary: string;
  border: string;
}

export interface Theme {
  name: string;
  id: string;
  light: ThemeColors;
  dark: ThemeColors;
  lightHighContrast?: ThemeColors;
  darkHighContrast?: ThemeColors;
}

export const themes: Theme[] = [
  {
    id: 'gallery',
    name: 'Gallery Minimal',
    light: {
      bg: '#F7FAFC', // gray.50 - clean, spacious background
      surface: '#FFFFFF', // pure white - like clean gallery walls
      accent: '#38A169', // green.500 - the header green, sophisticated
      accentText: '#000000',
      text: '#2D3748', // gray.800 - strong readable text
      textSecondary: '#4A5568', // gray.600 - subtle secondary text
      border: '#E2E8F0' // gray.200 - minimal, barely-there borders
    },
    dark: {
      bg: '#1A202C', // gray.800 - dark gallery space
      surface: '#2D3748', // gray.700 - elevated surfaces
      accent: '#48BB78', // green.400 - brighter green for dark mode
      accentText: '#000000',
      text: '#F7FAFC', // gray.50 - clean white text
      textSecondary: '#CBD5E0', // gray.300 - muted secondary
      border: '#4A5568' // gray.600 - subtle dark borders
    },
    lightHighContrast: {
      bg: '#FFFFFF', // Pure white background
      surface: '#F5F5F5', // Very light gray for cards
      accent: '#1A7F37', // Darker green for 7:1 contrast
      accentText: '#FFFFFF',
      text: '#000000', // Pure black text (21:1 contrast)
      textSecondary: '#1A1A1A', // Very dark gray (18:1 contrast)
      border: '#666666' // Medium gray for visible borders
    },
    darkHighContrast: {
      bg: '#000000', // Pure black background
      surface: '#1A1A1A', // Very dark gray for cards
      accent: '#7FFF00', // Bright chartreuse (14:1 contrast)
      accentText: '#000000',
      text: '#FFFFFF', // Pure white text (21:1 contrast)
      textSecondary: '#E0E0E0', // Light gray (15:1 contrast)
      border: '#CCCCCC' // Light border for visibility
    }
  },
  {
    id: 'earthy-slate',
    name: 'Earthy Slate',
    light: {
      bg: '#F1F0E9', // Warm cream background - perfect for light mode
      surface: '#FFFFFF', // Clean white for cards (derived)
      accent: '#ED9A51', // Warm orange - vibrant accent color
      accentText: '#000000',
      text: '#171E26', // Deep slate - excellent contrast for text
      textSecondary: '#B95C54', // Muted rust - perfect for secondary text
      border: '#95A8B2' // Soft blue-gray - subtle borders
    },
    dark: {
      bg: '#171E26', // Deep slate - rich dark background
      surface: '#2A3440', // Lighter slate for cards (derived from your dark)
      accent: '#ED9A51', // Same warm orange - pops beautifully on dark
      accentText: '#000000',
      text: '#F1F0E9', // Light cream text - mirrors light bg
      textSecondary: '#95A8B2', // Cool gray-blue for secondary text
      border: '#3A4651' // Darker blue-gray borders (derived)
    },
    lightHighContrast: {
      bg: '#FFFFFF',
      surface: '#F8F8F8',
      accent: '#C85A1C', // Darker orange for better contrast
      accentText: '#000000',
      text: '#000000',
      textSecondary: '#1A1A1A',
      border: '#666666'
    },
    darkHighContrast: {
      bg: '#000000',
      surface: '#1A1A1A',
      accent: '#FFB366', // Brighter orange for dark mode
      accentText: '#000000',
      text: '#FFFFFF',
      textSecondary: '#E0E0E0',
      border: '#CCCCCC'
    }
  },

// Here's how I mapped your colors:
// #F1F0E9 (cream) → Light BG + Dark Text
// #ED9A51 (orange) → Accent (both modes) - most vibrant
// #95A8B2 (blue-gray) → Borders + Dark Secondary Text
// #B95C54 (rust) → Light Secondary Text
// #171E26 (slate) → Dark BG + Light Text

  {
    id: 'crossroads',
    name: 'Crossroads Foundation',
    light: {
      bg: '#FAF6F1',
      surface: '#F3ECE4',
      accent: '#B85C4A',
      accentText: '#000000',
      text: '#2A3B47',
      textSecondary: '#4A5568',
      border: '#E0D7CE'
    },
    dark: {
      bg: '#253540',
      surface: '#2F4350',
      accent: '#E8B794',
      accentText: '#000000',
      text: '#F3ECE4',
      textSecondary: '#CBD5E0',
      border: '#3B4C57'
    },
    lightHighContrast: {
      bg: '#FFFFFF',
      surface: '#F5F5F5',
      accent: '#8B3A2A', // Darker rust-red
      accentText: '#FFFFFF',
      text: '#000000',
      textSecondary: '#1A1A1A',
      border: '#666666'
    },
    darkHighContrast: {
      bg: '#000000',
      surface: '#1A1A1A',
      accent: '#FFD4B3', // Brighter peach
      accentText: '#000000',
      text: '#FFFFFF',
      textSecondary: '#E0E0E0',
      border: '#CCCCCC'
    }
  },
  {
    id: 'forest',
    name: 'Forest Dawn',
    light: {
      bg: '#F9F5F0',
      surface: '#F1E9E0',
      accent: '#8B7355',
      accentText: '#000000',
      text: '#2A3B47',
      textSecondary: '#4A5568',
      border: '#DDD2C5'
    },
    dark: {
      bg: '#1F2E36',
      surface: '#294047',
      accent: '#A8956B',
      accentText: '#000000',
      text: '#F1E9E0',
      textSecondary: '#CBD5E0',
      border: '#374955'
    },
    lightHighContrast: {
      bg: '#FFFFFF',
      surface: '#F5F5F5',
      accent: '#5A4A35', // Darker brown
      accentText: '#FFFFFF',
      text: '#000000',
      textSecondary: '#1A1A1A',
      border: '#666666'
    },
    darkHighContrast: {
      bg: '#000000',
      surface: '#1A1A1A',
      accent: '#D4C499', // Brighter tan
      accentText: '#000000',
      text: '#FFFFFF',
      textSecondary: '#E0E0E0',
      border: '#CCCCCC'
    }
  },
  {
    id: 'canyon',
    name: 'Canyon Glow',
    light: {
      bg: '#FCF7F2',
      surface: '#F5EDE5',
      accent: '#CC6B3A',
      accentText: '#000000',
      text: '#2A3B47',
      textSecondary: '#4A5568',
      border: '#E4D5C8'
    },
    dark: {
      bg: '#242F3A',
      surface: '#2E3B48',
      accent: '#F4A261',
      accentText: '#000000',
      text: '#F5EDE5',
      textSecondary: '#CBD5E0',
      border: '#394856'
    },
    lightHighContrast: {
      bg: '#FFFFFF',
      surface: '#F5F5F5',
      accent: '#A04A1F', // Darker canyon orange
      accentText: '#FFFFFF',
      text: '#000000',
      textSecondary: '#1A1A1A',
      border: '#666666'
    },
    darkHighContrast: {
      bg: '#000000',
      surface: '#1A1A1A',
      accent: '#FFBB7A', // Brighter canyon
      accentText: '#000000',
      text: '#FFFFFF',
      textSecondary: '#E0E0E0',
      border: '#CCCCCC'
    }
  },
  {
    id: 'meadow',
    name: 'Meadow Mist',
    light: {
      bg: '#F8F6F1',
      surface: '#F0EBE3',
      accent: '#7A9B76',
      accentText: '#000000',
      text: '#2A3B47',
      textSecondary: '#4A5568',
      border: '#DFD6CA'
    },
    dark: {
      bg: '#223239',
      surface: '#2C3E47',
      accent: '#95C89B',
      accentText: '#000000',
      text: '#F0EBE3',
      textSecondary: '#CBD5E0',
      border: '#384A55'
    },
    lightHighContrast: {
      bg: '#FFFFFF',
      surface: '#F5F5F5',
      accent: '#4A6F45', // Darker green
      accentText: '#FFFFFF',
      text: '#000000',
      textSecondary: '#1A1A1A',
      border: '#666666'
    },
    darkHighContrast: {
      bg: '#000000',
      surface: '#1A1A1A',
      accent: '#B3E6B8', // Brighter mint
      accentText: '#000000',
      text: '#FFFFFF',
      textSecondary: '#E0E0E0',
      border: '#CCCCCC'
    }
  },
  {
    id: 'dusk',
    name: 'Twilight Dusk',
    light: {
      bg: '#FAF5F0',
      surface: '#F2E9E1',
      accent: '#A67C6A',
      accentText: '#000000',
      text: '#2A3B47',
      textSecondary: '#4A5568',
      border: '#E1D4C7'
    },
    dark: {
      bg: '#26313C',
      surface: '#303D4A',
      accent: '#D4A574',
      accentText: '#000000',
      text: '#F2E9E1',
      textSecondary: '#CBD5E0',
      border: '#3A4958'
    },
    lightHighContrast: {
      bg: '#FFFFFF',
      surface: '#F5F5F5',
      accent: '#7A5545', // Darker mauve
      accentText: '#FFFFFF',
      text: '#000000',
      textSecondary: '#1A1A1A',
      border: '#666666'
    },
    darkHighContrast: {
      bg: '#000000',
      surface: '#1A1A1A',
      accent: '#EABD94', // Brighter tan
      accentText: '#000000',
      text: '#FFFFFF',
      textSecondary: '#E0E0E0',
      border: '#CCCCCC'
    }
  },
  {
    id: 'coastal',
    name: 'Coastal Dunes',
    light: {
      bg: '#FEFCFA',
      surface: '#F6F2ED',
      accent: '#38B2AC',
      accentText: '#000000',
      text: '#2A3B47',
      textSecondary: '#4A5568',
      border: '#E6E0D6'
    },
    dark: {
      bg: '#1B2A38',
      surface: '#253A4A',
      accent: '#4FD1C7',
      accentText: '#000000',
      text: '#F6F2ED',
      textSecondary: '#CBD5E0',
      border: '#2D3748'
    },
    lightHighContrast: {
      bg: '#FFFFFF',
      surface: '#F5F5F5',
      accent: '#1A7F7A', // Darker teal
      accentText: '#FFFFFF',
      text: '#000000',
      textSecondary: '#1A1A1A',
      border: '#666666'
    },
    darkHighContrast: {
      bg: '#000000',
      surface: '#1A1A1A',
      accent: '#80F0E8', // Bright cyan
      accentText: '#000000',
      text: '#FFFFFF',
      textSecondary: '#E0E0E0',
      border: '#CCCCCC'
    }
  },
  {
    id: 'warm',
    name: 'Warm Crossroads',
    light: {
      bg: '#FFF8F0', // orange.50 equivalent - warm off-white
      surface: '#FFFFFF', // clean white for cards
      accent: '#F56500', // orange.600 - the main orange accent
      accentText: '#000000',
      text: '#2D3748', // gray.800 - main text
      textSecondary: '#C05621', // orange.700 - secondary text with warmth
      border: '#FED7AA' // orange.200 - soft borders
    },
    dark: {
      bg: '#1A1611', // very dark warm brown
      surface: '#2D1B0E', // dark warm brown for cards
      accent: '#FBB040', // orange.400 - brighter orange for dark mode
      accentText: '#000000',
      text: '#F7FAFC', // nearly white text
      textSecondary: '#FED7AA', // orange.200 - warm secondary text
      border: '#975A16' // orange.800 - darker borders
    },
    lightHighContrast: {
      bg: '#FFFFFF',
      surface: '#F5F5F5',
      accent: '#C44F00', // Darker orange
      accentText: '#FFFFFF',
      text: '#000000',
      textSecondary: '#1A1A1A',
      border: '#666666'
    },
    darkHighContrast: {
      bg: '#000000',
      surface: '#1A1A1A',
      accent: '#FFCC66', // Bright amber
      accentText: '#000000',
      text: '#FFFFFF',
      textSecondary: '#E0E0E0',
      border: '#CCCCCC'
    }
  },
  {
    id: 'big-board',
    name: 'Big Board',
    // Puddlejump's tote-board / split-flap knowledge surface. Dark mode is
    // the board lit at night (amber flaps on a charcoal cabinet); light
    // mode is the same physical object read in daylight (cream board face,
    // ink lettering) -- not an inversion of the dark palette.
    light: {
      bg: '#F3EEE1', // unbleached board casing
      surface: '#FFFDF6', // paper-white flap tile
      accent: '#A6651C', // dark ochre -- reads on cream, still recognizably amber
      accentText: '#FFFFFF',
      text: '#241F17', // ink brown-black
      textSecondary: '#6E6250',
      border: '#DAD0BB'
    },
    dark: {
      bg: '#0F0D0B', // board cabinet at night
      bgSecondary: '#1A1712',
      surface: '#211D16', // raised flap tile face
      accent: '#E8A33D', // lit amber
      accentText: '#1A1712',
      text: '#ECE4D3', // flap cream
      textSecondary: '#8C8474',
      border: '#332E25'
    },
    lightHighContrast: {
      bg: '#FFFFFF',
      surface: '#F5F5F0',
      accent: '#7A4A10',
      accentText: '#FFFFFF',
      text: '#000000',
      textSecondary: '#1A1A1A',
      border: '#666666'
    },
    darkHighContrast: {
      bg: '#000000',
      surface: '#1A1A1A',
      accent: '#FFC966',
      accentText: '#000000',
      text: '#FFFFFF',
      textSecondary: '#E0E0E0',
      border: '#CCCCCC'
    }
  },
];
