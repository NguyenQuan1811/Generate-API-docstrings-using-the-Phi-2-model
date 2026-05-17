const BASE = 'https://quan1811-docstring-api.hf.space';

async function request(path, options = {}) {
  const user = JSON.parse(localStorage.getItem('docstring_user') || '{}')
  const token = user.access_token || ''

  // Tự động kiểm tra xem body gửi lên có phải là FormData (tải file) hay không
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      // NẾU LÀ FORMDATA: Bắt buộc loại bỏ hoàn toàn thuộc tính Content-Type để trình duyệt tự xử lý
      // NẾU LÀ JSON: Giữ nguyên 'application/json'
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  const text = await res.text()
  console.log("RAW RESPONSE:", text)
  const data = text ? JSON.parse(text) : {}

  if (!res.ok) {
    // Xử lý chuỗi lỗi tinh gọn hơn, tránh trả về cụm từ [object Object] trên giao diện Chat
    const errorDetail = typeof data.detail === 'string'
      ? data.detail
      : JSON.stringify(data.detail) || `HTTP ${res.status}`;
    throw new Error(errorDetail);
  }
  return data
}

export const api = {
  register: (username, email, password) =>
    request('/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  login: (username, password) =>
    request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  addCode: (user_id, content, docstring = '') =>
    request('/add-code', {
      method: 'POST',
      body: JSON.stringify({ user_id, content, docstring }),
    }),

  getHistory: () => request('/history'),

  uploadCode: (fileObject) => {
    const formData = new FormData();
    formData.append('file', fileObject);

    return request('/upload-code', {
      method: 'POST',
      body: formData,
    });
  },

  exportResult: (items) =>
    request('/export-result', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
}