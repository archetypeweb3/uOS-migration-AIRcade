interface BurnRecord {
  solanaWallet: string;
  ethWallet: string;
  amount: number;
  txSignature: string;
  timestamp: string;
}

export const csvTracker = {
  // Convert a burn record to CSV line
  recordToCsv: (record: BurnRecord): string => {
    return `${record.timestamp},${record.solanaWallet},${record.ethWallet},${record.amount},${record.txSignature}\n`;
  },

  // Add a new burn record to the CSV
  addRecord: (record: BurnRecord) => {
    try {
      // Create CSV header if file doesn't exist
      if (!localStorage.getItem('burnRecordsCsv')) {
        const header = 'Timestamp,Solana Wallet,ETH Wallet,Amount,Transaction\n';
        localStorage.setItem('burnRecordsCsv', header);
      }

      // Get existing CSV
      const existingCsv = localStorage.getItem('burnRecordsCsv') || '';
      
      // Add new record
      const newCsv = existingCsv + csvTracker.recordToCsv(record);
      
      // Save back to localStorage
      localStorage.setItem('burnRecordsCsv', newCsv);
      
      return true;
    } catch (error) {
      console.error('Error recording burn to CSV:', error);
      return false;
    }
  },

  // Get all records as CSV
  getAllRecords: (): string => {
    return localStorage.getItem('burnRecordsCsv') || 'Timestamp,Solana Wallet,ETH Wallet,Amount,Transaction\n';
  },

  // Download the CSV file
  downloadCsv: () => {
    const csv = csvTracker.getAllRecords();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `burn_records_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}; 