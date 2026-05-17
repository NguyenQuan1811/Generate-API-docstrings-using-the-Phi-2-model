import { useEffect } from 'react'
import { useHistory } from '../hooks/useHistory'
import styles from './AdminPage.module.css'

function StatCard({ label, value, sub, color }) {
  return (
    <div className={styles.statCard} style={{ borderTopColor: color }}>
      <p className={styles.statLabel}>{label.toUpperCase()}</p>
      <p className={styles.statValue}>{value}</p>
      {sub && <p className={styles.statSub}>{sub}</p>}
    </div>
  )
}

export default function AdminPage({ onLogout, onBack, onOpenDashboard }) {
  const { history, loading, refresh } = useHistory()

  useEffect(() => {
    refresh()
  }, [refresh])

  const totalRequests = history.length
  const uniqueUsers = new Set(history.map((h) => h.username)).size
  const avgCodeLen = history.length
    ? Math.round(history.reduce((acc, h) => acc + (h.code?.length || 0), 0) / history.length)
    : 0

  const exportRowCSV = (row) => {
    const header = ['ID', 'Username', 'Code', 'Docstring', 'Timestamp']

    const data = [
      row.id,
      row.username || '',
      `"${(row.code || '').replace(/"/g, '""')}"`,
      `"${(row.docstring || '').replace(/"/g, '""')}"`,
      row.timestamp || ''
    ]

    const csvContent = [header.join(','), data.join(',')].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `row_${row.id}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const exportAllCSV = () => {
    const header = ['ID', 'Username', 'Code', 'Docstring', 'Timestamp']

    const rows = history.map((row) => [
      row.id,
      row.username || '',
      `"${(row.code || '').replace(/"/g, '""')}"`,
      `"${(row.docstring || '').replace(/"/g, '""')}"`,
      row.timestamp || ''
    ])

    const csvContent = [
      header.join(','),
      ...rows.map((r) => r.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'history_all.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <img
            src="/images/hus.png.webp"
            alt="KHTN"
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
          <span className={styles.brand}>Dashboard</span>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.btnBack} onClick={onBack}>
            ← Quay lại chat
          </button>

          <button className={styles.btnRefresh} onClick={refresh}>
            ↻ Làm mới
          </button>
          <button
            className={styles.btnDashboard}
            onClick={onOpenDashboard}
          >
            Dashboard
          </button>

          <button className={styles.btnExportAll} onClick={exportAllCSV}>
            ⬇ Export all
          </button>

        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.stats}>
          <StatCard
            label="Tổng hàm đã xử lý"
            value={totalRequests}
            sub="Lần gọi AI"
            color="var(--red)"
          />
          <StatCard
            label="Người dùng"
            value={uniqueUsers}
            sub="Tài khoản unique"
            color="var(--blue)"
          />
          <StatCard
            label="Độ dài code TB"
            value={avgCodeLen}
            sub="Ký tự / request"
            color="var(--amber)"
          />
        </div>

        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <p className={styles.tableTitle}>
              Lịch sử xử lý ({totalRequests} bản ghi)
            </p>
            <span className={styles.tableHint}>Mới nhất trước</span>
          </div>

          {loading ? (
            <div className={styles.empty}>Đang tải...</div>
          ) : history.length === 0 ? (
            <div className={styles.empty}>
              Chưa có dữ liệu. Server có đang chạy không?
            </div>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.tableEl}>
                <thead>
                  <tr>
                    {['#', 'Người dùng', 'Code (preview)', 'Docstring (preview)', 'Thời gian'].map(
                      (h) => (
                        <th key={h} className={styles.th}>
                          {h.toUpperCase()}
                        </th>
                      )
                    )}
                    <th className={styles.th}>EXPORT</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((row, i) => (
                    <tr key={row.id} className={i % 2 ? styles.rowAlt : ''}>
                      <td className={styles.td}>{row.id}</td>

                      <td className={styles.td}>
                        <span className={styles.userBadge}>{row.username}</span>
                      </td>

                      <td className={styles.td}>
                        <code className={styles.codePreview}>
                          {row.code?.slice(0, 60)}
                          {row.code?.length > 60 ? '...' : ''}
                        </code>
                      </td>

                      <td className={styles.td}>
                        <span className={styles.docPreview}>
                          {row.docstring?.slice(0, 60)}
                          {row.docstring?.length > 60 ? '...' : ''}
                        </span>
                      </td>

                      <td className={styles.td}>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString('vi-VN')
                          : '—'}
                      </td>

                      {/* EXPORT BUTTON */}
                      <td className={styles.td}>
                        <button
                          className={styles.btnExportRow}
                          onClick={() => exportRowCSV(row)}
                        >
                          ⬇ Export
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}