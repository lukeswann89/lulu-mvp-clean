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
  const [activeRevise, setActiveRevise] = useState(null);
  const [userRevisions, setUserRevisions] = useState({});
  const [tempRevision, setTempRevision] = useState('');
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
  function acceptSuggestion(original) {
    const custom = userRevisions[original];
    const finalText = custom ? custom.replace(/^LS:\s*/, '') : getSuggestion(original);
    if (editableText.includes(original)) {
      const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const updated = editableText.replace(regex, finalText);
      setEditableText(updated);
    } else {
      setEditableText(prev => prev + ' ' + finalText);
    }
    setSuggestions(prev => prev.filter(sug => sug.original !== original));
    const updatedRevisions = { ...userRevisions };
    delete updatedRevisions[original];
    setUserRevisions(updatedRevisions);
    setActiveRevise(null);
    setTempRevision('');
  }
  function rejectSuggestion(original) {
    setSuggestions(prev => prev.filter(sug => sug.original !== original));
    const updatedRevisions = { ...userRevisions };
    delete updatedRevisions[original];
    setUserRevisions(updatedRevisions);
    setActiveRevise(null);
    setTempRevision('');
  }
  function saveRevision(original) {
    if (tempRevision.trim() !== '') {
      setUserRevisions(prev => ({ ...prev, [original]: `LS: ${tempRevision.trim()}` }));
    }
    setActiveRevise(null);
    setTempRevision('');
  }
  function discardRevision(original) {
    const updatedRevisions = { ...userRevisions };
    delete updatedRevisions[original];
    setUserRevisions(updatedRevisions);
    setActiveRevise(null);
    setTempRevision('');
  }
  function getSuggestion(original) {
    const match = suggestions.find(s => s.original === original);
    return match ? match.suggestion : '';
  }
  function formatMentoringTips(whyText) {
    if (!whyText) return [];
    return whyText.split(/,| and /i).map((tip) => tip.trim().replace(/^(\w)/, (m) => m.toUpperCase())).filter(Boolean);
  }
  function formatRewrittenText(text) {
    const cleaned = text.replace(/"""|“””|“|”/g, '').replace(/\n/g, ' ').trim();
    const withBold = cleaned.replace(/\[ADDED\](.*?)\[\/ADDED\]/g, '<strong>$1</strong>');
    const withStrikethrough = withBold.replace(/\[REMOVED\](.*?)\[\/REMOVED\]/g, '<del>$1</del>');
    return withStrikethrough;
  }
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-8 relative">
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
            <h2 className="text-2xl font-semibold mb-4">Lulu's Comments</h2>
            {suggestions.map((sug, index) => (
              <div key={index} className="border-t py-4 relative">
                <p className="mb-1"><strong>Original:</strong> {sug.original}</p>
                <p className="mb-1"><strong>Revision:</strong> {sug.suggestion}</p>
                <div className="flex gap-3 my-2">
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                    onClick={() => acceptSuggestion(sug.original)}
                  >
                    Accept
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    onClick={() => rejectSuggestion(sug.original)}
                  >
                    Reject
                  </button>
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
                    onClick={() => {
                      setActiveRevise(sug.original);
                      setTempRevision(userRevisions[sug.original] ? userRevisions[sug.original].replace(/^LS:\s*/, '') : '');
                    }}
                  >
                    Revise
                  </button>
                </div>
                <p className="text-sm italic mb-2"><strong>Why:</strong> {sug.why}</p>
                {userRevisions[sug.original] && (
                  <p className="text-sm italic"><strong>Revise (LS):</strong> {userRevisions[sug.original].replace(/^LS:\s*/, '')}</p>
                )}
                {activeRevise === sug.original && (
                  <div className="absolute top-4 right-[-320px] bg-white shadow-lg rounded-lg p-4 w-80 z-10 border">
                    <div className="mb-2 text-sm italic text-gray-700">
                      <strong>Mentoring Tips:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {formatMentoringTips(sug.why).map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                    <textarea
                      className="w-full p-2 border rounded mb-2 text-sm"
                      placeholder="Write your revision..."
                      value={tempRevision}
                      onChange={(e) => setTempRevision(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptSuggestion(sug.original)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex-1"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => saveRevision(sug.original)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex-1"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => discardRevision(sug.original)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex-1"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
