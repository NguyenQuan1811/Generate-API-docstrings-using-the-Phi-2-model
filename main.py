from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from database import get_db_connection
from models import UserRegister, UserLogin, CodeItem, ExportRequest
from auth import hash_password, verify_password, create_access_token, get_current_user
import httpx
import os
import io
import zipfile
import ast
from fastapi.responses import StreamingResponse
from datetime import datetime

app = FastAPI(
)

# Lấy URL của AI từ .env
AI_URL = os.getenv("AI_SERVER_URL")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả để dev cho dễ, sau này nên giới hạn lại
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register")
def register(user: UserRegister):
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 6 ký tự")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (user.username, user.email))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username hoặc Email đã tồn tại")

        hashed_pw = hash_password(user.password)
        cursor.execute(
            "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
            (user.username, user.email, hashed_pw)
        )
        conn.commit()
        return {"status": "success", "message": "Đăng ký thành công"}
    except HTTPException as e:
        raise e
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Lỗi hệ thống: " + str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/login")
def login(user: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE username = %s", (user.username,))
        db_user = cursor.fetchone()
        
        if not db_user or not verify_password(user.password, db_user['password']):
            raise HTTPException(status_code=401, detail="Sai tài khoản hoặc mật khẩu")

        token = create_access_token({"sub": db_user['username'], "user_id": db_user['id']})
        return {
            "access_token": token, 
            "token_type": "bearer", 
            "user": {
                "id": db_user['id'],
                "username": db_user['username'],
                "email": db_user['email']
            }
        }
    finally:
        cursor.close()
        conn.close()

@app.post("/add-code")
async def add_code(item: CodeItem, current_user: dict = Depends(get_current_user)):
    # Luôn sử dụng user_id từ token để đảm bảo an toàn
    user_id = current_user["user_id"]
    
    if not item.docstring:
        try:
            async with httpx.AsyncClient() as client:
                # Thêm header để bỏ qua trang cảnh báo của ngrok nếu có
                headers = {"ngrok-skip-browser-warning": "69420"}
                response = await client.post(AI_URL, json={"code": item.content}, headers=headers, timeout=30.0)
                
                if response.status_code == 200:
                    data = response.json()
                    # Khớp với cấu trúc của Colab: {"success": True, "data": {"english": "...", "vietnamese": "..."}}
                    if data.get("success"):
                        ai_data = data.get("data")
                        if isinstance(ai_data, dict):
                            item.docstring = ai_data.get("vietnamese") or ai_data.get("english") or "N/A"
                        else:
                            item.docstring = str(ai_data)
                    else:
                        item.docstring = f"AI logic error: {data.get('error')}"
                else:
                    item.docstring = f"Error: AI service (ngrok) returned status {response.status_code}. Check if Colab is running /generate."
        except Exception as e:
            item.docstring = f"Error connection to AI: {str(e)}"

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Lưu code
        cursor.execute("INSERT INTO codes (content) VALUES (%s)", (item.content,))
        code_id = cursor.lastrowid
        # Lưu docstring
        cursor.execute("INSERT INTO docstrings (content) VALUES (%s)", (item.docstring,))
        docstring_id = cursor.lastrowid
        # Lưu lịch sử với user_id từ Token
        cursor.execute(
            "INSERT INTO history (user_id, code_id, docstring_id) VALUES (%s, %s, %s)",
            (user_id, code_id, docstring_id)
        )
        conn.commit()
        return {
            "status": "success", 
            "code_id": code_id, 
            "docstring_id": docstring_id,
            "final_docstring": item.docstring
        }
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@app.get("/history")
def get_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Chỉ lấy lịch sử của chính user đang đăng nhập
        query = """
            SELECT h.id, u.username, c.content as code, d.content as docstring, h.created_at
            FROM history h
            JOIN users u ON h.user_id = u.id
            JOIN codes c ON h.code_id = c.id
            JOIN docstrings d ON h.docstring_id = d.id
            WHERE h.user_id = %s
            ORDER BY h.created_at DESC
        """
        cursor.execute(query, (user_id,))
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/upload-code")
async def upload_code(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    content = await file.read()
    try:
        text_content = content.decode('utf-8')
    except:
        text_content = "Cannot decode file content (binary or unknown encoding)"
    
    # Phân tích file code ra thành từng hàm riêng biệt
    docstring_result = ""
    try:
        # Nếu là file python thì thử parse bằng ast
        if file.filename.endswith(".py"):
            tree = ast.parse(text_content)
            functions = []
            for node in ast.iter_child_nodes(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                    functions.append((node.name, ast.unparse(node)))
        else:
            functions = []

        if not functions:
            # Không tách được hàm nào, gửi nguyên file
            functions = [("Toàn bộ file", text_content)]
            docstring_result += "📦 Không tìm thấy hàm cụ thể, xử lý toàn bộ file\n\n"
        else:
            docstring_result += f"📦 Tìm thấy {len(functions)} hàm\n\n"

        async with httpx.AsyncClient() as client:
            headers = {"ngrok-skip-browser-warning": "69420"}
            
            for func_name, func_code in functions:
                docstring_result += "-"*50 + "\n\n"
                docstring_result += f"📝 Hàm: {func_name}\n"
                indented_code = "\n".join([f"      {line}" for line in func_code.split("\n")])
                docstring_result += f"   Code:\n{indented_code}\n\n"
                docstring_result += f"   📖 Docstring tiếng Việt:\n"

                # Gọi AI cho từng hàm
                response = await client.post(
                    AI_URL, 
                    json={"code": func_code, "language": "vi"}, 
                    headers=headers, 
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        ai_data = data.get("data")
                        if isinstance(ai_data, dict):
                            func_doc = ai_data.get("vietnamese") or ai_data.get("english") or "N/A"
                        else:
                            func_doc = str(ai_data)
                            
                        # Cắt bỏ phần "Ví dụ" hoặc "Examples" lải nhải của AI
                        if "Ví dụ" in func_doc:
                            func_doc = func_doc.split("Ví dụ")[0].strip()
                        if "Examples" in func_doc:
                            func_doc = func_doc.split("Examples")[0].strip()
                            
                        # Cắt bỏ luôn phần "Xem thêm" hoặc "See also" (thường AI hay tự bịa ra thư viện sympy, sklearn)
                        if "Xem thêm" in func_doc:
                            func_doc = func_doc.split("Xem thêm")[0].strip()
                        if "See also" in func_doc:
                            func_doc = func_doc.split("See also")[0].strip()
                            
                    else:
                        func_doc = f"AI Error: {data.get('error')}"
                else:
                    func_doc = f"AI Service Error {response.status_code}: Check Colab URL."
                
                indented_doc = "\n".join([f"   {line}" for line in func_doc.split("\n")])
                docstring_result += f"{indented_doc}\n\n"
                
    except SyntaxError:
        docstring_result = "Lỗi cú pháp Python, không thể tách hàm. Vui lòng kiểm tra lại file code."
    except Exception as e:
        docstring_result += f"\nConnection Error: {str(e)}"
        
    docstring = docstring_result
        
    # Lưu vào database
    conn = None
    cursor = None
    code_id = None
    docstring_id = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Lưu code
        cursor.execute("INSERT INTO codes (content) VALUES (%s)", (text_content,))
        code_id = cursor.lastrowid
        # Lưu docstring
        cursor.execute("INSERT INTO docstrings (content) VALUES (%s)", (docstring,))
        docstring_id = cursor.lastrowid
        # Lưu lịch sử
        cursor.execute(
            "INSERT INTO history (user_id, code_id, docstring_id) VALUES (%s, %s, %s)",
            (user_id, code_id, docstring_id)
        )
        conn.commit()
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

    result = {
        "filename": file.filename,
        "content": text_content,
        "docstring": docstring,
        "code_id": code_id,
        "docstring_id": docstring_id
    }
    
    return {"status": "success", "results": [result]}

@app.post("/export-result")
async def export_result(request: ExportRequest):
    # Tạo một file Markdown duy nhất gộp tất cả kết quả cho đẹp
    md_content = "# 📚 TỔNG HỢP KẾT QUẢ GIẢI THÍCH CODE\n\n"
    md_content += f"*Ngày xuất: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}*\n\n"
    md_content += "---\n\n"
    
    for item in request.items:
        filename = item.get("filename", "code.txt")
        content = item.get("content", "")
        docstring = item.get("docstring", "")
        
        md_content += f"## 📄 File: `{filename}`\n\n"
        md_content += f"### 💻 Mã nguồn (Original Code)\n"
        md_content += f"```python\n{content}\n```\n\n"
        md_content += f"### 📖 Giải thích từ AI (Generated Docstring)\n"
        md_content += f"{docstring}\n\n"
        md_content += "---\n\n"
            
    return StreamingResponse(
        io.BytesIO(md_content.encode("utf-8")), 
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=bao_cao_ai_docstring.md"}
    )

if __name__ == "__main__":
    import uvicorn
    # Tắt reload ở đây để tránh bị lặp vô tận nếu có file nào đó thay đổi trong thư mục
    uvicorn.run("main:app", host="0.0.0.0", port=7860, reload=False)