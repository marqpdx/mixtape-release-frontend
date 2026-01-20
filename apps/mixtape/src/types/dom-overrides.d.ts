// DOM type augmentations for WebKit-specific file inputs.

declare global {
  interface File {
    webkitRelativePath?: string;
  }
}

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}

export {};
