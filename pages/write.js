import { useState } from 'react';
export default function Write() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [cleanedText, setCleanedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setOriginalImage(URL.createObjectURL(file));
    }
  };
  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    setOcrText('');
    setCleanedText('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const ocrRes = await fetch('/api/ocr', { method: 'POST', body: formData });
      const ocrData = await ocrRes.json();
      if (!ocrRes.ok) throw new Error(ocrData.error || 'OCR failed.');
      setOcrText(ocrData.text);
      const cleanRes = await fetch('/api/cleanup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: ocrData.text }) });
      const cleanData = await cleanRes.json();
      if (!cleanRes.ok) throw new Error(cleanData.error || 'Cleanup failed.');
      setCleanedText(cleanData.cleanedText);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8">
        <h1 className="text-4xl font-bold mb-6 text-center">Lulu - Write from Handwriting</h1>
        <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="mb-4" />
        <button onClick={handleUpload} disabled={loading || !selectedFile} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold mb-6">
          {loading ? 'Processing...' : 'Convert to Text'}
        </button>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {originalImage && (
          <div className="flex gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2">Original Handwriting</h2>
              <img src={originalImage} alt="Handwriting" className="rounded-lg border" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2">Interpreted Digital Text</h2>
              <textarea value={cleanedText} onChange={(e) => setCleanedText(e.target.value)} className="w-full p-4 border rounded-lg min-h-[400px]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
