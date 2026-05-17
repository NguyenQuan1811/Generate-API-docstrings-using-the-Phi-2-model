import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

# Cấu hình từ .env
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "docstring_db")

def fix():
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME
        )
        cursor = conn.cursor()
        
        print("Fixing database structure...")
        
        # Kiểm tra và thêm cột timestamp nếu chưa có
        try:
            cursor.execute("ALTER TABLE history ADD COLUMN timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            conn.commit()
            print("Added 'timestamp' column to 'history' table.")
        except mysql.connector.Error as err:
            if err.errno == 1060: # Duplicate column name
                print("Column 'timestamp' already exists.")
            else:
                print(f"Error adding column: {err}")

        conn.close()
        print("Database fix completed!")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    fix()
