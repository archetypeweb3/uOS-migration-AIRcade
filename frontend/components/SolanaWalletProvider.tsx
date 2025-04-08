import { FC, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import styles directly instead of using require
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

const SolanaWalletProvider: FC<Props> = ({ children }) => {
  // Use a more reliable RPC endpoint with API key
  const EXTRNODE_API_KEY = process.env.NEXT_PUBLIC_EXTRNODE_API_KEY || 'c519b580-16e9-4b77-9ef9-3d4b4f61054f';
  const endpoint = `https://solana-mainnet.rpc.extrnode.com/${EXTRNODE_API_KEY}`;
  
  // Only use Phantom wallet adapter
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaWalletProvider; 