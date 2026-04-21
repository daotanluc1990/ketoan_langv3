export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Chỉ POST' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Thiếu GEMINI_API_KEY Vercel' });

  try {
    // MODEL NHANH NHẤT: gemini-1.5-flash (2-3s thay vì 8-10s)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...req.body,
          stream: true,  // ← STREAMING: Client nhận realtime!
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,  // Giới hạn để nhanh
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error || 'Gemini error' });
    }

    // STREAM RESPONSE (nhanh hiển thị)
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // Pipe stream trực tiếp về client
    await new Promise((resolve) => {
      async function pump() {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          res.write(decoder.decode(value, { stream: true }));
        }
        res.end();
        resolve();
      }
      pump();
    });

  } catch (err) {
    console.error('Gemini error:', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
