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
  const [editableText, setEditableText] = useState('');
  async function handleSubmit() {
    setLoading(true);
    setError('');
    setSuggestions([]);
    setRewrittenText('');
    setJustifications([]);
    setEditableText('');
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
        setEditableText(text);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  function acceptSuggestion(original, suggestion) {
    if (editableText.includes(original)) {
      const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const updated = editableText.replace(regex, suggestion);
      setEditableText(updated);
    } else {
      setEditableText(prev => prev + ' ' + suggestion);
    }
    setSuggestions(prev => prev.filter(sug => sug.original !== original));
  }
  function rejectSuggestion(original) {
    setSuggestions(prev => prev.filter(sug => sug.original !== original));
  }
  function formatRewrittenText(text) {
    const cleaned = text.replace(/"""|“””|“|”/g, '').replace(/\n/g, ' ').trim();
    const withBold = cleaned.replace(/\[ADDED\](.*?)\[\/ADDED\]/g, '<strong>$1</strong>');
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
        value={mode === 'Suggest Changes' && editableText ? editableText : text}
        onChange={(e) => {
          setText(e.target.value);
          if (mode === 'Suggest Changes') setEditableText(e.target.value);
        }}
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
          <h3 className="text-xl font-semibold mb-2">Justifications</h3>
          <ul className="list-disc list-inside">
            {justifications.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="bg-white p-4 border rounded mb-6">
          <h2 className="text-2xl font-semibold mb-2">Lulu's Suggestions</h2>
          {suggestions.map((sug, index) => (
            <div key={index} className="border-t py-2">
              <p><strong>Original:</strong> {sug.original}</p>
              <p><strong>Suggestion:</strong> {sug.suggestion}</p>
              <p><strong>Why:</strong> {sug.why}</p>
              <div className="flex gap-2 mt-2">
                <button
                  className="bg-green-500 text-white px-2 py-1 rounded"
                  onClick={() => acceptSuggestion(sug.original, sug.suggestion)}
                >
                  Accept
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  onClick={() => rejectSuggestion(sug.original)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
