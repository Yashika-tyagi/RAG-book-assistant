import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import InputBar from './InputBar'
import './ChatView.css'

const API = 'http://localhost:5000'

export default function ChatView({ messages, setMessages, docStatus, onNewDoc }) {
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(query) {
    if (!query.trim() || loading) return
    const userMsg = { role: 'user', text: query, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res  = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      setMessages(prev => [...prev, {
        role: 'ai', text: data.answer, sources: data.sources || [], id: Date.now() + 1
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai', text: `⚠️ ${err.message}`, sources: [], id: Date.now() + 1, isError: true
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-view">

      {/* ── Top Nav ── */}
      <header className="chat-nav">
        <div className="nav-brand">
          <svg viewBox="0 0 28 28" fill="none" width="26" height="26">
            <rect width="28" height="28" rx="8" fill="#6C63FF"/>
            <path d="M8 7h8l4 4v10a1 1 0 01-1 1H8a1 1 0 01-1-1V8a1 1 0 011-1z" fill="white" fillOpacity=".25"/>
            <path d="M16 7l4 4h-4V7z" fill="white" fillOpacity=".6"/>
            <path d="M10 13h8M10 16h6M10 19h4" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span className="nav-title">DocMind</span>
        </div>

        <div className="nav-doc-pill">
          <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
            <path d="M4 2h6l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"
              fill="var(--accent)" fillOpacity=".15" stroke="var(--accent)" strokeWidth="1.3"/>
            <path d="M10 2l4 4h-4V2z" fill="var(--accent)" fillOpacity=".4"/>
          </svg>
          <span>{docStatus.document}</span>
          <div className="nav-status-dot" />
        </div>

        <button className="new-doc-btn" onClick={onNewDoc}>
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
          New Document
        </button>
      </header>

      {/* ── Messages ── */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="empty-glyph">
              <svg viewBox="0 0 56 56" fill="none">
                <rect width="56" height="56" rx="16" fill="var(--accent-light)"/>
                <path d="M16 14h16l10 10v18a2 2 0 01-2 2H16a2 2 0 01-2-2V16a2 2 0 012-2z"
                  fill="var(--accent)" fillOpacity=".2"/>
                <path d="M32 14l10 10H32V14z" fill="var(--accent)" fillOpacity=".5"/>
                <path d="M20 28h16M20 33h12M20 38h8" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="empty-heading">Ready to answer your questions</h2>
            <p className="empty-sub">
              Ask anything about <strong>{docStatus.document?.replace('.pdf','')}</strong>.
              The AI will only answer from the document's content.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={msg.id} message={msg} index={i} />
        ))}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <InputBar
        onSend={sendMessage}
        disabled={loading}
        placeholder={`Ask anything about ${docStatus.document?.replace('.pdf','')}…`}
      />
    </div>
  )
}
