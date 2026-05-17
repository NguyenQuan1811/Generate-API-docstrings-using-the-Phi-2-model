import requests
import os

BASE_URL = "http://127.0.0.1:8000"

def test_upload_code():
    print("--- 1. ĐĂNG NHẬP ĐỂ LẤY TOKEN ---")
    # Thay bằng tài khoản thật của bạn
    login_data = {
        "username": "quydzwa",      
        "password": "quydk123" 
    }
    
    login_response = requests.post(f"{BASE_URL}/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Đăng nhập thất bại: {login_response.text}")
        return
        
    token = login_response.json().get("access_token")
    print("✅ Đăng nhập thành công!\n")
    
    print("--- 2. TẠO FILE MẪU ĐỂ TEST ---")
    # Tạo nhanh 2 file python mẫu trên máy tính để test upload
    with open("sample1.py", "w", encoding="utf-8") as f:
        f.write("def tinhtong(a, b):\n    return a + b\n")
        
    with open("sample2.py", "w", encoding="utf-8") as f:
        f.write("def chao(ten):\n    print(f'Xin chào {ten}')\n")
        
    print("✅ Đã tạo file sample1.py và sample2.py\n")

    print("--- 3. TEST GỌI API /upload-code ---")
    headers = {
        "Authorization": f"Bearer {token}"
        # Lưu ý: Khi upload file bằng requests, KHÔNG set header Content-Type là application/json
        # requests sẽ tự động set Content-Type là multipart/form-data
    }
    
    # Mở các file để chuẩn bị upload
    # Cấu trúc: ('tên_trường_trong_api', (tên_file, file_object, kiểu_mime))
    # Trong API của bạn, biến nhận vào tên là `files`
    files_to_upload = [
        ('files', ('sample1.py', open('sample1.py', 'rb'), 'text/x-python')),
        ('files', ('sample2.py', open('sample2.py', 'rb'), 'text/x-python'))
    ]
    
    print("Đang gửi file lên server...")
    upload_response = requests.post(f"{BASE_URL}/upload-code", files=files_to_upload, headers=headers)
    
    # Đóng file sau khi gửi xong
    for field_name, file_tuple in files_to_upload:
        file_tuple[1].close()
        
    # Xóa file mẫu (Tùy chọn)
    os.remove("sample1.py")
    os.remove("sample2.py")
    
    print(f"Status Code: {upload_response.status_code}")
    try:
        import json
        print("Response JSON:")
        print(json.dumps(upload_response.json(), indent=2, ensure_ascii=False))
    except Exception:
        print("Response Text:", upload_response.text)

if __name__ == "__main__":
    test_upload_code()
