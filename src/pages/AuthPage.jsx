import { useState } from 'react'
import { api } from '../services/api'
import styles from './AuthPage.module.css'

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', password: '', email: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setForm({ username: '', password: '', email: '' })
  }

  const submit = async () => {
    if (!form.username || !form.password) {
      setError('Vui lòng điền đầy đủ thông tin.')
      return
    }

    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (!form.email) {
          setError('Vui lòng nhập email.')
          setLoading(false)
          return
        }

        await api.register(form.username, form.email, form.password)
        setError('✓ Đăng ký thành công! Hãy đăng nhập.')
        switchMode('login')
      } else {
        const data = await api.login(form.username, form.password)
        onLogin({ ...data, username: form.username, role: 'user' })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const goAdmin = async () => {
    if (!form.username || !form.password) {
      setError('Nhập tài khoản và mật khẩu để vào Admin.')
      return
    }

    setLoading(true)

    try {
      const data = await api.login(form.username, form.password)
      onLogin({ ...data, username: form.username, role: 'admin' })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <img
            src="/images/hus.png.webp"
            alt="KHTN"
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
          <span className={styles.title}>DocString AI</span>
        </div>

        <p className={styles.subtitle}>
          Sinh docstring tự động bằng AI
        </p>

        {/* TAB */}
        <div className={styles.tabs}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              className={`${styles.tab} ${mode === m ? styles.tabActive : ''}`}
              onClick={() => switchMode(m)}
            >
              {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        {/* FIELDS */}
        <div className={styles.fields}>
          <Field
            label="Tên đăng nhập"
            name="username"
            type="text"
            value={form.username}
            onChange={handle}
            onEnter={submit}
          />

          {mode === 'register' && (
            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handle}
              onEnter={submit}
            />
          )}

          {/* PASSWORD WITH EYE */}
          <Field
            label="Mật khẩu"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handle}
            onEnter={submit}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: 'var(--text-muted)'
                }}
              >
                {showPassword ? '👁‍🗨' : '👁'}
              </button>
            }
          />
        </div>

        {/* ERROR */}
        {error && (
          <div
            className={`${styles.alert} ${error.startsWith('✓')
              ? styles.alertSuccess
              : styles.alertError
              }`}
          >
            {error}
          </div>
        )}

        {/* BUTTON */}
        <button
          className={styles.btnPrimary}
          onClick={submit}
          disabled={loading}
        >
          {loading
            ? 'Đang xử lý...'
            : mode === 'login'
              ? 'ĐĂNG NHẬP'
              : 'ĐĂNG KÝ'}
        </button>
      </div>
    </div>
  )
}

/* ================= FIELD ================= */

function Field({
  label,
  name,
  type,
  value,
  onChange,
  onEnter,
  rightIcon
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          color: 'var(--text-muted)',
          fontSize: 11,
          letterSpacing: '0.05em',
          marginBottom: 6
        }}
      >
        {label.toUpperCase()}
      </label>

      <div style={{ position: 'relative' }}>
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={(e) => e.key === 'Enter' && onEnter()}
          style={{
            width: '100%',
            padding: '10px 40px 10px 14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text)',
            fontSize: 14,
            outline: 'none'
          }}
        />

        {rightIcon && (
          <div
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)'
            }}
          >
            {rightIcon}
          </div>
        )}
      </div>
    </div>
  )
}