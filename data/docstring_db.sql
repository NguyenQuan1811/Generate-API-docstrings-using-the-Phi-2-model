-- RESET (tránh lỗi khi chạy lại)
DROP DATABASE IF EXISTS docstring_db;

-- 1.Tạo database
CREATE DATABASE IF NOT EXISTS docstring_db;
USE docstring_db;

-- 2. Tạo bảng
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE docstrings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    code_id INT NOT NULL,
    docstring_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (code_id) REFERENCES codes(id),
    FOREIGN KEY (docstring_id) REFERENCES docstrings(id)
);

-- 3. Thêm dữ liệu fake
INSERT INTO users (username, email, password)
VALUES 
('dung123', 'dung@gmail.com', '123456'),
('anhcoder', 'anh@gmail.com', '123456'),
('testuser1', 'test1@gmail.com', 'abc123'),
('testuser2', 'test2@gmail.com', 'abc123');

INSERT INTO codes (content)
VALUES 
('print("Hello World")'),
('def add(a, b): return a + b');

INSERT INTO docstrings (content)
VALUES 
('In ra Hello World'),
('Hàm cộng 2 số');

INSERT INTO history (user_id, code_id, docstring_id)
VALUES 
(1, 1, 1),
(2, 2, 2);


SHOW TABLES;

SELECT * FROM users;
SELECT * FROM codes;
SELECT * FROM docstrings;
SELECT * FROM history;