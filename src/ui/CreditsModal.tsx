import React from 'react';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';

interface CreditsProps {
  onClose: () => void;
}

export const CreditsModal: React.FC<CreditsProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md pointer-events-auto" onClick={onClose}></div>

      <div className="relative pointer-events-auto w-full max-w-2xl bg-slate-950/95 border border-cyan-500/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">Asset Attributions & Open Licenses</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          OUTPOST incorporates legally usable, open-source 3D models, planetary maps, and audio designed for the NASA Space Apps Challenge 2026:
        </p>

        <div className="space-y-3 text-xs">
          {/* Kenney */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between font-bold text-slate-100 mb-1">
              <span>Kenney Space Kit & Space Station Kit (3D Models)</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">CC0 (PUBLIC DOMAIN)</span>
            </div>
            <p className="text-slate-400 mb-1">
              Astronauts, Lunar Rover, Biodome Glass Hangar, Crew Habitat Domes, Deep Space Antenna, Science Corridors, Craters & Rock Boulders.
            </p>
            <a href="https://kenney.nl/assets/space-kit" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1 text-[11px]">
              Visit Kenney.nl <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Jummit */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between font-bold text-slate-100 mb-1">
              <span>Solar Panels Model (Jummit)</span>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/40">CC-BY 4.0</span>
            </div>
            <p className="text-slate-400 mb-1">
              Articulated dual-axis solar photovoltaic arrays with high-detail cell texturing.
            </p>
            <a href="https://opengameart.org/content/solar-panel" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1 text-[11px]">
              View on OpenGameArt.org <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* NASA Planetary Maps */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between font-bold text-slate-100 mb-1">
              <span>NASA SVS Lunar & Blue Marble Earth Maps</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">PUBLIC DOMAIN (NASA)</span>
            </div>
            <p className="text-slate-400 mb-1">
              High-resolution lunar surface albedo and elevation bump data; photorealistic Earth atmospheric diffuse and cloud layers.
            </p>
            <a href="https://svs.gsfc.nasa.gov/cgi-bin/details.cgi?aid=4720" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1 text-[11px]">
              NASA Scientific Visualization Studio <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Audio */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between font-bold text-slate-100 mb-1">
              <span>Soundtracks & Space Soundscape</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40">ROYALTY FREE / CC</span>
            </div>
            <p className="text-slate-400">
              "Reloj en el Vacío" (ambient lunar space soundtrack), "Red Alert Corridor" (emergency crisis tension soundtrack), and real-time Web Audio API synthesized tactile interface cues.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors mt-2"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
