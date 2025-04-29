import { promises as fs } from 'fs';
import path from 'path';
import formidable from 'formidable';
export const config = {
  api: {
    bodyParser: false,
  },
};
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const form = formidable({ uploadDir: './uploads', keepExtensions: true });
  const [fields, files] = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve([fields, files]);
    });
  });
  console.log('FILES RECEIVED:', files);
  const file = files.file?.[0] || files.file;
  if (!file) {
    return res.status(400).json({ error: 'No file received' });
  }
  const filePath = file.filepath || file.path;
  if (!filePath) {
    return res.status(400).json({ error: 'No filepath found in file object' });
  }
  const imageBuffer = await fs.readFile(filePath);
  const base64Image = imageBuffer.toString('base64');
  const payload = {
    requests: [
      {
        image: { content: base64Image },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
      },
    ],
  };
  const VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
  if (!VISION_API_KEY) {
    return res.status(500).json({ error: 'Missing Google Vision API key' });
  }
  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const raw = await response.text();
    console.log('RAW VISION RESPONSE:', raw);
    let json;
    try {
      json = JSON.parse(raw);
    } catch (err) {
      console.error('JSON Parse Error:', err);
      return res.status(500).json({ error: 'Malformed OCR result', raw });
    }
    const text = json?.responses?.[0]?.fullTextAnnotation?.text;
    if (!text) {
      console.warn('No text found in OCR response');
      return res.status(200).json({ text: '', warning: 'No text found' });
    }
    console.log('OCR TEXT:', text.slice(0, 200)); // Log first 200 chars
    return res.status(200).json({ text });
  } catch (error) {
    console.error('OCR Error:', error);
    return res.status(500).json({ error: 'Vision API request failed', details: error.message });
  }
}
