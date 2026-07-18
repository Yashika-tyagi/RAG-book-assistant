import { useState, useRef } from 'react'
import './SetupPage.css'

const API = 'http://localhost:5000'

export default function SetupPage({ onReady }) {
  const [uploadedFile, setUploadedFile]   = useState(null)   // { name, size }
  const [uploading, setUploading]         = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError]     = useState(null)

  const [dbStatus, setDbStatus]           = useState('idle')  // idle | processing | done | error
  const [dbError, setDbError]             = useState(null)
  const [dbDoc, setDbDoc]                 = useState(null)

  const [dragOver, setDragOver]           = useState(false)
  const fileRef = useRef()

  /* ── Upload PDF ── */
  async function handleFile(file) {
    if (!file || !file.name.endsWith('.pdf')) {
      setUploadError('Please select a valid PDF file.')
      return
    }
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)
    setDbStatus('idle')

    const form = new FormData()
    form.append('file', file)

    try {
      const res  = await fetch(`${API}/api/upload`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed.')
      setUploadedFile({ name: file.name, size: formatSize(file.size) })
      setUploadSuccess(true)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  /* ── Create Vector DB ── */
  async function handleCreateDB() {
    setDbStatus('processing')
    setDbError(null)
    try {
      const res  = await fetch(`${API}/api/create-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Indexing failed.')
      setDbStatus('done')
      setDbDoc(data.document)
      setTimeout(() => onReady(data.document), 900)
    } catch (err) {
      setDbStatus('error')
      setDbError(err.message)
    }
  }

  function handleRemove() {
    setUploadedFile(null)
    setUploadSuccess(false)
    setUploadError(null)
    setDbStatus('idle')
    setDbError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false)
    if (!uploading) handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="setup-page">
      <div className="setup-card">

        {/* ── Header ── */}
        <div className="setup-header">
          <div className="setup-logo">
            <svg viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="#6C63FF"/>
              <path d="M10 9h10l7 7v13a1 1 0 01-1 1H10a1 1 0 01-1-1V10a1 1 0 011-1z" fill="white" fillOpacity=".2"/>
              <path d="M20 9l7 7h-7V9z" fill="white" fillOpacity=".55"/>
              <path d="M13 18h10M13 22h8M13 26h5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="setup-title">RAG Book Assistant</h1>
            <p className="setup-subtitle">Upload a PDF and ask questions from the document</p>
          </div>
        </div>

        {/* ── Section label ── */}
        <p className="field-label">Upload a PDF book</p>

        {/* ── Drop Zone Bar ── */}
        <div
          className={`dropbar ${dragOver ? 'drag-over' : ''} ${uploading ? 'busy' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />

          <div className="dropbar-left">
            {uploading ? (
              <div className="bar-spinner" />
            ) : (
              <svg className="cloud-icon" viewBox="0 0 28 22" fill="none">
                <path d="M8 22a6 6 0 01-1-11.917A8 8 0 1122.917 13H24a4 4 0 010 8H8z"
                  stroke="var(--text-muted)" strokeWidth="1.6" strokeLinejoin="round"/>
                <path d="M14 16v-6M11 13l3-3 3 3" stroke="var(--accent)" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <div className="dropbar-text">
              <span className="dropbar-main">
                {uploading ? 'Uploading…' : 'Drag and drop file here'}
              </span>
              <span className="dropbar-hint">Limit 200MB per file • PDF</span>
            </div>
          </div>

          <button
            className="browse-btn"
            onClick={() => !uploading && fileRef.current.click()}
            disabled={uploading}
          >
            Browse files
          </button>
        </div>

        {/* ── File Row (after upload) ── */}
        {uploadedFile && (
          <div className="file-row">
            <svg className="file-row-icon" viewBox="0 0 24 24" fill="none">
              <path d="M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z"
                fill="var(--accent)" fillOpacity=".12" stroke="var(--accent)" strokeWidth="1.4"/>
              <path d="M15 2l5 5h-5V2z" fill="var(--accent)" fillOpacity=".35"/>
              <path d="M9 13h6M9 17h4" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <span className="file-row-name">{uploadedFile.name}</span>
            <span className="file-row-size">{uploadedFile.size}</span>
            <button className="file-row-remove" onClick={handleRemove} title="Remove file">
              <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── Upload error ── */}
        {uploadError && (
          <div className="status-bar error">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            {uploadError}
          </div>
        )}

        {/* ── Upload success banner ── */}
        {uploadSuccess && (
          <div className="status-bar success">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            PDF uploaded successfully!
          </div>
        )}

        {/* ── Create Vector DB button ── */}
        {uploadSuccess && dbStatus === 'idle' && (
          <button className="create-db-btn" onClick={handleCreateDB}>
            Create Vector Database
          </button>
        )}

        {/* ── Processing row ── */}
        {dbStatus === 'processing' && (
          <div className="processing-row">
            <div className="proc-spinner" />
            <span>Processing document…</span>
          </div>
        )}

        {/* ── DB done ── */}
        {dbStatus === 'done' && (
          <div className="status-bar success">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Vector database created for <strong>&nbsp;{dbDoc}</strong>. Opening chat…
          </div>
        )}

        {/* ── DB error ── */}
        {dbStatus === 'error' && (
          <>
            <div className="status-bar error">
              <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {dbError}
            </div>
            <button className="create-db-btn" onClick={handleCreateDB}>
              Retry
            </button>
          </>
        )}

      </div>
    </div>
  )
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  if (bytes >= 1024)        return (bytes / 1024).toFixed(0) + ' KB'
  return bytes + ' B'
}
