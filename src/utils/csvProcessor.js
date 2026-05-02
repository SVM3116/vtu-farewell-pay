/**
 * CSV Processor for Payment Verification
 */

export const normalizeUTR = (utr) => {
  if (!utr) return "";
  let normalized = String(utr).trim();
  if (normalized.endsWith(".00")) {
    normalized = normalized.replace(".00", "");
  }
  return normalized;
};

export const processPaymentCSV = (csvData, pendingPayments, approvedUTRs) => {
  const results = {
    toApprove: [],
    toFlag: [],
    skippedCount: 0,
    noMatchCount: 0,
    totalProcessed: 0,
    precisionWarning: false,
  };

  // MAPPING based on your specific CSV format
  const COL_BANK_TIME = 0;    // "Transaction Date and Time"
  const COL_TXN_ID = 4;       // "Transaction ID"
  const COL_TXN_AMOUNT = 5;   // "Transaction Amount"

  const csvMap = new Map();
  csvData.forEach((row) => {
    if (!row || row.length < 6) return;
    
    const rawTxnId = row[COL_TXN_ID];
    
    if (typeof rawTxnId === 'string' && rawTxnId.includes('E+')) {
      results.precisionWarning = true;
    }

    const normalizedTxnId = normalizeUTR(rawTxnId);
    
    if (normalizedTxnId && !approvedUTRs.has(normalizedTxnId)) {
      csvMap.set(normalizedTxnId, {
        amount: parseFloat(String(row[COL_TXN_AMOUNT]).replace(/[^0-9.]/g, "")),
        bankTime: row[COL_BANK_TIME], // <--- EXTRACTING DATE/TIME
        rawRow: row
      });
    } else if (normalizedTxnId && approvedUTRs.has(normalizedTxnId)) {
      results.skippedCount++;
    }
  });

  results.totalProcessed = csvData.length;

  pendingPayments.forEach((payment) => {
    const studentUtr = normalizeUTR(payment.utr);
    const csvRecord = csvMap.get(studentUtr);

    if (!csvRecord) {
      results.noMatchCount++;
      return;
    }

    const studentAmount = parseFloat(payment.amount);
    const bankAmount = csvRecord.amount;

    if (studentAmount === bankAmount) {
      // Case 1: Pass the bankTime to the approval record
      results.toApprove.push({ 
        id: payment.id, 
        usn: payment.usn, 
        bankTime: csvRecord.bankTime // <--- ADDED HERE
      });
    } else {
      results.toFlag.push({
        id: payment.id,
        usn: payment.usn,
        expectedAmount: studentAmount,
        actualBankAmount: bankAmount,
      });
    }
  });

  return results;
};