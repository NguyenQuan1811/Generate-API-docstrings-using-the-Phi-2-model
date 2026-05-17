import { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import ChatMessage from '../components/ChatMessage'
import { api } from '../services/api'
import styles from './ChatPage.module.css'

const EXAMPLES = [
  'def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n   return arr',
  'class DatabaseManager:\n    def __init__(self, db_url):',
  'async def fetch_user_data(user_id):',
]

export default function ChatPage({
  user,
  onLogout,
  history,
  onHistoryUpdate,
  onOpenAdmin,
}) {

  const [sessions, setSessions] = useState([
    { id: Date.now(), messages: [] }
  ])

  const [activeId, setActiveId] = useState(() => Date.now())

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const [file, setFile] = useState(null)

  // ✅ drag state
  const [dragging, setDragging] = useState(false)

  const fileRef = useRef()
  const bottomRef = useRef()

  const currentSession = sessions.find(
    (s) => s.id === activeId
  )

  // =========================
  // ADD MESSAGE
  // =========================
  const addMessage = (sessionId, msg) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
            ...s,
            messages: [...s.messages, msg]
          }
          : s
      )
    )
  }

  // =========================
  // REPLACE LAST MESSAGE
  // =========================
  const replaceLastMessage = (sessionId, msg) => {
    setSessions((prev) =>
      prev.map((s) => {

        if (s.id !== sessionId) return s

        const msgs = s.messages.slice(0, -1)

        return {
          ...s,
          messages: [...msgs, msg]
        }
      })
    )
  }

  // =========================
  // NEW SESSION
  // =========================
  const newSession = () => {

    const id = Date.now()

    setSessions((prev) => [
      ...prev,
      {
        id,
        messages: []
      }
    ])

    setActiveId(id)
  }

  // =========================
  // DRAG DROP
  // =========================
  const handleDragOver = (e) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragging(false)
  }

  const handleDrop = (e) => {

    e.preventDefault()

    setDragging(false)

    const droppedFile = e.dataTransfer.files?.[0]

    if (!droppedFile) return

    const allowed = ['py', 'txt', 'js', 'java']

    const ext = droppedFile.name
      .split('.')
      .pop()
      ?.toLowerCase()

    if (!allowed.includes(ext)) {
      alert('Chỉ hỗ trợ file .py .txt .js .java')
      return
    }

    setFile(droppedFile)
  }
  const send = async () => {

    const textContent = input.trim()

    if (!file && !textContent) return

    const sid = activeId

    setLoading(true)

    const userMessageContent = file
      ? `📎 Gửi file: ${file.name}`
      : textContent

    addMessage(sid, {
      role: 'user',
      content: userMessageContent,
      isCode: !file
    })

    addMessage(sid, {
      role: 'assistant',
      content:
        '⏳ Đang gửi dữ liệu lên AI để sinh docstring...'
    })

    const fileToUpload = file

    setInput('')
    setFile(null)

    try {

      let assistantContent = ''


      if (fileToUpload) {

        const data = await api.uploadCode(fileToUpload)

        if (
          data.results &&
          data.results.length > 0
        ) {
          assistantContent =
            data.results[0].docstring
        } else {
          assistantContent =
            'Không tìm thấy kết quả phân tích file.'
        }

      } else {


        const data = await api.addCode(
          user.user_id,
          textContent
        )

        assistantContent =
          data.final_docstring ||
          'Không sinh được docstring.'
      }


      replaceLastMessage(sid, {
        role: 'assistant',
        content: assistantContent,
        isDocstring: true,
      })

      onHistoryUpdate()

    } catch (e) {

      console.error('Lỗi khi gửi code:', e)

      replaceLastMessage(sid, {
        role: 'assistant',
        content: `❌ Lỗi: ${e.message || JSON.stringify(e)
          }`,
      })

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [sessions, activeId])

  const sidebarHistory = history
    .slice(0, 30)
    .map((h) => ({
      id: h.id,
      code: h.code
    }))

  return (

    <div
      className={`${styles.root} ${dragging ? styles.dragging : ''
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Sidebar
        history={sidebarHistory}
        activeId={activeId}

        onSelect={(id) => {

          const existing = sessions.find(
            s => s.id === id
          )

          if (!existing) {

            const found = history.find(
              h => h.id === id
            )

            if (found) {

              setSessions(prev => [
                ...prev,
                {
                  id: found.id,
                  messages: [
                    {
                      role: 'user',
                      content: found.code,
                      isCode: true
                    },
                    {
                      role: 'assistant',
                      content: found.docstring,
                      isDocstring: true
                    },
                  ]
                }
              ])
            }
          }

          setActiveId(id)
        }}

        onNew={newSession}

        username={user.username}

        onLogout={onLogout}

        onAdminDashboard={onOpenAdmin}
      />


      <div className={styles.main}>

        {/* HEADER */}
        <header className={styles.header}>

          <div>
            <p className={styles.headerTitle}>
              Chúng ta nên bắt đầu từ đâu?
            </p>

            <p className={styles.headerSub}>
              Dán code Python vào để AI sinh
              docstring tiếng Việt
            </p>
          </div>

          <span className={styles.sessionId}>
            Session #
            {String(activeId).slice(-4)}
          </span>

        </header>

        <div className={styles.messages}>

          {currentSession?.messages.length === 0 && (

            <div className={styles.empty}>

              <div className={styles.emptyIcon}></div>

              <p className={styles.emptyText}>
                Nhập code Python bên dưới để bắt đầu
              </p>

              <div className={styles.examples}>

                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    className={styles.exampleBtn}
                    onClick={() => setInput(ex)}
                  >
                    {ex}
                  </button>
                ))}

              </div>

            </div>
          )}

          {/* CHAT */}
          {currentSession?.messages.map((msg, i) => (
            <ChatMessage
              key={i}
              {...msg}
            />
          ))}

          <div ref={bottomRef} />

        </div>

        {/* ========================= */}
        {/* INPUT AREA */}
        {/* ========================= */}
        <div className={styles.inputArea}>

          {/* FILE TAG */}
          {file && (
            <div className={styles.fileTag}>

              <span>
                📎 {file.name}
              </span>

              <button
                onClick={() => setFile(null)}
                className={styles.fileRemove}
              >
                ×
              </button>

            </div>
          )}

          {/* INPUT ROW */}
          <div className={styles.inputRow}>

            {/* TEXTAREA */}
            <textarea
              className={styles.textarea}

              value={input}

              onChange={(e) =>
                setInput(e.target.value)
              }

              onKeyDown={(e) =>
                e.key === 'Enter' &&
                e.ctrlKey &&
                send()
              }

              placeholder="Nhập code Python... (Ctrl+Enter để gửi)"

              rows={3}
            />

            {/* ACTIONS */}
            <div className={styles.actions}>

              {/* FILE INPUT */}
              <input
                ref={fileRef}

                type="file"

                accept=".py,.txt,.js,.java"

                style={{ display: 'none' }}

                onChange={(e) =>
                  setFile(e.target.files[0])
                }
              />

              {/* UPLOAD */}
              <button
                className={styles.btnUpload}
                onClick={() =>
                  fileRef.current.click()
                }
              >
                📎
              </button>

              {/* SEND */}
              <button
                className={styles.btnSend}
                onClick={send}
                disabled={loading}
              >
                {loading ? '...' : 'Gửi →'}
              </button>

            </div>

          </div>

          {/* HINT */}
          <p className={styles.hint}>
            Ctrl+Enter để gửi
            &nbsp;•&nbsp;
            Kéo thả file .py
            &nbsp;•&nbsp;
            Upload file code
          </p>

        </div>

      </div>

    </div>
  )
}