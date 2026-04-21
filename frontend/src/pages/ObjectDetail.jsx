import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function ObjectDetail() {
  const { id } = useParams(); // Grabs 'M31' from the URL /object/M31
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageInfo, setImageInfo] = useState({ url: "", source: "" });
  useEffect(() => {
    setData(null);
    setError(null);

    fetch(`/api/object/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || `Failed to load object ${id}`);
        }
        return json;
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message));
  
 
 fetch(`/api/image/${id}`)
    .then((res) => {
      if (!res.ok) {
        // If server returns 500 or 404, stop here
        throw new Error(`Server responded with ${res.status}`);
      }
      return res.json();
    })
    .then((json) => {
      setImageInfo(json);
    })
    .catch((err) => {
      console.error("Image fetch failed:", err);
      setImageInfo({ 
        url: "https://via.placeholder.com/800", 
        source: "Error loading image" 
      });
    });
}, [id]);

  if (!data) return <div className="p-20 text-center animate-pulse">Consulting the archives...</div>;

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
          ← Back to Home
        </Link>
        <div className="mt-8 bg-slate-900 rounded-3xl p-10 border border-white/10 shadow-2xl">
          <h1 className="text-3xl font-bold text-red-400">Unable to load object</h1>
          <p className="mt-3 text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-20 text-center">Loading {id}...</div>;

  const aliases = Array.isArray(data.aliases) ? data.aliases : [];

  return (
    <div className="p-8 max-w-4xl mx-auto">
    <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
      ← Back to Home
    </Link>
    
      {/* Hero Image Section */}
      <div className="mt-8 relative h-96 w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={data.name} 
            className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-700"
            onError={(e) => e.target.src = "https://via.placeholder.com/800x600/0f172a/06b6d4?text=Archive+Image+Unavailable"}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 italic">Searching MAST archives...</div>
        )}

      </div>
    <div className="mt-8 bg-slate-900 rounded-3xl p-10 border border-white/10 shadow-2xl">
      {/* Display Common Name + Identifier */}
      <h1 className="text-6xl font-black text-white">{data.common_name}</h1>
      <h2 className="text-2xl font-mono text-cyan-500 mt-2">{data.name}</h2>
      
      {/* Alias Badges */}
      <div className="flex flex-wrap gap-2 mt-6">
        {aliases.map((alias, i) => (
          <span key={i} className="text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-1 rounded text-slate-400">
            {alias}
          </span>
        ))}
      </div>
        
        <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="bg-white/5 p-6 rounded-2xl">
            <span className="block text-slate-500 uppercase text-xs font-bold">Apparent Magnitude</span>
            <span className="text-3xl text-amber-400 font-mono">{data.mag}</span>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl">
            <span className="block text-slate-500 uppercase text-xs font-bold">Coordinates</span>
            <span className="text-sm font-mono text-cyan-200">{data.ra} / {data.dec}</span>
          </div>
        </div>
      </div>
    </div>
  );
}