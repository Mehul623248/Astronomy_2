import React, { useState } from 'react';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  LogarithmicScale,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register the necessary Chart.js modules
ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, LogarithmicScale, annotationPlugin);



// A small dataset of famous reference stars
const REAL_STARS = [
  { name: "The Sun", t: 5800, l: 1 },
  { name: "Sirius A", t: 9940, l: 25.4 },
  { name: "Betelgeuse", t: 3500, l: 126000 },
  { name: "Rigel", t: 12100, l: 120000 },
  { name: "Proxima Centauri", t: 3042, l: 0.0017 },
  { name: "Sirius B (White Dwarf)", t: 25200, l: 0.026 },
  { name: "Vega", t: 9602, l: 40.12 },
];

  // Helper function to approximate star color based on temperature
const getStarColor = (temp) => {
  if (temp > 25000) return 'rgb(85, 120, 248)'; // Deep Blue
  if (temp > 10000) return 'rgb(129, 160, 255)'; // Blue
  if (temp > 7500) return 'rgb(202, 215, 255)';  // Light Blue
  if (temp > 6000) return 'rgb(248, 247, 255)';  // White
  if (temp > 5000) return 'rgb(255, 244, 232)';  // Yellow-White (Sun-like)
  if (temp > 3500) return 'rgb(255, 210, 161)';  // Orange
  return 'rgb(255, 95, 89)';                   // Red
};


export default function HRDiagram() {
  // State for our custom interactive star
  const [temp, setTemp] = useState(5800);
  const [radius, setRadius] = useState(1);
  const [showRealStars, setShowRealStars] = useState(true);

  // Stefan-Boltzmann Calculation (in Solar Units)
  // L = R^2 * (T / T_sun)^4
  const calculatedLuminosity = Math.pow(radius, 2) * Math.pow(temp / 5800, 4);

  // Configure Chart Data
  const data = {
    datasets: [
      {
        label: 'Your Custom Star',
        data: [{ x: temp, y: calculatedLuminosity }],
        backgroundColor: getStarColor(temp), 
        pointRadius: 8,
        pointHoverRadius: 10,
        borderColor: '#ffffff',
        borderWidth: 2,
      },
      // Conditionally render the real stars based on the toggle
      ...(showRealStars ? [{
        label: 'Known Stars',
        data: REAL_STARS.map(star => ({
          x: star.t,
          y: star.l,
          label: star.name,
        })),
        backgroundColor: REAL_STARS.map(star => getStarColor(star.t)), // Color by temp
        pointRadius: 5,
        pointHoverRadius: 7,
      }] : [])
    ],
  };

  // Configure Chart Axes and Tooltips
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8' } },
      tooltip: {
        callbacks: {
          label: (context) => {
            const raw = context.raw;
            const name = raw.label || 'Custom Star';
            return `${name}: Temp: ${raw.x}K | Lum: ${raw.y.toExponential(2)} L☉`;
          }
        }
      },
      // 3. Add the annotation configuration here
      annotation: {
        annotations: {
          // 1. White Dwarfs (Raised yMax slightly to perfectly capture Sirius B)
          whiteDwarfs: {
            type: 'box',
            xMin: 30000, xMax: 7000,
            yMin: 0.0001, yMax: 0.1, 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            label: { display: true, content: 'White Dwarfs', color: 'rgba(255, 255, 255, 0.4)' }
          },
          // 2. Supergiants (Hugs the top area above the Giants)
          supergiants: {
            type: 'box',
            xMin: 40000, xMax: 3000,
            yMin: 30000, yMax: 1000000, 
            backgroundColor: 'rgba(255, 100, 100, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255, 100, 100, 0.2)',
            label: { display: true, content: 'Supergiants', color: 'rgba(255, 100, 100, 0.4)' }
          },
          // 3. Giants (Perfectly frames the mid-bright cool stars)
          giants: {
            type: 'box',
            xMin: 8000, xMax: 3000,
            yMin: 50, yMax: 30000, 
            backgroundColor: 'rgba(255, 200, 100, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255, 200, 100, 0.2)',
            label: { display: true, content: 'Giants', color: 'rgba(255, 200, 100, 0.4)' }
          },
          
          // 4. Main Sequence (Hot Half) - From O-type stars down to the Sun
          mainSequenceHot: {
            type: 'line',
            xMin: 30000, yMin: 200000, 
            xMax: 5800, yMax: 1,       // Anchors the bend exactly at our Sun
            borderColor: 'rgba(100, 200, 255, 0.25)',
            borderWidth: 40,
            label: {
              display: true,
              content: 'Main Sequence',
              backgroundColor: 'transparent',
              color: 'rgba(100, 200, 255, 0.8)'
            }
          },
          // 5. Main Sequence (Cool Half) - From the Sun down to M-dwarfs
          mainSequenceCool: {
            type: 'line',
            xMin: 5800, yMin: 1,       // Starts exactly where the Hot half ends
            xMax: 2000, yMax: 0.0005,  
            borderColor: 'rgba(100, 200, 255, 0.25)',
            borderWidth: 40,
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        reverse: true, // HR Diagrams always go Hot (left) to Cold (right)
        min: 1000,
        max: 30000,
        title: { display: true, text: 'Surface Temperature (Kelvin)', color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        type: 'logarithmic', // Log scale handles massive brightness differences
        min: 0.0001,
        max: 1000000,
        title: { display: true, text: 'Luminosity (Solar Units)', color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8' }
      }
    }
  };


  return (
    <div className="bg-slate-900 p-8 rounded-3xl border border-white/10 shadow-2xl max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">Hertzsprung-Russell Diagram</h2>
          <p className="text-slate-400 text-sm mt-1">
            Observe how Temperature and Radius determine a star's Luminosity.
          </p>
        </div>
        
        {/* Toggle Button for Real Stars */}
        <button 
          onClick={() => setShowRealStars(!showRealStars)}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
            showRealStars ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {showRealStars ? "HIDE REFERENCE STARS" : "SHOW REFERENCE STARS"}
        </button>
      </div>

      {/* The Chart Container */}
      <div className="h-96 w-full mb-8 bg-slate-950/50 rounded-xl p-4 border border-white/5">
        <Scatter data={data} options={options} />
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-2 gap-8 bg-white/5 p-6 rounded-2xl">
        
        {/* Temperature Slider */}
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-2">
            <span>Temperature (T)</span>
            <span className="text-amber-400 font-mono">{temp} K</span>
          </label>
          <input 
            type="range" 
            min="1000" max="30000" step="100" 
            value={temp} 
            onChange={(e) => setTemp(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
        </div>

        {/* Radius Slider */}
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-2">
            <span>Radius (R)</span>
            <span className="text-cyan-400 font-mono">{radius} R☉</span>
          </label>
          <input 
            type="range" 
            min="0.0001" max="1000" step="0.1" 
            value={radius} 
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>

      </div>

      {/* Results Readout */}
      <div className="mt-6 text-center">
        <span className="text-slate-500 uppercase text-xs font-bold tracking-widest block mb-2">
          Calculated Luminosity
        </span>
        <span className="text-4xl font-mono text-white">
          {calculatedLuminosity < 0.1 || calculatedLuminosity > 10000 
            ? calculatedLuminosity.toExponential(2) 
            : calculatedLuminosity.toFixed(2)} <span className="text-lg text-slate-500">L☉</span>
        </span>
      </div>
    </div>
  );
}