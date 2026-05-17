import os
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv

# Đơn giản hóa việc load dotenv
load_dotenv()

# Cấu hình Pool (Chỉ tạo 1 lần duy nhất khi app khởi động)
try:
    db_config = {
    "host": os.getenv("DB_HOST", "autorack.proxy.rlwy.net"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASS", "bcjUcSNlruiZzLpyqtDCexKcNIBoOdba"),
    "database": os.getenv("DB_NAME", "railway"),
    # SỬA DÒNG NÀY: Ép kiểu int và đảm bảo fallback về đúng cổng 22171 nếu ko đọc được .env
    "port": int(os.getenv("DB_PORT", 22171)) 
}

    # Tạo Pool (lưu trữ 5 kết nối sẵn sàng để dùng lại)
    connection_pool = mysql.connector.pooling.MySQLConnectionPool(
        pool_name="mypool",
        pool_size=5,
        **db_config
    )
    print("✅ Kết nối Pool đã sẵn sàng!")
except Exception as e:
    print(f"❌ Lỗi khởi tạo Database Pool: {e}")
    connection_pool = None


def get_db_connection():
    """Lấy một kết nối từ Pool có sẵn thay vì tạo mới"""
    if not connection_pool:
        raise RuntimeError("Database connection pool chưa được khởi tạo!")
    return connection_pool.get_connection()