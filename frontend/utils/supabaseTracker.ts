import { supabase } from './supabaseClient';

interface BurnRecord {
  solanaWallet: string;
  ethWallet: string;
  amount: number;
  txSignature: string;
  timestamp: string;
}

export const supabaseTracker = {
  // Record a burn in Supabase
  recordBurn: async (record: BurnRecord): Promise<boolean> => {
    try {
      console.log('Attempting to record burn in Supabase:', record);
      
      const { data, error } = await supabase
        .from('burn_records')
        .insert([
          {
            timestamp: record.timestamp,
            solana_wallet: record.solanaWallet,
            eth_wallet: record.ethWallet,
            amount: record.amount,
            tx_signature: record.txSignature
          }
        ])
        .select(); // This will return the inserted record

      if (error) {
        console.error('Error recording burn in Supabase:', error);
        console.error('Error details:', error.message);
        console.error('Error code:', error.code);
        return false;
      }

      console.log('Successfully recorded burn in Supabase:', data);
      return true;
    } catch (error) {
      console.error('Error recording burn to Supabase:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      return false;
    }
  },

  // Get all burn records
  getAllRecords: async () => {
    try {
      console.log('Fetching all burn records from Supabase');
      const { data, error } = await supabase
        .from('burn_records')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching burn records:', error);
        return [];
      }

      console.log('Retrieved records:', data);
      return data;
    } catch (error) {
      console.error('Error in getAllRecords:', error);
      return [];
    }
  },

  // Get records by ETH wallet
  getRecordsByEthWallet: async (ethWallet: string) => {
    try {
      console.log('Fetching records for ETH wallet:', ethWallet);
      const { data, error } = await supabase
        .from('burn_records')
        .select('*')
        .eq('eth_wallet', ethWallet)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching records by ETH wallet:', error);
        return [];
      }

      console.log('Retrieved records for wallet:', data);
      return data;
    } catch (error) {
      console.error('Error in getRecordsByEthWallet:', error);
      return [];
    }
  },

  // Get total burned by ETH wallet
  getTotalBurnedByEthWallet: async (ethWallet: string) => {
    try {
      console.log('Calculating total burned for ETH wallet:', ethWallet);
      const { data, error } = await supabase
        .from('burn_records')
        .select('amount')
        .eq('eth_wallet', ethWallet);

      if (error) {
        console.error('Error calculating total burned:', error);
        return 0;
      }

      const total = data.reduce((sum, record) => sum + record.amount, 0);
      console.log('Total burned:', total);
      return total;
    } catch (error) {
      console.error('Error in getTotalBurnedByEthWallet:', error);
      return 0;
    }
  }
}; 