export default async function handler(req, res) {
  // Cấu hình CORS cho phép truy cập từ client
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Xử lý preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Chỉ cho phép phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Phương thức không được hỗ trợ. Chỉ dùng POST.' });
  }

  // Lấy API Key từ biến môi trường của Vercel
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Lỗi Server: Thiếu GEMINI_API_KEY trong cấu hình Vercel.' });
  }

  try {
    // Gọi đến API của Google Gemini
    // Dùng model gemini-2.5-flash (ổn định, không cần preview date)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();

    // Trả về kết quả cho Frontend
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Lỗi khi gọi Gemini API:", err);
    return res.status(500).json({ error: 'Lỗi Proxy Server kết nối đến Gemini', detail: err.message });
  }
}