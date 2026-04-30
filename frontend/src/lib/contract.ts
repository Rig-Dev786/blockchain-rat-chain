// lib/contract.ts
// Replace CONTRACT_ADDRESS with your deployed contract address

export const CONTRACT_ADDRESS = '0xYourDeployedContractAddressHere' as `0x${string}`

export const RENT_PROOF_ABI = [
  // --- Write Functions ---
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'approveReturn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'releaseDeposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  // --- Read Functions ---
  {
    name: 'getBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'isApproved',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'landlord',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'tenant',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  // --- Events ---
  {
    name: 'DepositPaid',
    type: 'event',
    inputs: [
      { name: 'tenant', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'DepositReleased',
    type: 'event',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const

// Helper: truncate wallet address for display
export function truncateAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Backend API base URL - update from .env
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
