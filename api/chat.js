export default async function handler(req, res) {
  // Cấu hình CORS cho phép giao diện gọi được API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Xử lý pre-flight request từ trình duyệt
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Chặn các request không phải POST
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Lấy API Key từ biến môi trường của Vercel (GEMINI_API_KEY)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Thiếu API Key cấu hình trên Vercel. Hãy kiểm tra lại phần Environment Variables.' });

  try {
    // Gọi thẳng sang máy chủ Google Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi Proxy Server', detail: err.message });
  }
}
