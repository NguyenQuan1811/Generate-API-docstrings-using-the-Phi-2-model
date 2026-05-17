import mysql.connector

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",  # <--- ĐỂ TRỐNG Ở ĐÂY
        database="docstring_db"
    )
    if conn.is_connected():
        print("✅ KẾT NỐI THÀNH CÔNG!")
        conn.close()
except Exception as e:
    print(f"❌ KẾT NỐI THẤT BẠI. LỖI: {e}")