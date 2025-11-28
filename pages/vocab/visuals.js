// pages/discovery/index.js
import { useState, useEffect } from 'react';

export default function DiscoveryTestPoC() {
  // ✅ Initialize as empty array
  const [testItems, setTestItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/test/discovery/selection', {
        });

        const data = await res.json();

        console.log(data)
        if (data.success && Array.isArray(data.kanji)) {
          setTestItems(data.kanji);
        } else {
          console.warn('No kanji returned or invalid response:', data);
          setTestItems([]); // fallback to empty array
        }
      } catch (err) {
        console.error('Failed to load discovery test:', err);
        setTestItems([]); // ensure it's always an array
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  // ✅ Now safe: testItems is always an array
  if (testItems.length === 0) {
    return <div className="p-6">No discovery items available.</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Discovery Test</h1>
      <div className="space-y-4">
        {testItems.map((item, i) => (
          <div key={item.kanjiId || i} className="border rounded-lg p-4">
            <div className="text-4xl font-jp-round mb-2">{item.kanji.character}</div>
            <div className="text-sm text-gray-600">
              Onyomi: <span className="font-mono font-bold">{item.correctAnswer}</span>
            </div>
            <div className="text-sm mt-2">
              Hint: Same reading as: {item.hints?.join(', ') || '—'}
            </div>
            {item.kanji.jlpt && (
              <div className="text-xs mt-1 text-blue-600">JLPT N{item.kanji.jlpt}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}