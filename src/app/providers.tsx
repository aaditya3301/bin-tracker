'use client';

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, WagmiConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import { useState } from 'react';

const chains = [sepolia];
const projectId = 'YOUR_ACTUAL_PROJECT_ID'; // Get a projectId from https://cloud.walletconnect.com

const { connectors } = getDefaultWallets({
  appName: 'BinTrack',
  projectId,
  chains
});

const wagmiConfig = createConfig({
  chains,
  connectors,
  transports: {
    [sepolia.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a React Query client that persists across renders
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}