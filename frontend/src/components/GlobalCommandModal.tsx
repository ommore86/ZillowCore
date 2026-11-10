import React, { useState, useEffect } from 'react';
import {
  X, Bot, Sparkles, Send, CheckCircle2,
  AlertCircle, Building2, MapPin, Loader2
} from 'lucide-react';
import { ApiService } from '../services/api';
import { CommandResponse } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface GlobalCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const GlobalCommandModal: React.FC<GlobalCommandModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = ''
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CommandResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  if (!isOpen) return null;

  const handleExecute = async (queryText?: string) => {
    const q = queryText || prompt;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await ApiService.executeCommand(q);
      setResponse(res);
    } catch (err: any) {
      setError(err.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Find luxury 4BHK villas in Bhopal under ₹2 Crore",
    "Run multimodal valuation on BKC Mumbai apartment",
    "Show me tenants with delinquent or overdue rent",
    "Generate monthly executive operations summary",
    "Identify properties with pending maintenance tickets"
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-200 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>AI Command Center</span>
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 border border-primary-200">
                  LangGraph Multi-Agent
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Natural Language Operational Orchestration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecute();
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Issue natural language command (e.g., 'Find 3BHK villas in Bhopal under ₹2 Cr')..."
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white transition"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-40 transition shadow-xs"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>

          {/* Quick Suggestion Chips */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(s);
                  handleExecute(s);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {response && (
            <div className="space-y-4">
              {/* Agent Execution Trace Steps */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pb-2 border-b border-slate-200">
                  <span>Agent Execution Trace</span>
                  <span className="font-mono text-primary-600">Selected: {response.selected_agent}</span>
                </div>
                <div className="space-y-2">
                  {response.steps.map((st) => (
                    <div key={st.step_number} className="flex items-start space-x-2.5 text-xs">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-300 text-[10px] font-bold">
                        {st.step_number}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{st.agent}</span>
                          <span className="text-[10px] text-emerald-600 uppercase font-mono font-bold">{st.status}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{st.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Markdown Executive Result */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 shadow-xs">
                <MarkdownRenderer content={response.summary_markdown} />
              </div>

              {/* Matched Assets Cards (if any) */}
              {response.result?.matched_properties && response.result.matched_properties.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700">Geo-Spatial Matched Assets</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {response.result.matched_properties.map((p: any) => (
                      <div key={p.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center space-x-3 shadow-xs">
                        {p.featured_image ? (
                          <img src={p.featured_image} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Building2 className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-xs text-slate-900 truncate">{p.title}</h5>
                          <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-primary-500 shrink-0" />
                            <span className="truncate">{p.city}, {p.state}</span>
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-bold text-emerald-600 font-mono">₹{p.current_valuation?.toLocaleString()}</span>
                            <span className="text-[10px] font-mono text-slate-500">Match: {Math.round((p.composite_rank_score || 0.85) * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!response && !loading && (
            <div className="text-center py-10 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-200 flex items-center justify-center mx-auto text-primary-600 shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-800">Issue an autonomous natural-language operational instruction</p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                EstateOS AI parses multi-agent spatial queries, triggers financial transactions, drafts dunning reminders, and generates executive summaries.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
