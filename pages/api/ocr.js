import formidable from 'formidable';
import fs from 'fs';
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'File parsing error.' });
    const file = files.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });
    const imageData = fs.readFileSync(file.filepath, { encoding: 'base64' });
    try {
      const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageData },
              features: [{ type: 'TEXT_DETECTION' }],
              imageContext: {
                languageHints: ['en']
              }
            }
          ]
        }),
      });
      const visionJson = await visionResponse.json();
      if (!visionJson.responses || !visionJson.responses[0]) {
        return res.status(500).json({ error: 'No valid OCR result from Vision API.' });
      }
      const text = visionJson.responses[0].fullTextAnnotation?.text || '';
      res.status(200).json({ text });
    } catch (error) {
      console.error('OCR error:', error);
      res.status(500).json({ error: 'Failed to process image with Vision API.' });
    }
  });
}
