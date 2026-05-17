import { api } from '../services/api'
import { useState, useCallback, useEffect } from 'react'

export function useHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // =========================
  // LOAD HISTORY
  // =========================
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await api.getHistory()

      // đảm bảo luôn là array
      const safeData = Array.isArray(data) ? data : []

      // sort mới nhất lên đầu
      const sorted = safeData.sort((a, b) => {
        const da = new Date(a.created_at || a.timestamp || 0)
        const db = new Date(b.created_at || b.timestamp || 0)

        return db - da
      })

      setHistory(sorted)

    } catch (err) {
      console.error('Load history failed:', err)

      setHistory([])
      setError(
        err?.message ||
        'Không thể tải lịch sử'
      )

    } finally {
      setLoading(false)
    }
  }, [])

  // =========================
  // AUTO LOAD
  // =========================
  useEffect(() => {
    refresh()
  }, [refresh])

  // =========================
  // CLEAR HISTORY LOCAL
  // =========================
  const clearHistory = () => {
    setHistory([])
  }

  // =========================
  // ADD ITEM LOCAL
  // =========================
  const addHistoryItem = (item) => {
    if (!item) return

    setHistory(prev => [item, ...prev])
  }

  // =========================
  // REMOVE ITEM
  // =========================
  const removeHistoryItem = (id) => {
    setHistory(prev =>
      prev.filter(item => item.id !== id)
    )
  }

  return {
    history,
    loading,
    error,

    refresh,
    clearHistory,

    addHistoryItem,
    removeHistoryItem,
  }
}