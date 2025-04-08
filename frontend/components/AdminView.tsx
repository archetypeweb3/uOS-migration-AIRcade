'use client';

import React, { useState, useEffect } from 'react';
import { walletTracker } from '../utils/walletTracker';
import { csvTracker } from '../utils/csvTracker';

interface BurnRecord {
  solanaWallet: string;
  ethWallet: string;
  amount: number;
  txSignature: string;
  timestamp: string;
}

export default function AdminView(): React.ReactElement {
  const [records, setRecords] = useState<BurnRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'amount'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Refresh records when component mounts
  useEffect(() => {
    try {
      const storedRecords = walletTracker.getAllRecords();
      setRecords(storedRecords);
    } catch (error) {
      console.error('Error loading records:', error);
      setRecords([]);
    }
  }, []);

  // Filter and sort records
  const filteredRecords = records
    .filter((record: BurnRecord) => 
      record.ethWallet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.solanaWallet.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: BurnRecord, b: BurnRecord) => {
      if (sortBy === 'timestamp') {
        return sortOrder === 'asc' 
          ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        return sortOrder === 'asc'
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
    });

  // Calculate totals
  const totalBurned = records.reduce((sum: number, record: BurnRecord) => sum + record.amount, 0);
  const uniqueEthWallets = new Set(records.map((record: BurnRecord) => record.ethWallet)).size;
  const uniqueSolanaWallets = new Set(records.map((record: BurnRecord) => record.solanaWallet)).size;

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Burn Records Admin View</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => csvTracker.downloadCsv()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Download CSV
          </button>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total AIR Burned</div>
          <div className="text-2xl font-bold">{totalBurned} AIR</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Unique ETH Wallets</div>
          <div className="text-2xl font-bold">{uniqueEthWallets}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Unique Solana Wallets</div>
          <div className="text-2xl font-bold">{uniqueSolanaWallets}</div>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by wallet address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded-md flex-grow"
        />
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'timestamp' | 'amount')}
            className="px-3 py-2 border rounded-md"
          >
            <option value="timestamp">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-3 py-2 border rounded-md"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Timestamp</th>
              <th className="px-4 py-2 text-left">ETH Wallet</th>
              <th className="px-4 py-2 text-left">Solana Wallet</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-left">Transaction</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-4 py-2">
                  {new Date(record.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-2 font-mono text-sm">
                  {record.ethWallet}
                </td>
                <td className="px-4 py-2 font-mono text-sm">
                  {record.solanaWallet}
                </td>
                <td className="px-4 py-2 text-right">
                  {record.amount} AIR
                </td>
                <td className="px-4 py-2">
                  <a
                    href={`https://solscan.io/tx/${record.txSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 