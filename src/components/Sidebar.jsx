import { useState } from 'react'
import styles from './Sidebar.module.css'

export default function Sidebar({
  history,
  activeId,
  onSelect,
  onNew,
  username,
  onLogout,
  onAdminDashboard, // thêm prop
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''
        }`}
    >
      <div className={styles.header}>
        <img
          src="/images/hus.png.webp"
          alt="KHTN"
          style={{
            width: 28,
            height: 28,
            objectFit: 'contain',
          }}
        />

        {!collapsed && (
          <span className={styles.brand}>
            DocString AI
          </span>
        )}

        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <div className={styles.newBtn}>
        <button
          className={styles.btnNew}
          onClick={onNew}
        >
          <span>+</span>
          {!collapsed && 'Đoạn chat mới'}
        </button>
      </div>

      {/* ===== ADMIN DASHBOARD BUTTON ===== */}
      <div className={styles.adminWrap}>
        <button
          className={styles.adminBtn}
          onClick={onAdminDashboard}
        >
          <span></span>
          {!collapsed && 'Dashboard'}
        </button>
      </div>

      {!collapsed && (
        <p className={styles.sectionLabel}>
          LỊCH SỬ
        </p>
      )}

      <nav className={styles.historyList}>
        {history.map((h) => (
          <button
            key={h.id}
            className={`${styles.historyItem} ${activeId === h.id
              ? styles.historyItemActive
              : ''
              }`}
            onClick={() => onSelect(h.id)}
          >
            <span className={styles.historyHeart}>
            </span>

            {!collapsed && (
              <span className={styles.historyText}>
                {h.code?.slice(0, 32) ||
                  'Chat ' + h.id}
                ...
              </span>
            )}
          </button>
        ))}

        {history.length === 0 && !collapsed && (
          <p className={styles.empty}>
            Chưa có lịch sử
          </p>
        )}
      </nav>

      <div className={styles.footer}>
        {!collapsed && (
          <div className={styles.userInfo}>
            <p className={styles.userName}>
              {username}
            </p>

            <p className={styles.userRole}>
              Người dùng
            </p>
          </div>
        )}

        <button
          className={styles.logoutBtn}
          onClick={onLogout}
        >
          {collapsed ? '↩' : 'Đăng xuất'}
        </button>
      </div>
    </aside>
  )
}