import { useState } from 'react'
import styles from './ChatMessage.module.css'

export default function ChatMessage({ role, content, isCode, isDocstring }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isBlock = isCode || isDocstring

  return (
    <div className={`${styles.row} ${role === 'user' ? styles.rowUser : ''}`}>
      <div className={`${styles.avatar} ${role === 'user' ? styles.avatarUser : ''}`}>
        {role === 'user' ? 'You' : 'AI'}
      </div>

      <div className={styles.bubble}>
        {isBlock ? (
          <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>
              <span className={styles.codeLabel}>
                {isCode ? 'CODE INPUT' : 'DOCSTRING (VI)'}
              </span>
              <button className={styles.copyBtn} onClick={copy}>
                {copied ? '✓ Đã copy' : 'Copy'}
              </button>
            </div>
            <pre className={`${styles.codePre} ${isDocstring ? styles.codePreDocstring : ''}`}>
              {content}
            </pre>
          </div>
        ) : (
          <div className={`${styles.text} ${role === 'user' ? styles.textUser : ''}`}>
            {content}
          </div>
        )}
      </div>
    </div>
  )
}
