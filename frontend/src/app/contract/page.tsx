'use client'
import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, RENT_PROOF_ABI } from '@/lib/contract'
import PageShell from '@/app/components/PageShell'

const C = '#7C3AED' // Purple

export default function ContractPage() {
  const { isConnected } = useAccount()
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: txConf, isSuccess: txOk } = useWaitForTransactionReceipt({ hash: txHash })
  const [al, setAl] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (txOk) {
      setMsg({ text: 'Transaction confirmed successfully!', ok: true })
      setAl(null)
    }
  }, [txOk])

  const call = (fn: string, tag: string) => {
    if (!isConnected) return setMsg({ text: 'Connect wallet first', ok: false })
    setAl(tag)
    setMsg(null)
    try {
      writeContract({ address: CONTRACT_ADDRESS, abi: RENT_PROOF_ABI, functionName: fn as any })
    } catch (e: any) {
      setMsg({ text: e?.message?.slice(0, 60) ?? "Failed", ok: false })
      setAl(null)
    }
  }

  return (
    <PageShell title="Contract Actions" subtitle="Landlord approves return and funds auto-release to tenant." accent={C} watermark="CONTRACT">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Landlord Action */}
        <div style={{ background: '#FFFFFF', border: '1px solid #ECEAE3', borderRadius: 20, padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${C},#1D4ED8)`, borderRadius: '20px 20px 0 0' }} />
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1.2rem', color: '#111110', marginBottom: '0.5rem' }}>Landlord Action</h2>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.82rem', color: '#888580', marginBottom: '1.5rem', lineHeight: 1.65 }}>
            Review the AI Analysis results before approving the return of the security deposit.
          </p>

          <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 12, padding: '1.25rem' }}>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.62rem', color: C, letterSpacing: '0.12em', marginBottom: 12 }}>APPROVE DEPOSIT RETURN</p>
            <button onClick={() => call('approveReturn', 'approve')} disabled={!isConnected || isPending}
              style={{ width: '100%', fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: '0.88rem', padding: '0.8rem', borderRadius: 10, background: C, color: '#fff', border: 'none', cursor: 'pointer', opacity: !isConnected || isPending ? 0.6 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 14px ${C}33` }}>
              {al === 'approve' && isPending ? 'Processing...' : '✓ Approve Return'}
            </button>
          </div>
        </div>

        {/* Tenant Action */}
        <div style={{ background: '#FFFFFF', border: '1px solid #ECEAE3', borderRadius: 20, padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,#1D4ED8,#15803D)`, borderRadius: '20px 20px 0 0' }} />
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1.2rem', color: '#111110', marginBottom: '0.5rem' }}>Tenant Action</h2>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.82rem', color: '#888580', marginBottom: '1.5rem', lineHeight: 1.65 }}>
            Once the landlord has approved the return, you can release the funds back to your wallet.
          </p>

          <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 12, padding: '1.25rem' }}>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.62rem', color: '#1D4ED8', letterSpacing: '0.12em', marginBottom: 12 }}>RELEASE FUNDS TO WALLET</p>
            <button onClick={() => call('releaseDeposit', 'release')} disabled={!isConnected || isPending}
              style={{ width: '100%', fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: '0.88rem', padding: '0.8rem', borderRadius: 10, background: '#1D4ED8', color: '#fff', border: 'none', cursor: 'pointer', opacity: !isConnected || isPending ? 0.6 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 14px #1D4ED833` }}>
              {al === 'release' && isPending ? 'Processing...' : '⟳ Release Deposit'}
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      <div style={{ marginTop: 24 }}>
        {txHash && (
          <div style={{ marginBottom: 16, padding: '1rem', borderRadius: 12, background: txOk ? '#F0FDF4' : '#EEF2FF', border: `1px solid ${txOk ? '#BBF7D0' : '#C7D2FE'}` }}>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', color: txOk ? '#15803D' : C, marginBottom: 6 }}>
              {txConf ? 'Confirming transaction on-chain...' : txOk ? 'Transaction confirmed!' : 'Transaction submitted'}
            </p>
            <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.68rem', color: '#1D4ED8', textDecoration: 'underline' }}>View on Etherscan ↗</a>
          </div>
        )}
        
        {msg && (
          <div style={{ padding: '0.85rem 1.1rem', borderRadius: 12, background: msg.ok ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${msg.ok ? '#BBF7D0' : '#FCA5A5'}` }}>
            <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.85rem', color: msg.ok ? '#15803D' : '#B91C1C' }}>{msg.text}</p>
          </div>
        )}
      </div>
    </PageShell>
  )
}
