/// <reference types="vite/client" />

import { ethers } from "ethers";

const { ExternalProvider } = ethers.providers;

declare global {
  interface Window {
    ethereum: ExternalProvider;
  }
}