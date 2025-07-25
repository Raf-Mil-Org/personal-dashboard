

export function useTransactionsAnalyser() {
  function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');

    return lines.slice(1).map(line => {
      const values = line.split(',');
      const row = {};
      headers.forEach((h, i) => {
        row[h.trim()] = values[i]?.trim();
      });
      return row;
    });
  }

  function cleanBankTransactions(transactions) {
    return transactions.map((tx) => {
      const dateStr = tx['Date'];
      if (!dateStr) {
        // Handle missing date gracefully
        return null;
      }
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      const parsedDate = new Date(`${year}-${month}-${day}`);

      const amountStr = tx['Amount (EUR)'].replace(',', '.');
      const amount = parseFloat(amountStr);
      const signedAmount = tx['Debit/credit'].toLowerCase() === 'credit' ? amount : -amount;

      let notificationTime = null;
      const match = tx['Notifications']?.match(/Date\/time:\s*(\\d{2})-(\\d{2})-(\\d{4}) (\\d{2}):(\\d{2}):(\\d{2})/);
      if (match) {
        const [, dd, mm, yyyy, h, m, s] = match;
        notificationTime = new Date(`${yyyy}-${mm}-${dd}T${h}:${m}:${s}`);
      }

      return {
        ...tx,
        parsedDate,
        amount,
        signedAmount,
        notificationTime,
      };
    }).filter(Boolean); // Remove nulls
  }

  return {
    parseCSV,
    cleanBankTransactions
  }
}
