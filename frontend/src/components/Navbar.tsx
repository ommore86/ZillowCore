import React from 'react';
import {
  Bot, MapPin, Calculator, Database,
  CheckCircle2
} from 'lucide-react';

interface NavbarProps {
  onOpenCommand: () => void;
  onOpenValuation: () => void;
  onOpenMap: () => void;
  onOpenReso: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCommand,
  onOpenValuation,
  onOpenMap,
  onOpenReso
}) => {
  return (
    <header className="h-14 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between z-10 sticky top-0 shadow-xs">
      {/* Global AI Command Bar Trigger */}
      <div className="flex-1 max-w-xl">
        <button
          onClick={onOpenCommand}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 hover:border-primary-400 text-xs text-slate-600 hover:text-slate-900 transition shadow-inner group"
        >
          <div className="flex items-center space-x-2.5">
            <Bot className="w-4 h-4 text-primary-600 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Ask AI Command Center: "Find vacant villas in Bhopal under ₹2 Cr"...</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-600 rounded border border-slate-300 shadow-xs">Ctrl</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-600 rounded border border-slate-300 shadow-xs">K</kbd>
          </div>
        </button>
      </div>

      {/* Quick Access Engine Launchers */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onOpenMap}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition shadow-xs"
        >
          <MapPin className="w-3.5 h-3.5 text-primary-600" />
          <span>Geo-Spatial Map</span>
        </button>

        <button
          onClick={onOpenValuation}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition shadow-xs"
        >
          <Calculator className="w-3.5 h-3.5 text-amber-600" />
          <span>MVE Valuation</span>
        </button>

        <button
          onClick={onOpenReso}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition shadow-xs"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>RESO Sandbox</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1"></div>

        {/* System Health Pill */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 font-semibold font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>API 99.99%</span>
        </div>
      </div>
    </header>
  );
};
