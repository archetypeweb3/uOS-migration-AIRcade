interface BurnRecord {
  solanaWallet: string;
  ethWallet: string;
  amount: number;
  txSignature: string;
  timestamp: string;
}

// In a real application, this would be stored in a database
// For demo purposes, we'll use localStorage
export const walletTracker = {
  // Store a burn record
  recordBurn: (record: BurnRecord) => {
    try {
      // Get existing records
      const existingRecords = JSON.parse(localStorage.getItem('burnRecords') || '[]');
      
      // Add new record
      existingRecords.push({
        ...record,
        timestamp: new Date().toISOString()
      });
      
      // Save back to localStorage
      localStorage.setItem('burnRecords', JSON.stringify(existingRecords));
      
      return true;
    } catch (error) {
      console.error('Error recording burn:', error);
      return false;
    }
  },

  // Get all burn records
  getAllRecords: (): BurnRecord[] => {
    try {
      return JSON.parse(localStorage.getItem('burnRecords') || '[]');
    } catch (error) {
      console.error('Error getting burn records:', error);
      return [];
    }
  },

  // Get records for a specific Solana wallet
  getRecordsBySolanaWallet: (solanaWallet: string): BurnRecord[] => {
    const allRecords = walletTracker.getAllRecords();
    return allRecords.filter(record => record.solanaWallet === solanaWallet);
  },

  // Get records for a specific ETH wallet
  getRecordsByEthWallet: (ethWallet: string): BurnRecord[] => {
    const allRecords = walletTracker.getAllRecords();
    return allRecords.filter(record => record.ethWallet === ethWallet);
  },

  // Get total amount burned by a specific ETH wallet
  getTotalBurnedByEthWallet: (ethWallet: string): number => {
    const records = walletTracker.getRecordsByEthWallet(ethWallet);
    return records.reduce((total, record) => total + record.amount, 0);
  }
}; 