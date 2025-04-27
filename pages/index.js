import { useState } from 'react';
import SuggestionPanel from '../components/SuggestionPanel';
export default function Home() {
  const [text, setText] = useState('');
  const [editType, setEditType] = useState('Developmental');
  const [mode, setMode] = useState('Suggest Changes');
  const [suggestions, setSuggestions] = useState([]);
  const [rewrittenText, setRewrittenText] = useState('');
  const [justifications, setJustifications] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function handleSubmit() {
    setLoading(true);
    setError('');
    setSuggestions([]);
    setRewrittenText('');
    setJustifications([]);
    try {
      const res = await fetch('/api/gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, editType, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }
      if (mode === 'Rewrite') {
        setRewrittenText(data.rewrittenText);
        setJustifications(data.justifications || []);
      } else {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  function formatRewrittenText(text) {
    const withBold = text.replace(/\[ADDED\](.*?)\[\/ADDED\]/g, '<strong>$1</strong>');
    const withStrikethrough = withBold.replace(/\[REMOVED\](.*?)\[\/REMOVED\]/g, '<del>$1</del>');
    return withStrikethrough;
  }
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-4">Lulu Mentor App</h1>
      <textarea
        className="w-full p-3 border rounded mb-4"
        rows="10"
        placeholder="Paste your text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-4 mb-4">
        <select
          value={editType}
          onChange={(e) => setEditType(e.target.value)}
          className="p-2 border rounded"
        >
          <option>Developmental</option>
          <option>Structural</option>
          <option>Line</option>
          <option>Copy</option>
          <option>Proof</option>
        </select>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="p-2 border rounded"
        >
          <option>Suggest Changes</option>
          <option>Rewrite</option>
        </select>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Thinking...' : 'Submit to Lulu'}
        </button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {rewrittenText && (
        <div className="bg-white p-4 border rounded mb-6">
          <h2 className="text-2xl font-semibold mb-2">Lulu's Rewritten Text</h2>
          <p dangerouslySetInnerHTML={{ __html: formatRewrittenText(rewrittenText) }} />
        </div>
      )}
      {justifications.length > 0 && (
        <div className="bg-white p-4 border rounded mb-6">
          <h3 class
