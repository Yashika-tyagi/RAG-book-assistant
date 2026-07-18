import './TypingIndicator.css'

export default function TypingIndicator() {
  return (
    <div className="typing-row">
      <div className="avatar ai-avatar-sm">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#6C63FF"/>
          <path d="M8 10a1 1 0 011-1h6a1 1 0 011 1v4a1 1 0 01-1 1h-1l-1 2-1-2H9a1 1 0 01-1-1v-4z"
            fill="white" fillOpacity=".9"/>
          <circle cx="10.5" cy="12" r="0.7" fill="#6C63FF"/>
          <circle cx="12" cy="12" r="0.7" fill="#6C63FF"/>
          <circle cx="13.5" cy="12" r="0.7" fill="#6C63FF"/>
        </svg>
      </div>
      <div className="typing-bubble">
        <span className="dot" style={{ animationDelay: '0ms' }} />
        <span className="dot" style={{ animationDelay: '160ms' }} />
        <span className="dot" style={{ animationDelay: '320ms' }} />
      </div>
    </div>
  )
}
