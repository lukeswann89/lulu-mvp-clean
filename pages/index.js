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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-8">
        <h1 className="text-4xl font-bold mb-6 text-center">Lulu Mentor App</h1>
        <textarea
          className="w-full p-4 border rounded-lg mb-6 text-lg"
          rows="10"
          placeholder="Paste your text here..."
          value={mode === 'Suggest Changes' && editableText ? editableText : text}
          onChange={(e) => {
            setText(e.target.value);
            if (mode === 'Suggest Changes') setEditableText(e.target.value);
          }}
        />
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            className="p-3 border rounded-lg flex-1"
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
            className="p-3 border rounded-lg flex-1"
          >
            <option>Suggest Changes</option>
            <option>Rewrite</option>
          </select>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            disabled={loading}
          >
            {loading ? 'Thinking...' : 'Submit to Lulu'}
          </button>
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {rewrittenText && (
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-2xl font-semibold mb-3">Lulu's Rewritten Text</h2>
            <p dangerouslySetInnerHTML={{ __html: formatRewrittenText(rewrittenText) }} className="text-lg" />
          </div>
        )}
        {justifications.length > 0 && (
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-6">
            <h3 className="text-xl font-semibold mb-3">Justifications</h3>
            <ul className="list-disc list-inside space-y-2 text-lg">
              {justifications.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Lulu's Suggestions</h2>
            {suggestions.map((sug, index) => (
              <div key={index} className="border-t py-4">
                <p className="mb-1"><strong>Original:</strong> {sug.original}</p>
                <p className="mb-1"><strong>Suggestion:</strong> {sug.suggestion}</p>
                <p className="mb-3"><strong>Why:</strong> {sug.why}</p>
                <div className="flex gap-3">
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                    onClick={() => acceptSuggestion(sug.original, sug.suggestion)}
                  >
                    Accept
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
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
    </div>
  );
}
