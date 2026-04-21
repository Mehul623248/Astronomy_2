import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MessierTable() {
  const [allObjects, setAllObjects] = useState([]);      // The "Source of Truth"
  const [displayList, setDisplayList] = useState([]);   // The "Filtered View"
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate()

  const formatMag = (value) => {
    if (value === null || value === undefined || value === 'N/A') return 'N/A';
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : 'N/A';
  };

  useEffect(() => {
    fetch('/api/catalog/messier')
      .then(res => res.json())
      .then(data => {
        setAllObjects(data);
        setDisplayList(data);
        setLoading(false);
      });
  }, []);

  // Every time the search term changes, update the displayed list
  useEffect(() => {
    const filtered = allObjects.filter(obj => 
      obj.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obj.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setDisplayList(filtered);
  }, [searchTerm, allObjects]);

  if (loading) return <div className="p-10 text-center animate-pulse">Scanning the Skies...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-cyan-400">Messier Catalog</h2>
          <p className="text-slate-400 text-sm">Showing {displayList.length} objects</p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search M-numbers or types..."
            className="w-full bg-slate-800 border border-white/10 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-starlight transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute right-3 top-2.5 text-slate-500 pointer-events-none">
            🔍
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/50">
        <table className="w-full text-left border-collapse">
          {/* ... table headers as before ... */}
          <tbody className="divide-y divide-white/5">
            {displayList.map((obj) => (
              <tr key={obj.id} onClick={() => navigate(`/object/${obj.id}`)} className="hover:bg-white/5 cursor-pointer">
                <td className="p-4 font-mono text-cyan-300 group-hover:pl-6 transition-all">{obj.id}</td>
                <td className="p-4 text-slate-400">{obj.type}</td>
                <td className="p-4 text-xs font-mono text-slate-500">{obj.ra} / {obj.dec}</td>
                <td className="p-4 text-right font-bold text-amber-400">{formatMag(obj.mag)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}