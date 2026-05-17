import mysql.connector
import os
from dotenv import load_dotenv
import auth  # Import auth để băm mật khẩu

load_dotenv()

# Cấu hình từ .env
DB_HOST = os.getenv("DB_HOST", "autorack.proxy.rlwy.net")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "bcjUcSNlruiZzLpyqtDCexKcNIBoOdba")
DB_NAME = os.getenv("DB_NAME", "railway")
# BỔ SUNG: Lấy cổng kết nối từ file .env, nếu không thấy thì mặc định dùng 22171
DB_PORT = int(os.getenv("DB_PORT", 22171))

def setup():
    try:
        print(f"🔄 Đang cố gắng kết nối tới {DB_HOST}:{DB_PORT}...")
        
        # 1. Kết nối không chọn DB để tạo DB trước (BỔ SUNG THAM SỐ PORT)
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
        cursor = conn.cursor()
        
        # Initialize database
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4")
        print(f"✅ Database {DB_NAME} initialized.")
        conn.close()

        # 2. Kết nối vào DB để tạo bảng (BỔ SUNG THAM SỐ PORT)
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME,
            port=DB_PORT
        )
        cursor = conn.cursor()

        print("🗑️ Đang dọn dẹp các bảng cũ lỗi...")
        cursor.execute("DROP TABLE IF EXISTS history")
        cursor.execute("DROP TABLE IF EXISTS docstrings")
        cursor.execute("DROP TABLE IF EXISTS codes")
        
        # Bảng Users
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        """)
        
        # Bảng Codes
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Bảng Docstrings
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS docstrings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Bảng History (Lưu liên kết)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                code_id INT,
                docstring_id INT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (code_id) REFERENCES codes(id),
                FOREIGN KEY (docstring_id) REFERENCES docstrings(id)
            )
        """)
        
        print("✅ Tables initialized: users, codes, docstrings, history.")

        # Seed data
        cursor.execute("SELECT COUNT(*) FROM users WHERE id = 1")
        if cursor.fetchone()[0] == 0:
            hashed_pw = auth.hash_password("password123")
            cursor.execute(
                "INSERT INTO users (id, username, email, password) VALUES (%s, %s, %s, %s)",
                (1, "testuser", "test@example.com", hashed_pw)
            )
            conn.commit()
            print("👤 Default user created (username: testuser, password: password123).")

        conn.close()
        print("🎉 Setup completed successfully!")

    except Exception as e:
        print(f"❌ Error during setup: {e}")

if __name__ == "__main__":
    setup()