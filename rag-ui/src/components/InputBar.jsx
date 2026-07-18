import { useState, useRef, useEffect } from 'react'
import './InputBar.css'

export default function InputBar({ onSend, disabled, placeholder }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef()

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'
  }, [value])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const q = value.trim()
    if (!q || disabled) return
    onSend(q)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  return (
    <div className="input-bar-wrap">
      <div className={`input-bar ${disabled ? 'disabled' : ''}`}>
        <textarea
          ref={textareaRef}
          className="input-textarea"
          rows={1}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Ask a question…'}
          disabled={disabled}
        />
        <button
          className={`send-btn ${value.trim() && !disabled ? 'active' : ''}`}
          onClick={submit}
          disabled={disabled || !value.trim()}
          title="Send (Enter)"
        >
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M17 10L3 3l4 7-4 7 14-7z"
              fill="currentColor"/>
          </svg>
        </button>
      </div>
      <p className="input-hint">Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line</p>
    </div>
  )
}
