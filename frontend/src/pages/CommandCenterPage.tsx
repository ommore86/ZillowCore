import React, { useState } from 'react';
import {
  Bot, Sparkles, Send, Loader2, CheckCircle2,
  Building2, MapPin
} from 'lucide-react';
import { ApiService } from '../services/api';
import { CommandResponse } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const CommandCenterPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string; data?: CommandResponse }>>([
    {
      role: 'ai',
      text: '### Welcome to the EstateOS AI Multi-Agent Command Core\n\nIssue operational or analytical instructions in natural language (e.g., *"Find vacant commercial properties in Mumbai"*, *"Compute multimodal valuation for Bhopal luxury villa"*, *"Check delinquent rent invoices"*).'
    }
  ]);

  const handleSend = async (userText?: string) => {
    const q = userText || prompt;
    if (!q.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, text: q }];
    setMessages(newMessages);
    setPrompt('');
    setLoading(true);

    try {
      const res = await ApiService.executeCommand(q);
      setMessages([...newMessages, { role: 'ai' as const, text: res.summary_markdown, data: res }]);
    } catch (err: any) {
      setMessages([...newMessages, { role: 'ai' as const, text: `Command execution failed: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Find vacant 4BHK luxury villa in Bhopal under 2 Crore",
    "Run multimodal valuation on Bandra Skyview apartment",
    "Identify tenants with overdue rent and prepare reminder",
    "Generate monthly executive operations summary",
    "Audit active maintenance tickets with high SLA priority"
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto h-[calc(100vh-3.5rem)] flex flex-col justify-between space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-200 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Autonomous AI Command Center</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                24 Agents Live
              </span>
            </h1>
            <p className="text-xs text-slate-500">Natural-Language Operational Execution & Spatial Vector Matching</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>ORCHESTRATOR ONLINE</span>
        </div>
      </div>

      {/* Conversation Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl rounded-2xl p-4 text-xs space-y-3 shadow-xs ${
              m.role === 'user'
                ? 'bg-primary-600 text-white font-medium rounded-br-none shadow-md shadow-primary-600/10'
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
            }`}>
              <div className={`flex items-center space-x-2 pb-1.5 border-b text-[11px] font-semibold ${
                m.role === 'user' ? 'border-primary-500 text-primary-100' : 'border-slate-100 text-slate-500'
              }`}>
                {m.role === 'user' ? (
                  <span>You (Operator)</span>
                ) : (
                  <span className="flex items-center space-x-1 text-primary-600">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>EstateOS Master Orchestrator</span>
                  </span>
                )}
              </div>

              {/* Message Markdown prose */}
              {m.role === 'user' ? (
                <div className="whitespace-pre-line leading-relaxed">{m.text}</div>
              ) : (
                <MarkdownRenderer content={m.text} />
              )}

              {/* Structured Execution Traces */}
              {m.data?.steps && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">
                    Execution Trace (Selected Agent: {m.data.selected_agent})
                  </span>
                  <div className="space-y-1.5">
                    {m.data.steps.map(s => (
                      <div key={s.step_number} className="flex items-start space-x-2 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-700">{s.agent}: </span>
                          <span className="text-slate-600">{s.details}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Render property cards if returned */}
              {m.data?.result?.matched_properties && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {m.data.result.matched_properties.map((p: any) => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2.5 shadow-xs">
                      {p.featured_image ? (
                        <img src={p.featured_image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-xs text-slate-900 truncate">{p.title}</h5>
                        <p className="text-[10px] text-slate-500 truncate">{p.city} • ₹{p.current_valuation?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl p-4 bg-white border border-slate-200 text-xs text-slate-600 flex items-center space-x-2.5 shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
              <span>Master Orchestrator analyzing intent and dispatching domain agents...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form & Quick Buttons */}
      <div className="space-y-2 pt-2">
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition shadow-xs"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type any instruction (e.g., 'Find 3BHK villas in Bhopal under ₹2 Cr')..."
            className="w-full pl-4 pr-12 py-3 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 shadow-sm transition"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="absolute right-2 p-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-40 transition shadow-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
