interface BurnRecord {
  solanaWallet: string;
  ethWallet: string;
  amount: number;
  txSignature: string;
  timestamp: string;
}

export const googleSheetTracker = {
  // Google Apps Script Web App URL for tracking burns
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbyzjgXr_b_ELkecC_wi4JZmGJYCA-dDjG5tzbeyt0naeSPFoVKmF7s2D7e0fJB3X8Riaw/exec',

  // Send burn record to Google Sheet
  recordBurn: async (record: BurnRecord): Promise<boolean> => {
    try {
      console.log('Sending burn record to Google Sheet:', record);
      
      // Convert record to URL parameters
      const params = new URLSearchParams({
        solanaWallet: record.solanaWallet,
        ethWallet: record.ethWallet,
        amount: record.amount.toString(),
        txSignature: record.txSignature
      });

      const url = `${googleSheetTracker.WEB_APP_URL}?${params.toString()}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'no-cors' // This is important for Google Apps Script
      });

      console.log('Google Sheet response status:', response.status);
      const responseText = await response.text();
      console.log('Google Sheet response:', responseText);

      return true;
    } catch (error) {
      console.error('Error recording burn to Google Sheet:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      return false;
    }
  }
}; 