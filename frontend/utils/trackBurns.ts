import axios from 'axios';

const SOLSCAN_API = 'https://public-api.solscan.io';

interface BurnTransaction {
  txHash: string;
  timestamp: number;
  from: string;
  amount: string;
}

export async function getBurnTransactions(tokenMint: string): Promise<BurnTransaction[]> {
  try {
    // First, get all token transfers
    const response = await axios.get(`${SOLSCAN_API}/token/transfers`, {
      params: {
        tokenAddress: tokenMint,
        limit: 100, // Adjust based on needs
        offset: 0
      }
    });

    // Filter for burn transactions (where to address is the burn address)
    const burns = response.data.data.filter((tx: any) => {
      // Check if this is a burn transaction
      // You might need to adjust this condition based on how burns are implemented
      return tx.to === '11111111111111111111111111111111'; // System Program (burn)
    });

    // Format the data
    return burns.map((tx: any) => ({
      txHash: tx.txHash,
      timestamp: tx.blockTime,
      from: tx.from,
      amount: tx.amount
    }));
  } catch (error) {
    console.error('Error fetching burn transactions:', error);
    return [];
  }
}

export async function getTotalBurned(tokenMint: string): Promise<number> {
  const burns = await getBurnTransactions(tokenMint);
  return burns.reduce((total, burn) => total + Number(burn.amount), 0);
}

export async function getBurnsByWallet(tokenMint: string, walletAddress: string): Promise<number> {
  const burns = await getBurnTransactions(tokenMint);
  const walletBurns = burns.filter(burn => burn.from === walletAddress);
  return walletBurns.reduce((total, burn) => total + Number(burn.amount), 0);
} 