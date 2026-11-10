import React, { useState } from 'react';
import { X, Database, Terminal, CheckCircle2, Play, ArrowRight, Loader2 } from 'lucide-react';
import { ApiService } from '../services/api';

interface ResoSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResoSandboxModal: React.FC<ResoSandboxModalProps> = ({ isOpen, onClose }) => {
  const [feedName, setFeedName] = useState('RESO_Central_India_MLS');
  const [samplePayload, setSamplePayload] = useState(`{
  "ListingKey": "MP-BPL-VAL-9021",
  "CustomLocality": "Bhopal Northeast Corridor",
  "PriceInINR": 19500000,
  "TotalCarpetArea": 3950,
  "ArchitecturalFinish": "Italian Marble & Hardwood"
}`);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleRunPipeline = async () => {
    setLoading(true);
    try {
      const parsed = JSON.parse(samplePayload);
      const res = await ApiService.testResoFeed(feedName, parsed);
      setResult(res);
    } catch (err: any) {
      alert('Invalid JSON payload: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Autonomous RESO / Data Ingestion Sandbox</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Self-Healing Ingestion Mesh
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Micro-VM compilation loop eliminates manual pipeline modifications (PDF Section 5)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4-Step Diagram from PDF */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between max-w-2xl mx-auto text-[11px] font-mono">
            <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs">
              Upstream MLS Feed
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold shadow-xs">
              Anomaly Detector
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="p-2 rounded-xl bg-primary-50 border border-primary-200 text-primary-800 font-semibold shadow-xs">
              Micro-VM Auto-Compile
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold shadow-xs">
              Production Mesh
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Upstream Feed Name</label>
              <input
                type="text"
                value={feedName}
                onChange={e => setFeedName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Raw Upstream MLS Record (Simulated Schema Drift)
              </label>
              <textarea
                rows={9}
                value={samplePayload}
                onChange={e => setSamplePayload(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-emerald-800 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <button
              onClick={handleRunPipeline}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Execute Self-Healing Pipeline Loop</span>
            </button>
          </div>

          {/* Sandbox Compiler Results */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-xs">
            {result ? (
              <div className="space-y-4 overflow-y-auto">
                {/* Verification Badge */}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Extraction Verification: {result.verification_score}%</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    LIVE DEPLOYED
                  </span>
                </div>

                <div className="text-xs space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                    Anomalies & Drifts Detected
                  </span>
                  <ul className="list-disc pl-4 text-amber-800 space-y-1 text-[11px]">
                    {result.drifts_detected.map((d: string, idx: number) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>

                {/* Auto-Generated Rust WASM Adapter Code */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                    <span>Synthesized Rust Adapter Binary</span>
                    <span className="text-emerald-700 font-semibold">{result.wasm_binary_hash}</span>
                  </div>
                  <pre className="p-3 rounded-xl bg-white border border-slate-200 text-[10px] font-mono text-slate-800 overflow-x-auto max-h-48 shadow-xs">
                    {result.auto_generated_adapter_code}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500">
                <Terminal className="w-8 h-8 text-emerald-600" />
                <h5 className="text-xs font-bold text-slate-800">Autonomous Micro-VM Sandbox Idle</h5>
                <p className="text-[11px] max-w-xs">
                  Click 'Execute Self-Healing Pipeline Loop' to trigger anomaly detection, dynamic Rust code generation, and test-suite verification.
                </p>
              </div>
            )}

            <div className="text-[10px] font-mono text-slate-400 text-center mt-3 pt-2 border-t border-slate-200">
              WebAssembly Dynamic Plugin Engine • Zero Human Intervention
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
