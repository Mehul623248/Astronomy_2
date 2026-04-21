import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const categories = [
  { id: 'messier', name: 'Messier Catalog', icon: '🔭', color: 'from-blue-600', path: '/catalog/messier' },
  { id: 'deepsky', name: 'Deep Sky Objects', icon: '🌌', color: 'from-purple-600', path: '/deepsky' },
  { id: 'hr', name: 'HR Diagram', icon: '📊', color: 'from-amber-600', path: '/hr' },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      // Use encodeURIComponent to handle spaces like "North Star"
      navigate(`/object/${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-starlight">
      
      {/* 1. Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-black tracking-tighter mb-4">
          ASTRO<span className="text-cyan-400">BASE</span>
        </h1>
        <p className="text-slate-400 text-lg">Search the cosmos across Gaia, SDSS, and SIMBAD</p>
      </div>

      {/* 2. Global Search Bar */}
      <form onSubmit={handleSearch} className="w-full max-w-xl mb-16">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search object (e.g. North Star, M31)"
            className="w-full bg-slate-900 border-2 border-white/10 rounded-2xl py-5 px-6 text-xl focus:outline-none focus:border-cyan-500 transition-all shadow-2xl group-hover:border-white/20"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit"
            className="absolute right-4 top-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2 rounded-xl font-bold transition-colors"
          >
            Explore
          </button>
        </div>
      </form>

      {/* 3. Vertically Aligned Category Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-md">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 text-center md:text-left">
          Quick Access Catalogs
        </p>
        {categories.map((cat) => (
          <Link 
            to={cat.path} 
            key={cat.id}
            className={`group p-[1px] rounded-2xl bg-gradient-to-r ${cat.color} to-transparent hover:to-white/20 transition-all shadow-lg`}
          >
            <div className="bg-slate-900 rounded-[calc(1rem-1px)] p-5 flex items-center justify-between group-hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-xl font-bold">{cat.name}</span>
              </div>
              <span className="text-slate-600 group-hover:text-cyan-400 transition-colors">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}