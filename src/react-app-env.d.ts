/// <reference types="react-scripts" />
export {};  // mark this file as a module

declare global {
  interface Window {
    tiktokRest: {
      nonce: string;
    };
  }
}
