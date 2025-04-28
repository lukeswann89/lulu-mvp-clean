export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided.' });
  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: `Please clean up this OCR-extracted text into readable, well-structured English, keeping the original tone: ${text}` }], temperature: 0.3 }),
    });
    const openaiData = await openaiRes.json();
    const cleanedText = openaiData.choices[0]?.message?.content || '';
    res.status(200).json({ cleanedText });
  } catch (error) {
    res.status(500).json({ error: 'Cleanup request failed.' });
  }
}
