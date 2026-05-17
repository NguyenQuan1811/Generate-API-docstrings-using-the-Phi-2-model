# 📄 File: `test.py`

## 💻 Original Code
```python
import math

def giai_phuong_trinh_bac_hai(a, b, c):
    if a == 0:
        if b == 0:
            return "Phương trình vô nghiệm"
        return f"Phương trình có một nghiệm: {-c/b}"
    
    delta = b**2 - 4*a*c
    if delta < 0:
        return "Phương trình vô nghiệm"
    elif delta == 0:
        return f"Phương trình có nghiệm kép: {-b/(2*a)}"
    else:
        x1 = (-b + math.sqrt(delta)) / (2*a)
        x2 = (-b - math.sqrt(delta)) / (2*a)
        return f"Phương trình có hai nghiệm: x1={x1}, x2={x2}"

def kiem_tra_so_nguyen_to(n):
    if n < 2:
        return False
    for i in range(2, int(math.sqrt(n)) + 1):
        if n % i == 0:
            return False
    return True

```

## 📖 Generated Docstring
📦 Tìm thấy 2 hàm

--------------------------------------------------

📝 Hàm: giai_phuong_trinh_bac_hai
   📖 Docstring tiếng Việt:
   Trả về nghiệm của phương trình bậc hai ax^2+bx+c=0. Tham số ---------- a : int hoặc float Hệ số của x^2. b : int hoặc float Hệ số của x. c : int hoặc float Số hạng không đổi.

--------------------------------------------------

📝 Hàm: kiem_tra_so_nguyen_to
   📖 Docstring tiếng Việt:
   Kiểm tra số có phải là số nguyên tố Kim-Trà-Sơ-Nguyễn không. Số nguyên tố Kim-Trà-Sô-Nguyen là số tự nhiên lớn hơn 1.
