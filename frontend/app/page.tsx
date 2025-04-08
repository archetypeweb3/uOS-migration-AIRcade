'use client';

import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import Button from '../components/Button';
import Card from '../components/Card';
import { AnimatedShinyText } from '../components/AnimatedShinyText';
import WarningModal from '../components/WarningModal';
import Toggle from '../components/Toggle';
import supabase from '../lib/supabase';
import { 
  formatAddress, 
  handleWalletError, 
  connectPhantom, 
  connectProperEvmWallet,
  isPhantomInstalled,
  isProperEvmWalletAvailable,
  isPhantomEVM
} from '../lib/walletUtils';
import { hasAIRcadeBalance, getAIRcadeBalance } from '../lib/solanaUtils';

export default function Home() {
  // Set up state without Privy
  const [solanaWallet, setSolanaWallet] = useState<string | null>(null);
  const [evmWallet, setEvmWallet] = useState<string | null>(null);
  const [manualSolanaWallet, setManualSolanaWallet] = useState<string>('');
  const [manualEvmWallet, setManualEvmWallet] = useState<string>('');
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'registering' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnectingSolana, setIsConnectingSolana] = useState(false);
  const [isConnectingEVM, setIsConnectingEVM] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [uosBalance, setUosBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [walletStatus, setWalletStatus] = useState({
    phantomInstalled: false,
    evmWalletAvailable: false
  });

  // Check for wallet availability on mount - safely wrapped
  useEffect(() => {
    try {
      setWalletStatus({
        phantomInstalled: isPhantomInstalled(),
        evmWalletAvailable: isProperEvmWalletAvailable()
      });
    } catch (error) {
      console.error("Error checking wallet availability:", error);
    }
  }, []);

  // Fetch uOS balance when Solana wallet is connected
  useEffect(() => {
    if (solanaWallet) {
      const fetchAIRcadeBalance = async () => {
        setIsLoadingBalance(true);
        try {
          const balance = await getAIRcadeBalance(solanaWallet);
          setUosBalance(balance);
        } catch (error) {
          console.error('Error fetching AIRcade balance:', error);
          setUosBalance(null);
          setErrorMessage('Failed to fetch AIRcade balance. Please try again later.');
        } finally {
          setIsLoadingBalance(false);
        }
      };
      
      fetchAIRcadeBalance();
    } else {
      setUosBalance(null);
    }
  }, [solanaWallet]);

  // Function to connect Solana wallet directly using Phantom
  const connectSolanaWallet = async () => {
    try {
      // Check if EVM wallet is connected first
      if (!evmWallet) {
        setErrorMessage('Please connect your EVM wallet first before connecting your Solana wallet');
        return;
      }
      
      setIsConnectingSolana(true);
      setErrorMessage(null);
      
      const wallet = await connectPhantom();
      if (wallet) {
        setSolanaWallet(wallet);
      }
    } catch (error) {
      console.error('Error connecting to Phantom:', error);
      setErrorMessage(handleWalletError(error));
    } finally {
      setIsConnectingSolana(false);
    }
  };

  // Function to connect EVM wallet
  const connectEvmWallet = async () => {
    try {
      setIsConnectingEVM(true);
      setErrorMessage(null);
      
      const wallet = await connectProperEvmWallet();
      if (wallet) {
        setEvmWallet(wallet);
      }
    } catch (error) {
      console.error('Error connecting to EVM wallet:', error);
      setErrorMessage(handleWalletError(error));
    } finally {
      setIsConnectingEVM(false);
    }
  };

  const handleEvmConnection = async () => {
    if (isPhantomEVM()) {
      setShowWarningModal(true);
    } else {
      await connectEvmWallet();
    }
  };

  const resetWalletConnections = async () => {
    setSolanaWallet(null);
    setEvmWallet(null);
    setManualSolanaWallet('');
    setManualEvmWallet('');
    setUosBalance(null);
    setErrorMessage(null);
    setRegistrationStatus('idle');
  };

  const isValidEthAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const isValidSolanaAddress = (address: string): boolean => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  };

  const handleManualWalletSubmit = () => {
    if (!isValidEthAddress(manualEvmWallet)) {
      setErrorMessage('Invalid EVM wallet address');
      return;
    }
    if (!isValidSolanaAddress(manualSolanaWallet)) {
      setErrorMessage('Invalid Solana wallet address');
      return;
    }
    setEvmWallet(manualEvmWallet);
    setSolanaWallet(manualSolanaWallet);
  };

  const registerUser = async () => {
    if (!evmWallet || !solanaWallet) {
      setErrorMessage('Please connect both wallets before registering');
      return;
    }

    setRegistrationStatus('registering');
    setErrorMessage(null);

    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .or(`evm_wallet.eq.${evmWallet},solana_wallet.eq.${solanaWallet}`)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingUser) {
        setErrorMessage('A user with one of these wallets is already registered');
        setRegistrationStatus('error');
        return;
      }

      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            evm_wallet: evmWallet,
            solana_wallet: solanaWallet,
            registration_date: new Date().toISOString()
          }
        ]);

      if (insertError) throw insertError;

      setRegistrationStatus('success');
    } catch (error) {
      console.error('Error registering user:', error);
      setErrorMessage('Failed to register user. Please try again later.');
      setRegistrationStatus('error');
    }
  };

  const toggleManualMode = () => {
    setIsManualMode(!isManualMode);
    resetWalletConnections();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <Navigation />
        <Card>
          <AnimatedShinyText text="AIRcade Migration" />
          <div className="mt-8 space-y-4">
            {errorMessage && (
              <div className="text-red-500 text-sm">{errorMessage}</div>
            )}
            {registrationStatus === 'success' && (
              <div className="text-green-500 text-sm">Registration successful!</div>
            )}
            <Toggle
              label="Manual Mode"
              checked={isManualMode}
              onChange={toggleManualMode}
            />
            {isManualMode ? (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter EVM wallet address"
                  value={manualEvmWallet}
                  onChange={(e) => setManualEvmWallet(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Enter Solana wallet address"
                  value={manualSolanaWallet}
                  onChange={(e) => setManualSolanaWallet(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <Button
                  onClick={handleManualWalletSubmit}
                  disabled={!manualEvmWallet || !manualSolanaWallet}
                >
                  Submit Wallets
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={handleEvmConnection}
                  disabled={isConnectingEVM || !walletStatus.evmWalletAvailable}
                >
                  {isConnectingEVM ? 'Connecting...' : 'Connect EVM Wallet'}
                </Button>
                <Button
                  onClick={connectSolanaWallet}
                  disabled={isConnectingSolana || !walletStatus.phantomInstalled || !evmWallet}
                >
                  {isConnectingSolana ? 'Connecting...' : 'Connect Solana Wallet'}
                </Button>
              </div>
            )}
            {(evmWallet || solanaWallet) && (
              <div className="space-y-2">
                {evmWallet && (
                  <div>EVM Wallet: {formatAddress(evmWallet)}</div>
                )}
                {solanaWallet && (
                  <div>Solana Wallet: {formatAddress(solanaWallet)}</div>
                )}
                {uosBalance !== null && (
                  <div>uOS Balance: {uosBalance}</div>
                )}
                <Button
                  onClick={registerUser}
                  disabled={registrationStatus === 'registering' || !evmWallet || !solanaWallet}
                >
                  {registrationStatus === 'registering' ? 'Registering...' : 'Register'}
                </Button>
                <Button onClick={resetWalletConnections}>
                  Reset
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
      <WarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={connectEvmWallet}
      />
    </main>
  );
} 