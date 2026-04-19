import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MessierTable from './components/MessierTable';
import ObjectDetail from './pages/ObjectDetail'; // We'll build this next

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-starlight">
        {/* You can put a Navbar here so it shows on every page */}
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/messier" element={<MessierTable />} />
          
          {/* The ':id' is a dynamic parameter (e.g. /object/M31 or /object/M42) */}
          <Route path="/object/:id" element={<ObjectDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;