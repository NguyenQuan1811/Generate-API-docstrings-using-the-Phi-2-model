import requests
import random

BASE_URL = "http://127.0.0.1:8000"

def test_full_flow():
    # 1. Thông tin user ngẫu nhiên
    rand_id = random.randint(1000, 9999)
    user_data = {
        "username": f"user_{rand_id}", 
        "password": "password123", 
        "email": f"email_{rand_id}@example.com"
    }
    
    print(f"\n--- 1. ĐĂNG KÝ: {user_data['username']} ---")
    reg_resp = requests.post(f"{BASE_URL}/register", json=user_data)
    print(f"Status: {reg_resp.status_code}, Res: {reg_resp.json()}")

    print("\n--- 2. ĐĂNG NHẬP ---")
    login_resp = requests.post(f"{BASE_URL}/login", json={
        "username": user_data["username"],
        "password": user_data["password"]
    })
    
    if login_resp.status_code != 200:
        print("Đăng nhập thất bại!")
        return

    login_data = login_resp.json()
    token = login_data["access_token"]
    print(f"Login thành công! Token: {token[:20]}...")

    # Headers kèm Token để gọi các API bảo mật
    headers = {"Authorization": f"Bearer {token}"}

    print("\n--- 3. THÊM CODE (Cần Token) ---")
    code_payload = {
        "content": "def hello_world():\n    print('Hello')", 
        "docstring": "" 
    }
    add_resp = requests.post(f"{BASE_URL}/add-code", json=code_payload, headers=headers)
    
    if add_resp.status_code == 200:
        res = add_resp.json()
        print(f"Thành công! Docstring: {res['final_docstring']}")
    else:
        print(f"Lỗi add-code: {add_resp.status_code} - {add_resp.text}")

    print("\n--- 4. XEM LỊCH SỬ (Chỉ thấy của mình) ---")
    his_resp = requests.get(f"{BASE_URL}/history", headers=headers)
    if his_resp.status_code == 200:
        history = his_resp.json()
        print(f"Số lượng bản ghi: {len(history)}")
        for item in history:
            print(f"- [{item['timestamp']}] Code: {item['code'][:20]}...")
    else:
        print(f"Lỗi lấy lịch sử: {his_resp.text}")

if __name__ == "__main__":
    try:
        test_full_flow()
    except requests.exceptions.ConnectionError:
        print("Lỗi: Server chưa chạy. Hãy chạy 'python main.py' trước.")