'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createBurnInstruction, getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import Button from './Button';
import { walletTracker } from '../utils/walletTracker';
import { csvTracker } from '../utils/csvTracker';
import { supabaseTracker } from '../utils/supabaseTracker';

// For testing on devnet
const AIR_TOKEN_MINT = 'EVq5pDSK8JbYY3PeACac6FZAP8F1sJc9GDmXVBhtpump';
const DECIMALS = 6; // AIR token has 6 decimals

// Helper function to format balance display
const formatBalance = (balance: number): string => {
  // If the balance is a whole number, display without decimals
  if (Number.isInteger(balance)) {
    return balance.toString();
  }
  // Otherwise, display with up to 2 decimal places
  return balance.toFixed(2);
};

// Helper function to validate ETH address
const isValidEthAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export default function BurnToken() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [amount, setAmount] = useState('');
  const [ethAddress, setEthAddress] = useState('');
  const [status, setStatus] = useState<'idle' | 'burning' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Fetch token balance when component mounts or wallet changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) return;
      
      try {
        const tokenAccount = await getAssociatedTokenAddress(
          new PublicKey(AIR_TOKEN_MINT),
          publicKey
        );
        
        const accountInfo = await getAccount(connection, tokenAccount);
        if (accountInfo) {
          const balance = Number(accountInfo.amount) / Math.pow(10, DECIMALS);
          setBalance(formatBalance(balance));
        } else {
          setBalance('0');
        }
      } catch (err) {
        console.error('Error fetching balance:', err);
        setBalance('0');
      }
    };

    fetchBalance();
  }, [publicKey, connection]);

  const handleBurn = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!ethAddress || !isValidEthAddress(ethAddress)) {
      setError('Please enter a valid ETH address starting with 0x');
      return;
    }

    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      console.log('Starting burn process...');
      console.log('Amount to burn:', amount);
      console.log('ETH Wallet:', ethAddress);
      console.log('Solana Wallet:', publicKey.toString());

      setStatus('burning');
      setError(null);
      setTxSignature(null);

      // Get the token account
      const tokenAccount = await getAssociatedTokenAddress(
        new PublicKey(AIR_TOKEN_MINT),
        publicKey
      );
      console.log('Token Account:', tokenAccount.toString());

      // Check if the token account exists and has balance
      const accountInfo = await getAccount(connection, tokenAccount);
      console.log('Token Account Info:', accountInfo);

      if (!accountInfo) {
        throw new Error('No AIR token account found');
      }

      const currentBalance = Number(accountInfo.amount) / Math.pow(10, DECIMALS);
      if (currentBalance < Number(amount)) {
        throw new Error(`Insufficient balance. You have ${formatBalance(currentBalance)} AIR tokens, but trying to burn ${amount}`);
      }

      // Create burn instruction
      const burnInstruction = createBurnInstruction(
        tokenAccount,
        new PublicKey(AIR_TOKEN_MINT),
        publicKey,
        BigInt(Math.floor(Number(amount) * Math.pow(10, DECIMALS)))
      );
      console.log('Burn instruction created');

      // Create and send transaction
      const transaction = new Transaction().add(burnInstruction);
      console.log('Transaction created');

      const signature = await sendTransaction(transaction, connection);
      console.log('Transaction sent, signature:', signature);
      setTxSignature(signature);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature);
      console.log('Transaction confirmed:', confirmation);

      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      // Record the burn in Supabase
      console.log('Attempting to record burn in Supabase...');
      const burnRecord = {
        solanaWallet: publicKey.toString(),
        ethWallet: ethAddress,
        amount: Number(amount),
        txSignature: signature,
        timestamp: new Date().toISOString()
      };
      console.log('Burn record to be saved:', burnRecord);

      const success = await supabaseTracker.recordBurn(burnRecord);
      console.log('Supabase recording result:', success);

      if (!success) {
        console.error('Failed to record burn in Supabase');
        // Don't throw error here, just log it
      }

      setStatus('success');
      setAmount('0');
      setEthAddress('');
      
      // Update balance after successful burn
      const newAccountInfo = await getAccount(connection, tokenAccount);
      if (newAccountInfo) {
        const newBalance = Number(newAccountInfo.amount) / Math.pow(10, DECIMALS);
        setBalance(formatBalance(newBalance));
      }
    } catch (err) {
      console.error('Error in burn process:', err);
      if (err instanceof Error) {
        console.error('Error details:', err.message);
        console.error('Error stack:', err.stack);
      }
      setError(err instanceof Error ? err.message : 'Failed to burn tokens');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="amount" className="text-sm font-medium">
            Amount to Burn
          </label>
          <span className="text-sm text-gray-500">
            Balance: {balance} AIR
          </span>
        </div>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="px-3 py-2 border rounded-md"
          placeholder="Enter amount"
          disabled={status === 'burning'}
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label htmlFor="ethAddress" className="text-sm font-medium">
          ETH EVM Address
        </label>
        <input
          id="ethAddress"
          type="text"
          value={ethAddress}
          onChange={(e) => setEthAddress(e.target.value)}
          className="px-3 py-2 border rounded-md"
          placeholder="Enter your ETH address (0x...)"
          disabled={status === 'burning'}
        />
      </div>

      <Button
        onClick={handleBurn}
        disabled={status === 'burning' || !amount || !isValidEthAddress(ethAddress)}
        className="w-full"
      >
        {status === 'burning' ? 'Burning...' : 'Burn Tokens'}
      </Button>

      {status === 'success' && (
        <div className="space-y-2">
          <div className="text-green-600">
            Tokens burned successfully!
          </div>
          {txSignature && (
            <div className="text-sm">
              <a 
                href={`https://solscan.io/tx/${txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline"
              >
                View transaction on Solscan
              </a>
            </div>
          )}
          <div className="text-sm text-gray-600 mt-2">
            Thank you for registering for the migration of $AIR from SOL to Base. Your new token will be airdropped in the next 72 hours.
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-600">
          {error}
        </div>
      )}
    </div>
  );
} 