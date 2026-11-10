import React, { useState } from 'react';
import { X, Calculator, Sparkles, Check, Loader2 } from 'lucide-react';
import { ApiService } from '../services/api';

interface ValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ValuationModal: React.FC<ValuationModalProps> = ({ isOpen, onClose }) => {
  const [areaSqft, setAreaSqft] = useState<number>(2000);
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(3);
  const [city, setCity] = useState<string>('mumbai');
  const [propertyType, setPropertyType] = useState<string>('apartment');
  const [selectedCues, setSelectedCues] = useState<Record<string, boolean>>({
    italian_marble: true,
    modular_designer_kitchen: true,
    smart_home_automation: true,
    high_natural_lighting: false,
    terrace_garden: false
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await ApiService.calculateValuation({
        area_sqft: areaSqft,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        property_type: propertyType,
        city: city,
        interior_features: selectedCues,
        amenities: Object.keys(selectedCues).filter(k => selectedCues[k])
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCue = (cue: string) => {
    setSelectedCues(prev => ({ ...prev, [cue]: !prev[cue] }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Multimodal Valuation Engine (MVE)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Autonomous Zestimate
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Continuous non-linear valuation via interior visual cues & satellite telemetry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Property Type</label>
              <select
                value={propertyType}
                onChange={e => setPropertyType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
              >
                <option value="apartment">Luxury Apartment</option>
                <option value="villa">Independent Villa</option>
                <option value="penthouse">Penthouse Triplex</option>
                <option value="office">Commercial Tech Office</option>
                <option value="retail">High-Street Retail</option>
                <option value="warehouse">Industrial Logistics Warehouse</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Market / City</label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                >
                  <option value="mumbai">Mumbai (BKC / Bandra)</option>
                  <option value="bhopal">Bhopal (Gulmohar / TT Nagar)</option>
                  <option value="bengaluru">Bengaluru (Whitefield)</option>
                  <option value="delhi">Delhi NCR (Gurugram)</option>
                  <option value="pune">Pune (Expressway Corridor)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Carpet Area: {areaSqft} sq.ft</label>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="50"
                  value={areaSqft}
                  onChange={e => setAreaSqft(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Bedrooms</label>
                <div className="flex space-x-1.5">
                  {[1, 2, 3, 4, 5].map(b => (
                    <button
                      key={b}
                      onClick={() => setBedrooms(b)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                        bedrooms === b ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {b}BHK
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Bathrooms</label>
                <div className="flex space-x-1.5">
                  {[1, 2, 3, 4].map(b => (
                    <button
                      key={b}
                      onClick={() => setBathrooms(b)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                        bathrooms === b ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Computer Vision Interior Cues */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Computer Vision Interior Features (VLA Extraction)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'italian_marble', label: 'Italian Marble Flooring (+10%)' },
                  { id: 'modular_designer_kitchen', label: 'Modular Kitchen (+6%)' },
                  { id: 'smart_home_automation', label: 'Smart Home Automation (+7%)' },
                  { id: 'high_natural_lighting', label: 'Floor-to-Ceiling Glass (+5%)' },
                  { id: 'terrace_garden', label: 'Private Terrace Garden (+9%)' }
                ].map(cue => (
                  <button
                    key={cue.id}
                    onClick={() => toggleCue(cue.id)}
                    className={`flex items-center justify-between p-2 rounded-xl text-[11px] text-left border transition ${
                      selectedCues[cue.id]
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cue.label}</span>
                    {selectedCues[cue.id] && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Compute Continuous Valuation</span>
            </button>
          </div>

          {/* Results Inspector */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            {result ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                    Continuous Valuation Estimate
                  </span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">
                      ₹{result.estimated_valuation.toLocaleString()}
                    </span>
                    <span className="text-xs text-emerald-700 font-bold">
                      ~₹{Math.round(result.estimated_valuation / areaSqft).toLocaleString()}/sq.ft
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Projected Rental Yield: <strong className="text-slate-900">₹{result.rental_estimate.toLocaleString()}/month</strong>
                  </p>
                </div>

                {/* Active Confidence Interval */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Confidence Score:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {Math.round(result.confidence_matrix.confidence_score * 100)}% Verified
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${result.confidence_matrix.confidence_score * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                    <span>Low: ₹{result.confidence_matrix.valuation_low.toLocaleString()}</span>
                    <span>High: ₹{result.confidence_matrix.valuation_high.toLocaleString()}</span>
                  </div>
                </div>

                {/* Macro & Satellite Telemetry */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 block">Satellite Infrastructure</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {result.confidence_matrix.satellite_neighborhood_score * 100}/100
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 block">Macro Inflation Factor</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {result.confidence_matrix.macroeconomic_factor}x
                    </span>
                  </div>
                </div>

                {/* Model Explanation */}
                <p className="text-[11px] text-slate-600 italic bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  {result.confidence_matrix.explanation}
                </p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-amber-500 shadow-xs">
                  <Calculator className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Multimodal Valuation Engine</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Configure structural area, interior features, and city submarket, then click compute.
                </p>
              </div>
            )}

            <div className="text-[10px] text-slate-400 text-center mt-4 border-t border-slate-200 pt-2">
              Autonomous continuous valuation replaces human appraiser dependencies and basic regression vulnerabilities.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
