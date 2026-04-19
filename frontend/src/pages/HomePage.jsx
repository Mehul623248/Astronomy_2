import { Link } from 'react-router-dom';


const categories = [
  { id: 'messier', name: 'Messier Catalog', icon: '🔭', color: 'from-blue-500' },
  { id: 'deepsky', name: 'Deep Sky Objects', icon: '🌌', color: 'from-purple-500' },
  { id: 'hr', name: 'HR Diagram', icon: '📊', color: 'from-amber-500' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen p-8">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold tracking-tighter">ASTRO<span className="text-cyan-400">BASE</span></h1>
        <p className="text-slate-400 mt-2">Professional Astronomical Object Explorer</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {categories.map((cat) => (
          <div key={cat.id} className={`p-1 rounded-2xl bg-gradient-to-br ${cat.color} to-transparent cursor-pointer hover:scale-105 transition-transform`}>
            
            
            <Link to="/messier">
                <div className="p-8 bg-slate-900 rounded-xl cursor-pointer">
                    <h2>Messier Catalog</h2>
                </div>
            </Link>


          </div>
        ))}
      </div>
    </div>
  )
}
