import { useMemo, useEffect } from 'react'
import { useHistory } from '../hooks/useHistory'

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend
} from 'recharts'

import styles from './DashboardPage.module.css'

export default function DashboardPage({ onBack }) {

    const { history, refresh, loading } = useHistory()

    useEffect(() => {
        refresh()
    }, [refresh])

    const safeHistory = Array.isArray(history) ? history : []

    const {
        processed,
        failed,
        successRate,
        lineData,
        pieData
    } = useMemo(() => {

        const isFailed = (h) => {
            const d = String(h.docstring || '').trim().toLowerCase()

            if (!d) return true
            if (d.includes('📦 tìm thấy')) return false

            const errorKeywords = [
                'error', '404', 'failed', 'ngrok',
                'ai service', 'status 404'
            ]

            if (errorKeywords.some(k => d.includes(k))) return true
            if (d.length < 30) return true

            const qualityKeywords = [
                'tham số', 'trả về', 'param', 'return',
                'thuật toán', 'sắp xếp', 'tìm kiếm', 'hàm', 'mảng'
            ]

            return !qualityKeywords.some(k => d.includes(k))
        }

        const total = safeHistory.length
        const failed = safeHistory.filter(isFailed).length
        const processed = total - failed

        const successRate = total
            ? ((processed / total) * 100).toFixed(1)
            : 0

        // ===== XỬ LÝ LINE DATA =====
        const map = {}

        safeHistory.forEach(h => {
            const raw = h.created_at || h.timestamp
            if (!raw) return

            const d = new Date(raw)
            if (isNaN(d.getTime())) return

            const date = d.toISOString().split('T')[0]
            map[date] = (map[date] || 0) + 1
        })

        const lineData = Object.entries(map)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([date, count]) => ({ date, count }))

        const pieData = [
            { name: 'Thành công', value: processed },
            { name: 'Thất bại', value: failed }
        ]

        return {
            processed,
            failed,
            successRate,
            lineData,
            pieData
        }

    }, [safeHistory])

    const COLORS = ['#22c55e', '#ef4444']

    return (
        <div className={styles.root}>

            {/* HEADER */}
            <header className={styles.header}>
                <div>
                    <h2>📊 AI System Analytics</h2>
                    <p>Thống kê hoạt động sinh docstring theo thời gian</p>
                </div>

                <button className={styles.btnBack} onClick={onBack}>
                    ← Quay lại
                </button>
            </header>

            {/* LOADING */}
            {loading && (
                <div className={styles.loading}>
                    ⏳ Đang tải dữ liệu...
                </div>
            )}

            {/* STATS */}
            <div className={styles.summary}>
                <div className={styles.card}>
                    <h3>Tổng request</h3>
                    <p>{safeHistory.length}</p>
                </div>

                <div className={styles.card}>
                    <h3>Thành công</h3>
                    <p className={styles.greenText}>{processed}</p>
                </div>

                <div className={styles.card}>
                    <h3>Thất bại</h3>
                    <p className={styles.redText}>{failed}</p>
                </div>

                <div className={styles.card}>
                    <h3>Tỉ lệ thành công</h3>
                    <p>{successRate}%</p>
                </div>
            </div>

            {/* CONTAINER CHIA ĐÔI HAI BIỂU ĐỒ */}
            <div className={styles.chartsContainer}>

                {/* PIE CHART */}
                <div className={styles.chartBox}>
                    <h3>Phân bố kết quả xử lý</h3>

                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={95}
                                innerRadius={60}
                                paddingAngle={5}
                                label
                            >
                                {pieData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* LINE CHART (AreaChart) */}
                <div className={styles.chartBox}>
                    <h3>Số request theo thời gian</h3>

                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                            data={lineData}
                            margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
                        >
                            <defs>
                                <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#ffffff" />

                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                tickLine={false}
                                dx={-5}
                            />

                            <Tooltip />
                            <Legend />

                            <Area
                                type="monotone"
                                dataKey="count"
                                name="Số lượng Request"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorReq)"
                                dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                                activeDot={{ r: 6 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

            </div>

        </div>
    )
}