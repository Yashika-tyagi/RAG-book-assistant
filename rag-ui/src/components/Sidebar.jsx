import { useState, useRef } from 'react'
import './Sidebar.css'

const API = 'http://localhost:5000'

// Step states: 'idle' | 'uploaded' | 'indexing' | 'ready' | 'error'

export default function Sidebar({ open, docStatus, onDocumentReady, onToggle }) {
  const [step, setStep]               = useState('idle')   // local upload flow state
  const [uploadedFile, setUploadedFile] = useState(null)   // filename after Step 1
  const [uploading, setUploading]     = useState(false)
  const [msg, setMsg]                 = useState(null)      // { type, text }
  const [dragOver, setDragOver]       = useState(false)
  const fileRef = useRef()

  /* ── Step 1: Upload PDF ── */
  async function handleUpload(file) {
    if (!file || !file.name.endsWith('.pdf')) {
      setMsg({ type: 'error', text: 'Please select a valid PDF file.' })
      return
    }
    setUploading(true)
    setMsg(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const res  = await fetch(`${API}/api/upload`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed.')
      setUploadedFile(data.filename)
      setStep('uploaded')
      setMsg({ type: 'success', text: data.message })
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
      setStep('idle')
    } finally {
      setUploading(false)
    }
  }

  /* ── Step 2: Create Vector Database ── */
  async function handleCreateDB() {
    setStep('indexing')
    setMsg(null)

    try {
      const res  = await fetch(`${API}/api/create-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Indexing failed.')
      setStep('ready')
      setMsg({ type: 'success', text: data.message })
      onDocumentReady(data.document)
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
      setStep('uploaded')   // allow retry
    }
  }

  /* ── Reset ── */
  function handleReset() {
    setStep('idle')
    setUploadedFile(null)
    setMsg(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (step === 'idle') handleUpload(e.dataTransfer.files[0])
  }

  const isReady = docStatus.status === 'ready'

  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>

      {/* ── Brand ── */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <svg viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#6C63FF"/>
            <path d="M8 7h8l4 4v10a1 1 0 01-1 1H8a1 1 0 01-1-1V8a1 1 0 011-1z"
              fill="white" fillOpacity=".25"/>
            <path d="M16 7l4 4h-4V7z" fill="white" fillOpacity=".6"/>
            <path d="M10 13h8M10 16h6M10 19h4" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">DocMind</span>
          <span className="brand-sub">RAG Assistant</span>
        </div>
        <button className="toggle-btn" onClick={onToggle} title="Collapse sidebar">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M13 4L7 10l6 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="sidebar-divider" />

      {/* ── Step Progress ── */}
      <div className="steps-bar">
        <StepDot num={1} label="Upload PDF"  active={step !== 'idle'} current={step === 'idle' || step === 'uploaded'} />
        <div className={`steps-line ${step !== 'idle' && step !== 'uploaded' ? 'done' : ''}`} />
        <StepDot num={2} label="Create DB"   active={step === 'indexing' || step === 'ready'} current={step === 'uploaded'} />
        <div className={`steps-line ${step === 'ready' ? 'done' : ''}`} />
        <StepDot num={3} label="Chat"        active={step === 'ready'} current={step === 'ready'} />
      </div>

      <div className="sidebar-divider" />

      {/* ── Step 1: Drop Zone ── */}
      <div className="upload-section">
        <div className="section-header">
          <p className="section-label">Step 1 — Upload PDF</p>
          {(step === 'uploaded' || step === 'ready') && (
            <button className="reset-btn" onClick={handleReset} title="Upload a different file">
              <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                <path d="M3 8a5 5 0 105 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M3 5v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Change
            </button>
          )}
        </div>

        {step === 'idle' ? (
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
            onClick={() => !uploading && fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={e => handleUpload(e.target.files[0])}
            />
            {uploading ? (
              <div className="upload-loading">
                <div className="spinner" />
                <span>Uploading…</span>
              </div>
            ) : (
              <>
                <div className="drop-icon">
                  <svg viewBox="0 0 40 40" fill="none">
                    <rect width="40" height="40" rx="12" fill="var(--accent-light)"/>
                    <path d="M13 12h9l5 5v11a1 1 0 01-1 1H13a1 1 0 01-1-1V13a1 1 0 011-1z"
                      fill="var(--accent)" fillOpacity=".2"/>
                    <path d="M22 12l5 5h-5v-5z" fill="var(--accent)" fillOpacity=".5"/>
                    <path d="M20 19v7M17 23l3-3 3 3" stroke="var(--accent)" strokeWidth="1.6"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="drop-title">Choose a PDF</p>
                <p className="drop-hint">Click or drag &amp; drop</p>
              </>
            )}
          </div>
        ) : (
          <div className="file-card">
            <div className="file-icon">
              <svg viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#FEE2E2"/>
                <path d="M10 8h8l6 6v10a1 1 0 01-1 1H10a1 1 0 01-1-1V9a1 1 0 011-1z"
                  fill="#EF4444" fillOpacity=".25"/>
                <path d="M18 8l6 6h-6V8z" fill="#EF4444" fillOpacity=".6"/>
                <path d="M12 18h8M12 21h6" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="file-info">
              <span className="file-name" title={uploadedFile}>
                {uploadedFile && uploadedFile.length > 20
                  ? uploadedFile.slice(0, 20) + '…'
                  : uploadedFile}
              </span>
              <span className="file-sub">PDF · Ready to index</span>
            </div>
            {step === 'ready' && (
              <div className="file-check">
                <svg viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" fill="var(--success)"/>
                  <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Step 2: Create Vector DB ── */}
      {(step === 'uploaded' || step === 'indexing' || step === 'ready') && (
        <div className="upload-section" style={{ paddingTop: 0 }}>
          <p className="section-label">Step 2 — Create Vector Database</p>

          {step === 'uploaded' && (
            <button className="create-db-btn" onClick={handleCreateDB}>
              <svg viewBox="0 0 20 20" fill="none" width="17" height="17">
                <ellipse cx="10" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M3 6v4c0 1.657 3.134 3 7 3s7-1.343 7-3V6" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M3 10v4c0 1.657 3.134 3 7 3s7-1.343 7-3v-4" stroke="currentColor" strokeWidth="1.6"/>
              </svg>
              Create Vector Database
            </button>
          )}

          {step === 'indexing' && (
            <div className="indexing-card">
              <div className="indexing-steps">
                <IndexingStep label="Loading PDF pages…"        done />
                <IndexingStep label="Splitting into chunks…"    done />
                <IndexingStep label="Generating embeddings…"    active />
                <IndexingStep label="Storing in ChromaDB…"      />
              </div>
            </div>
          )}

          {step === 'ready' && (
            <div className="db-ready-card">
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                <ellipse cx="10" cy="6" rx="7" ry="3" fill="var(--success)" fillOpacity=".2" stroke="var(--success)" strokeWidth="1.5"/>
                <path d="M3 6v4c0 1.657 3.134 3 7 3s7-1.343 7-3V6" stroke="var(--success)" strokeWidth="1.5"/>
                <path d="M3 10v4c0 1.657 3.134 3 7 3s7-1.343 7-3v-4" stroke="var(--success)" strokeWidth="1.5"/>
              </svg>
              <span>Vector DB ready</span>
            </div>
          )}
        </div>
      )}

      {/* ── Feedback message ── */}
      {msg && (
        <div className="msg-wrapper">
          <div className={`upload-msg ${msg.type}`}>
            {msg.type === 'success'
              ? <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            }
            <span>{msg.text}</span>
          </div>
        </div>
      )}

      <div className="sidebar-divider" />

      {/* ── System Status ── */}
      <div className="status-section">
        <p className="section-label">Status</p>
        <div className="status-card">
          <div className={`status-dot ${isReady ? 'ready' : 'idle'}`} />
          <div className="status-info">
            <span className="status-label">{isReady ? 'Ready to Chat' : 'Awaiting Setup'}</span>
            <span className="status-doc">
              {docStatus.document
                ? docStatus.document.length > 22
                  ? docStatus.document.slice(0, 22) + '…'
                  : docStatus.document
                : 'No document indexed'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <div className="model-pill">
          <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
            <circle cx="8" cy="8" r="3" fill="var(--accent)"/>
            <circle cx="8" cy="8" r="6.5" stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="3 2"/>
          </svg>
          mistral-small-2506
        </div>
      </div>
    </aside>
  )
}

function StepDot({ num, label, active, current }) {
  return (
    <div className="step-item">
      <div className={`step-dot ${active ? 'active' : ''} ${current ? 'current' : ''}`}>
        {active && !current ? (
          <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <span>{num}</span>
        )}
      </div>
      <span className="step-label">{label}</span>
    </div>
  )
}

function IndexingStep({ label, done, active }) {
  return (
    <div className={`indexing-row ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
      <div className="idx-icon">
        {done
          ? <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><path d="M2 6l3 3 5-5" stroke="var(--success)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          : active
            ? <div className="idx-spinner" />
            : <div className="idx-circle" />
        }
      </div>
      <span>{label}</span>
    </div>
  )
}
