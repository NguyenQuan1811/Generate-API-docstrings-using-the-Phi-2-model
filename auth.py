import os
import bcrypt
from dotenv import load_dotenv
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Load file .env (đảm bảo SECRET_KEY được lấy từ đây)
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Kiểm tra an toàn: Nếu không load được SECRET_KEY, báo lỗi ngay lập tức
if not SECRET_KEY:
    raise ValueError("LỖI: Chưa thiết lập SECRET_KEY trong file .env!")

def hash_password(password: str):
    """
    Hash mật khẩu bằng bcrypt.
    Sử dụng .strip()[:72] để đảm bảo an toàn với giới hạn của bcrypt.
    """
    pwd_bytes = password.strip()[:72].encode('utf-8')
    salt = bcrypt.gensalt()
    # Hash và chuyển đổi kết quả thành chuỗi để lưu vào DB
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password, hashed_password):
    """
    So sánh mật khẩu người dùng nhập vào với mật khẩu đã hash trong DB.
    """
    pwd_bytes = plain_password.strip()[:72].encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

def create_access_token(data: dict):
    """
    Tạo JWT token với thời hạn 24 giờ.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

security = HTTPBearer()

def get_current_user(auth: HTTPAuthorizationCredentials = Security(security)):
    """
    Dependency để lấy user hiện tại từ Token.
    Dùng trong các route cần bảo mật.
    """
    credentials_exception = HTTPException(
        status_code=401,
        detail="Token không hợp lệ hoặc đã hết hạn",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = auth.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        if username is None or user_id is None:
            raise credentials_exception
        return {"username": username, "user_id": user_id}
    except JWTError:
        raise credentials_exception