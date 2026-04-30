'use client'
import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { parseEther } from 'viem'
import { CONTRACT_ADDRESS, RENT_PROOF_ABI, truncateAddress } from '@/lib/contract'
import PageShell from '@/app/components/PageShell'

const C = '#1D4ED8'

export default function WalletPage() {
  const { address, isConnected, chain } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: txConf, isSuccess: txOk } = useWaitForTransactionReceipt({ hash: txHash })
  const [amt, setAmt] = useState('0.01')

  const deposit = () => {
    try { writeContract({ address: CONTRACT_ADDRESS, abi: RENT_PROOF_ABI, functionName: 'deposit', value: parseEther(amt) }) }
    catch {}
  }

  return (
    <PageShell title="Wallet & Deposit" subtitle="Connect your wallet and lock a security deposit on-chain." accent={C} watermark="WALLET">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Wallet Status */}
        <div style={{ background: '#FFFFFF', border: '1px solid #ECEAE3', borderRadius: 20, padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${C},#15803D)`, borderRadius: '20px 20px 0 0' }} />
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1.2rem', color: '#111110', marginBottom: '1.25rem' }}>Wallet Status</h2>
          {isConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{ l: 'ADDRESS', v: truncateAddress(address!), full: address }, { l: 'NETWORK', v: chain?.name ?? '—' }, { l: 'CONTRACT', v: truncateAddress(CONTRACT_ADDRESS) }].map(x => (
                <div key={x.l} style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '0.7rem 0.9rem' }}>
                  <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.58rem', color: '#A09D97', letterSpacing: '0.12em', marginBottom: 4 }}>{x.l}</p>
                  <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.8rem', color: C }}>{x.v}</p>
                </div>
              ))}
              <button onClick={() => disconnect()} style={{ marginTop: 8, fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: '0.82rem', padding: '0.6rem', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', cursor: 'pointer' }}>
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '2rem 0' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: '#EEF2FF', border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 12h.01" /><path d="M2 10h20" /></svg>
              </div>
              <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.88rem', color: '#888580' }}>No wallet connected</p>
              <button onClick={() => connect({ connector: injected() })} style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: '0.88rem', padding: '0.7rem 1.75rem', borderRadius: 12, background: C, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: `0 4px 18px ${C}44` }}>
                ⬡ Connect MetaMask
              </button>
            </div>
          )}
        </div>

        {/* Deposit */}
        <div style={{ background: '#FFFFFF', border: '1px solid #ECEAE3', borderRadius: 20, padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#15803D,#B45309)', borderRadius: '20px 20px 0 0' }} />
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1.2rem', color: '#111110', marginBottom: '0.5rem' }}>Lock Security Deposit</h2>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', color: '#888580', marginBottom: '1.25rem', lineHeight: 1.65 }}>Your deposit is locked in the smart contract — not with the landlord.</p>

          <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.6rem', color: '#A09D97', letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>AMOUNT (ETH)</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="number" value={amt} onChange={e => setAmt(e.target.value)} step="0.001" min="0"
              style={{ flex: 1, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '0.55rem 0.85rem', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.88rem', color: '#15803D', outline: 'none' }} />
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.75rem', color: '#A09D97', alignSelf: 'center' }}>ETH</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {['0.01', '0.05', '0.1'].map(v => (
              <button key={v} onClick={() => setAmt(v)} style={{ flex: 1, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.72rem', padding: '0.45rem', borderRadius: 8, background: amt === v ? '#F0FDF4' : 'transparent', border: `1px solid ${amt === v ? '#15803D55' : '#ECEAE3'}`, color: amt === v ? '#15803D' : '#A09D97', cursor: 'pointer' }}>{v}</button>
            ))}
          </div>
          <button onClick={deposit} disabled={!isConnected || isPending}
            style={{ width: '100%', fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: '0.88rem', padding: '0.75rem', borderRadius: 12, background: '#15803D', color: '#fff', border: 'none', cursor: 'pointer', opacity: !isConnected ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 18px #15803D33' }}>
            {isPending ? <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25" /><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8v8z" /></svg>Sending...</> : '🔒 Lock Deposit →'}
          </button>

          {/* Tx status */}
          {txHash && (
            <div style={{ marginTop: 16, padding: '0.85rem', borderRadius: 10, background: txOk ? '#F0FDF4' : '#EEF2FF', border: `1px solid ${txOk ? '#BBF7D0' : '#C7D2FE'}` }}>
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.68rem', color: txOk ? '#15803D' : C, marginBottom: 4 }}>{txConf ? 'Confirming on-chain...' : txOk ? '✓ Deposit confirmed!' : 'Transaction sent'}</p>
              <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.65rem', color: C }}>View on Etherscan ↗</a>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
