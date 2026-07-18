import { useState, useEffect } from 'react'
import SetupPage from './components/SetupPage'
import ChatView from './components/ChatView'
import './App.css'

export default function App() {
  const [messages, setMessages]   = useState([])
  const [docStatus, setDocStatus] = useState({ status: 'no_document', document: null })

  useEffect(() => { fetchStatus() }, [])

  async function fetchStatus() {
    try {
      const res  = await fetch('http://localhost:5000/api/status')
      const data = await res.json()
      setDocStatus(data)
    } catch {
      setDocStatus({ status: 'error', document: null })
    }
  }

  function handleDocumentReady(filename) {
    setDocStatus({ status: 'ready', document: filename })
    setMessages([])
  }

  function handleNewDoc() {
    setDocStatus({ status: 'no_document', document: null })
    setMessages([])
  }

  if (docStatus.status !== 'ready') {
    return <SetupPage onReady={handleDocumentReady} />
  }

  return (
    <ChatView
      messages={messages}
      setMessages={setMessages}
      docStatus={docStatus}
      onNewDoc={handleNewDoc}
    />
  )
}
