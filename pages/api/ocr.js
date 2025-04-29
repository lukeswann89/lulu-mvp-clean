import { formidable } from 'formidable';
import fs, { existsSync, mkdirSync } from 'fs';
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // Ensure upload directory exists
  const uploadPath = './public/uploads';
  if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
  const form = formidable({
    uploadDir: uploadPath,
    keepExtensions: true,
    multiples: false,
    filename: (name, ext, part, form) => `${Date.now()}-${part.originalFilename}`
  });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('FORM PARSE ERROR:', err);
      return res.status(500).json({ error: 'Form parsing error' });
    }
    console.log('FILES RECEIVED:', files);
    const fileKey = Object.keys(files)[0];
    const fileArray = files[fileKey];
    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
    console.log('FILE KEY:', fileKey);
    console.log('SELECTED FILE:', file);
    if (!file || !file.filepath) {
      return res.status(400).json({
        error: 'No valid file received',
        debug: { fileKey, file, allKeys: Object.keys(files) }
      });
    }
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
              imageContext: { languageHints: ['en'] }
            }
          ]
        }),
      });
      const rawText = await visionResponse.text();
      try {
        const visionJson = JSON.parse(rawText);
        console.log('Google Vision Response:', JSON.stringify(visionJson, null, 2));
        const text = visionJson.responses[0]?.fullTextAnnotation?.text || '';
        return res.status(200).json({ text });
      } catch (err) {
        console.error('Failed to parse Google Vision response:', rawText);
        return res.status(500).json({ error: 'Google Vision returned invalid JSON', rawText });
      }
    } catch (error) {
      console.error('OCR ERROR:', error);
      return res.status(500).json({ error: 'Failed to call Google Vision API', error });
    }
  });
}
