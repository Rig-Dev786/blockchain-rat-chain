'use client'
import { useState, useRef } from 'react'
import { API_BASE_URL } from '@/lib/contract'
import PageShell from '@/app/components/PageShell'

const C = '#B45309'

function UploadZone({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File) => void }) {
  const inp = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  return (
    <div
      onClick={() => inp.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onChange(f) }}
      style={{ border: `2px dashed ${drag ? C : C + '55'}`, borderRadius: 16, minHeight: 180, background: drag ? `${C}08` : '#FAFAF8', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}
    >
      <input ref={inp} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && onChange(e.target.files[0])} />
      {file ? (
        <>
          <img src={URL.createObjectURL(file)} alt={label} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 14, opacity: 0.9 }} />
          <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, background: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: '4px 10px', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.65rem', color: C }}>✓ {file.name}</div>
        </>
      ) : (
        <>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `${C}12`, border: `1.5px solid ${C}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          </div>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: '0.85rem', color: '#5A5750' }}>{label}</p>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.65rem', color: '#C8C4BC' }}>drag & drop or click</p>
        </>
      )}
    </div>
  )
}

export default function UploadPage() {
  const [before, setBefore] = useState<File | null>(null)
  const [after, setAfter] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState({ before: false, after: false })
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const upload = async () => {
    if (!before || !after) return setMsg({ text: 'Select both images first', ok: false })
    setUploading(true); setMsg(null)
    try {
      const up = (f: File, ep: string) => { const fd = new FormData(); fd.append('file', f); return fetch(`${API_BASE_URL}/${ep}`, { method: 'POST', body: fd }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() }) }
      await Promise.all([up(before, 'upload-before'), up(after, 'upload-after')])
      setDone({ before: true, after: true }); setMsg({ text: 'Both images uploaded!', ok: true })
    } catch (e: any) { setMsg({ text: e.message ?? 'Upload failed', ok: false }) }
    finally { setUploading(false) }
  }

  return (
    <PageShell title="Upload Property Images" subtitle="Upload move-in and move-out photos for AI damage comparison." accent={C} watermark="UPLOAD">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[{ label: 'Move-In Photo', file: before, set: setBefore, step: '01', done: done.before },
          { label: 'Move-Out Photo', file: after, set: setAfter, step: '02', done: done.after }].map(z => (
          <div key={z.step}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div>
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.6rem', color: '#A09D97', letterSpacing: '0.1em' }}>STEP {z.step}</p>
                <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1rem', color: '#111110' }}>{z.label}</p>
              </div>
              {z.done && <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.6rem', color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: 999 }}>✓ Uploaded</span>}
            </div>
            <UploadZone label={`Upload ${z.label}`} file={z.file} onChange={z.set} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <button onClick={upload} disabled={!before || !after || uploading}
          style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: '0.9rem', padding: '0.8rem 2.5rem', borderRadius: 14, background: C, color: '#fff', border: 'none', cursor: 'pointer', opacity: (!before || !after) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 4px 18px ${C}33` }}>
          {uploading ? 'Uploading...' : '↑ Upload Both Images'}
        </button>
        {msg && <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.82rem', color: msg.ok ? '#15803D' : '#B91C1C', background: msg.ok ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${msg.ok ? '#BBF7D0' : '#FCA5A5'}`, padding: '0.5rem 1rem', borderRadius: 10 }}>{msg.text}</p>}
      </div>

      <div style={{ marginTop: 28, padding: '1.1rem', borderRadius: 14, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.6rem', color: C, letterSpacing: '0.1em', marginBottom: 4 }}>NEXT STEP</p>
        <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.82rem', color: '#92400E', lineHeight: 1.65 }}>
          After uploading, go to <strong>AI Analysis</strong> in the menu to run damage detection.
        </p>
      </div>
    </PageShell>
  )
}
