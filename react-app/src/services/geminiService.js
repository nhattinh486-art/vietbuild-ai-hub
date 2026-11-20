// ============================================================================
// DUAL AI SERVICE FOR REACT EDITION (REAL GEMINI API + SMART SIMULATION)
// ============================================================================

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

export async function generateConstructionAI({ mode, apiKey, prompt, base64Image, mimeType = 'image/jpeg', fallbackText }) {
  const cleanKey = (apiKey || '').replace(/\s+/g, '');
  if (mode !== 'gemini' || !cleanKey) {
    await new Promise((r) => setTimeout(r, 450));
    return { source: 'Chế độ Mô phỏng Thông minh', text: fallbackText };
  }

  const parts = [{ text: prompt }];
  if (base64Image) {
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: cleanBase64
      }
    });
  }

  let lastError = null;
  for (const model of GEMINI_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1500 }
      })
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        msg = errJson?.error?.message || msg;
      } catch (_) {}
      if (res.status === 404) {
        lastError = new Error(`Model ${model} không khả dụng (${msg})`);
        continue;
      }
      throw new Error(`Lỗi Gemini API (${res.status}): ${msg}`);
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || fallbackText;
    return { source: `Gemini AI Thật (${model})`, text: reply };
  }

  throw lastError || new Error('Không thể kết nối tới Gemini API.');
}
