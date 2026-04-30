import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// The structured data extracted from your DSOs.docx
const dsoData = [
  { id: "M 31", name: "Andromeda Galaxy", type: "Spiral galaxy", constellation: "Andromeda", mag: "3.4" },
  { id: "M 44", name: "Beehive Cluster", type: "Open star cluster", constellation: "Cancer", mag: "4.0" },
  { id: "NGC 3372", name: "Eta Carinae Nebula", type: "Emission nebula", constellation: "Carina", mag: "3.0" },
  { id: "NGC 4755", name: "Jewel Box Cluster", type: "Globular star cluster", constellation: "Crux", mag: "4.2" },
  { id: "LMC", name: "Large Magellanic Cloud", type: "Dwarf galaxy", constellation: "Dorado", mag: "0.9" },
  { id: "M 13", name: "Hercules Cluster", type: "Globular star cluster", constellation: "Hercules", mag: "5.9" },
  { id: "NGC 5139", name: "Omega Centauri", type: "Globular star cluster", constellation: "Centaurus", mag: "3.6" },
  { id: "M 42", name: "Orion Nebula", type: "Emission nebula", constellation: "Orion", mag: "4.0" },
  { id: "Melotte 20", name: "Alpha Persei Cluster", type: "Open star cluster", constellation: "Perseus", mag: "1.2" },
  { id: "NGC 869", name: "Double Cluster", type: "Double open cluster", constellation: "Perseus", mag: "4.3" },
  { id: "M 8", name: "Lagoon Nebula", type: "Emission nebula", constellation: "Sagittarius", mag: "5.0" },
  { id: "M 7", name: "Ptolemy Cluster", type: "Open star cluster", constellation: "Sagittarius", mag: "3.3" },
  { id: "M 20", name: "Trifid Nebula", type: "Emission nebula", constellation: "Sagittarius", mag: "6.3" },
  { id: "M 6", name: "Butterfly Cluster", type: "Open star cluster", constellation: "Scorpius", mag: "4.2" },
  { id: "M 4", name: "Messier 4", type: "Globular star cluster", constellation: "Scorpius", mag: "5.9" },
  { id: "Melotte 25", name: "Hyades", type: "Open star cluster", constellation: "Taurus", mag: "0.5" },
  { id: "M 45", name: "Pleiades", type: "Open star cluster", constellation: "Taurus", mag: "1.6" },
  { id: "M 33", name: "Triangulum Galaxy", type: "Spiral galaxy", constellation: "Triangulum", mag: "5.7" },
  { id: "SMC", name: "Small Magellanic Cloud", type: "Dwarf galaxy", constellation: "Tucana", mag: "2.7" },
  { id: "Mizar", name: "Mizar/Alcor", type: "Binary stars", constellation: "Ursa Major", mag: "2.0/4.0" }
];

// Card Sub-Component to handle individual image fetching
const DSOCard = ({ dso }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Calls your Flask backend to get the CDS Aladin image url
    fetch(`/api/image/${encodeURIComponent(dso.id)}?mode=color`)
      .then(res => res.json())
      .then(data => {
        if (data.url) setImageUrl(data.url);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dso.id]);

  return (

    <Link 
      to={`/object/${encodeURIComponent(dso.id)}`} 
      className="block outline-none"
    >

    
    <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/50 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)] transition-all group cursor-pointer h-full flex flex-col">      {/* Image Container */}
      <div className="h-48 w-full bg-slate-950 relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 animate-pulse text-sm">
            Focusing optics...
          </div>
        ) : imageUrl ? (
          <img 
            src={imageUrl} 
            alt={dso.name} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-sm">
            No Image Available
          </div>
        )}
        
        {/* Magnitude Badge */}
        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur text-amber-400 text-xs font-mono px-2 py-1 rounded border border-white/10">
          Mag: {dso.mag}
        </div>
      </div>

      {/* Content Container */}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <h3 className="text-xl font-black text-white">{dso.name}</h3>
        <h4 className="text-cyan-500 font-mono text-sm mt-1">{dso.id}</h4>
        
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
            <span className="text-slate-500 uppercase tracking-wider font-bold">Type</span>
            <span className="text-slate-300">{dso.type}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 uppercase tracking-wider font-bold">Constellation</span>
            <span className="text-slate-300">{dso.constellation}</span>
          </div>
        </div>
      </div>
    </div>

    </Link>
  );
};

// Main Page Component
export default function DSO() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            DEEP SKY <span className="text-cyan-500">OBJECTS</span>
          </h1>
          <p className="text-slate-400 mt-2 ">
            A curated collection of the most prominent galaxies, nebulae, and star clusters visible from Earth.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dsoData.map((dso, index) => (
            <DSOCard key={index} dso={dso} />
          ))}
        </div>

      </div>
    </div>
  );
}