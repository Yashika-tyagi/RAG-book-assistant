import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import InputBar from './InputBar'
import './ChatWindow.css'

const API = 'http://localhost:5000'

export default function ChatWindow({ messages, setMessages, docStatus, onToggleSidebar, sidebarOpen }) {
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
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Something went wrong.')

      const aiMsg = {
        role: 'ai',
        text: data.answer,
        sources: data.sources || [],
        id: Date.now() + 1
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `⚠️ ${err.message}`,
        sources: [],
        id: Date.now() + 1,
        isError: true
      }])
    } finally {
      setLoading(false)
    }
  }

  const isReady = docStatus.status === 'ready'

  return (
    <div className="chat-window">
      {/* Top bar */}
      <header className="chat-header">
        {!sidebarOpen && (
          <button className="header-toggle" onClick={onToggleSidebar} title="Open sidebar">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <div className="chat-header-title">
          <span className="chat-title">
            {docStatus.document
              ? docStatus.document.replace('.pdf', '')
              : 'DocMind'}
          </span>
          <span className="chat-subtitle">
            {isReady
              ? `Chatting with ${docStatus.document}`
              : 'Upload a PDF from the sidebar to start'}
          </span>
        </div>
        <div className={`header-badge ${isReady ? 'ready' : 'idle'}`}>
          <span className="badge-dot" />
          {isReady ? 'Ready' : 'No Document'}
        </div>
      </header>

      {/* Messages */}
      <div className="messages-area">
        {messages.length === 0 && (
          <EmptyState isReady={isReady} docName={docStatus.document} />
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={msg.id} message={msg} index={i} />
        ))}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <InputBar
        onSend={sendMessage}
        disabled={!isReady || loading}
        placeholder={
          !isReady
            ? 'Upload a PDF first…'
            : 'Ask anything about your document…'
        }
      />
    </div>
  )
}

function EmptyState({ isReady, docName }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        {isReady ? (
          <svg viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="18" fill="var(--accent-light)"/>
            <path d="M20 16h16l10 10v22a2 2 0 01-2 2H20a2 2 0 01-2-2V18a2 2 0 012-2z" fill="var(--accent)" fillOpacity=".25"/>
            <path d="M36 16l10 10H36V16z" fill="var(--accent)" fillOpacity=".6"/>
            <path d="M24 30h16M24 36h12M24 42h8" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="18" fill="#F0EDE8"/>
            <path d="M20 16h16l10 10v22a2 2 0 01-2 2H20a2 2 0 01-2-2V18a2 2 0 012-2z" fill="var(--text-muted)" fillOpacity=".25"/>
            <path d="M36 16l10 10H36V16z" fill="var(--text-muted)" fillOpacity=".5"/>
            <path d="M32 38v-8M32 42v1" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      {isReady ? (
        <>
          <h2 className="empty-title">Ready to answer your questions</h2>
          <p className="empty-desc">
            Ask anything about <strong>{docName}</strong>.<br/>
            The AI will only answer from the document's content.
          </p>
          <div className="empty-suggestions">
            {['Summarize this document', 'What are the key concepts?', 'Explain the main findings'].map(s => (
              <span key={s} className="suggestion-chip">{s}</span>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 className="empty-title">No document loaded</h2>
          <p className="empty-desc">Upload a PDF from the sidebar to start chatting with it.</p>
        </>
      )}
    </div>
  )
}
