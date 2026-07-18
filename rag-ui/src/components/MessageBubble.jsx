import { useState } from 'react'
import './MessageBubble.css'

export default function MessageBubble({ message, index }) {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const isUser = message.role === 'user'

  return (
    <div
      className={`bubble-row ${isUser ? 'user' : 'ai'}`}
      style={{ animationDelay: `${Math.min(index * 0.04, 0.2)}s` }}
    >
      {!isUser && (
        <div className="avatar ai-avatar">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#6C63FF"/>
            <path d="M8 10a1 1 0 011-1h6a1 1 0 011 1v4a1 1 0 01-1 1h-1l-1 2-1-2H9a1 1 0 01-1-1v-4z"
              fill="white" fillOpacity=".9"/>
            <circle cx="10.5" cy="12" r="0.7" fill="#6C63FF"/>
            <circle cx="12" cy="12" r="0.7" fill="#6C63FF"/>
            <circle cx="13.5" cy="12" r="0.7" fill="#6C63FF"/>
          </svg>
        </div>
      )}

      <div className={`bubble-content ${isUser ? 'user' : 'ai'} ${message.isError ? 'error' : ''}`}>
        <p className="bubble-text">{message.text}</p>

        {/* Sources accordion — only for AI messages */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="sources-section">
            <button
              className="sources-toggle"
              onClick={() => setSourcesOpen(o => !o)}
            >
              <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                <path d="M3 4h10M3 8h8M3 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
              <svg
                className={`chevron ${sourcesOpen ? 'open' : ''}`}
                viewBox="0 0 12 12" fill="none" width="11" height="11"
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {sourcesOpen && (
              <div className="sources-list">
                {message.sources.map((src, i) => (
                  <div key={i} className="source-item">
                    <span className="source-num">{i + 1}</span>
                    <p className="source-text">{src}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="avatar user-avatar">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#F0EDE8"/>
            <circle cx="12" cy="9" r="3" fill="#A8A29E"/>
            <path d="M6 19.5c0-3.314 2.686-6 6-6s6 2.686 6 6" fill="#A8A29E"/>
          </svg>
        </div>
      )}
    </div>
  )
}
