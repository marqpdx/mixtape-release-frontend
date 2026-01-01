// Mobile environment configuration
// Maps EXPO_PUBLIC_* variables to the format expected by shared packages

// Set up environment variables for shared packages
// The shared packages expect NEXT_PUBLIC_* but we use EXPO_PUBLIC_* in mobile
if (typeof process !== 'undefined' && process.env) {
  // Map mobile env vars to what shared packages expect
  if (process.env.EXPO_PUBLIC_API_URL) {
    process.env.NEXT_PUBLIC_ROOT_API_URL = process.env.EXPO_PUBLIC_API_URL;
  }

  if (process.env.EXPO_PUBLIC_LIVEWIRE_URL) {
    process.env.NEXT_PUBLIC_LIVEWIRE_URL = process.env.EXPO_PUBLIC_LIVEWIRE_URL;
  }

  console.log('[env] Mobile environment configured:', {
    apiUrl: process.env.NEXT_PUBLIC_ROOT_API_URL,
    livewireUrl: process.env.NEXT_PUBLIC_LIVEWIRE_URL,
  });
}

export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8010',
  livewireUrl: process.env.EXPO_PUBLIC_LIVEWIRE_URL || 'http://10.0.2.2:5001',
};
