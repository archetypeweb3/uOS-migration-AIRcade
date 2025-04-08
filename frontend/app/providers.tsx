'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { base } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

const { publicClient } = configureChains(
  [base],
  [publicProvider()]
)

const config = createConfig({
  autoConnect: true,
  publicClient,
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      >
        {children}
      </PrivyProvider>
    </WagmiConfig>
  )
} 