import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function ObjectDetail() {
  const { id } = useParams(); // Grabs 'M31' from the URL /object/M31
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageInfo, setImageInfo] = useState({ url: "", source: "" });
  const [zoomScale, setZoomScale] = useState(1);
  const [viewMode, setViewMode] = useState('mono'); // 'mono' or 'color'
  const [imgError, setImgError] = useState(false);

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.5, 4)); // Max zoom 4x
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.5, 1)); // Min zoom 1x
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
  
 
 fetch(`/api/image/${encodeURIComponent(id)}?mode=${viewMode}`)
    .then((res) => {
      if (!res.ok) {
        // If server returns 500 or 404, stop here
        throw new Error(`Server responded with ${res.status}`);
      }
      return res.json();
    })
    .then((json) => {
      setImageInfo(json);
      setImageUrl(imageInfo.url);
    })
    .catch((err) => {
      console.error("Image fetch failed:", err);
      setImageInfo({ 
        url: "./public/orange.png", 
        source: "Error loading image" 
      });
    });
}, [id, viewMode]);

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
    
      <div className="flex gap-4 mb-4">
    <button 
      onClick={() => setViewMode('mono')}
      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
        viewMode === 'mono' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
      }`}
    >
      SCIENTIFIC (RED)
    </button>
    <button 
      onClick={() => setViewMode('color')}
      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
        viewMode === 'color' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
      }`}
    >
      COMPOSITE (COLOR)
    </button>
  </div>

      {/* Hero Image Section */}
      <div className="mt-8 relative h-96 w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900 group">
        {/* ZOOM CONTROLS (Floating Overlay) */}
        <div className="absolute bottom-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleZoomOut}
            className="bg-slate-800/80 hover:bg-cyan-500 p-2 rounded-lg text-white transition-colors"
          >
            ➖
          </button>
          <button 
            onClick={handleZoomIn}
            className="bg-slate-800/80 hover:bg-cyan-500 p-2 rounded-lg text-white transition-colors"
          >
            ➕
          </button>
          <button 
            onClick={() => setZoomScale(1)}
            className="bg-slate-800/80 hover:bg-red-500 p-2 rounded-lg text-white transition-colors text-xs"
          >
            RESET
          </button>
        </div>
        
        
        {imageInfo.url ? (
          <img 
            src={imageInfo.url} 
            alt={data.name} 
            style={{ 
        transform: `scale(${zoomScale})`,
        transition: 'transform 0.3s ease-out' 
      }}
            className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-700"
            
            onError={() => setImgError(true)}
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