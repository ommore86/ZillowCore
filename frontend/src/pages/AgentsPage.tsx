import React, { useState, useEffect } from 'react';
import {
  Sparkles, CheckCircle2, Clock, AlertTriangle, Play,
  ShieldAlert, Check, X, Terminal, Loader2
} from 'lucide-react';
import { ApiService } from '../services/api';
import { AIAgent, AgentTask, Approval } from '../types';

export const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executionBanner, setExecutionBanner] = useState<{
    type: 'success' | 'error';
    message: string;
    task?: any;
  } | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      ApiService.getAgentRegistry(),
      ApiService.getAgentTasks(),
      ApiService.getPendingApprovals()
    ])
      .then(([agentsData, tasksData, approvalsData]) => {
        setAgents(agentsData);
        setTasks(tasksData);
        setApprovals(approvalsData);
        if (agentsData.length > 0 && !selectedAgent) {
          setSelectedAgent(agentsData[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExecuteAgent = async (agent: AIAgent) => {
    setExecuting(true);
    setExecutionBanner(null);
    try {
      const task = await ApiService.executeAgentTask(agent.agent_code, 'diagnostic_run', {
        timestamp: new Date().toISOString(),
        diagnostic_mode: true
      });
      setExecutionBanner({
        type: 'success',
        message: `Workflow executed successfully by ${agent.name}! (Latency: ${task.execution_time_ms}ms | Tokens: ${task.tokens_used} | Task ID: ${task.id?.slice(0, 8)}...)`,
        task
      });
      loadData();
    } catch (err: any) {
      setExecutionBanner({
        type: 'error',
        message: `Agent execution failed: ${err.message}`
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleApproval = async (id: string, decision: 'approved' | 'rejected') => {
    try {
      await ApiService.decideApproval(id, decision);
      loadData();
    } catch (err: any) {
      alert('Error updating approval: ' + err.message);
    }
  };

  const totalTokens = tasks.reduce((sum, t) => sum + (t.tokens_used || 0), 0);
  const totalCost = tasks.reduce((sum, t) => sum + (t.cost_usd || 0), 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2.5">
            <span>Agent Control Center</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              24 / 24 Online
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized LangGraph multi-agent orchestration, token telemetry, and human-in-the-loop approvals
          </p>
        </div>

        {/* Telemetry Stats */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-slate-500">Total Tasks: </span>
            <span className="text-slate-900 font-bold">{tasks.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-slate-500">Tokens: </span>
            <span className="text-primary-600 font-bold">{totalTokens.toLocaleString()}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-slate-500">Cost: </span>
            <span className="text-emerald-600 font-bold">${totalCost.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Execution Feedback Banner */}
      {executionBanner && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-xs transition-all ${
          executionBanner.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2.5 font-medium">
            {executionBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{executionBanner.message}</span>
          </div>
          <button
            onClick={() => setExecutionBanner(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Human-in-the-Loop Approval Queue Banner */}
      {approvals.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Human-in-the-Loop Approval Queue ({approvals.length} Pending)</span>
            </div>
            <span className="text-[10px] text-amber-700 font-mono bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">Management Sign-off Required</span>
          </div>
          <div className="space-y-2">
            {approvals.map(appr => (
              <div
                key={appr.id}
                className="p-3 rounded-xl bg-white border border-amber-200 flex items-center justify-between text-xs shadow-xs"
              >
                <div>
                  <h4 className="font-semibold text-slate-900">{appr.title}</h4>
                  <p className="text-[11px] text-slate-500">{appr.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApproval(appr.id, 'rejected')}
                    className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-semibold transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproval(appr.id, 'approved')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: 24 Agents Catalog & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 24 Agents List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-semibold text-slate-500">
            <span>Specialized Domain Agent Ecosystem (24)</span>
            <span>Latency / Status</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {agents.map(agent => {
              const isSelected = selectedAgent?.agent_code === agent.agent_code;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-3 rounded-xl cursor-pointer border transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-primary-50/70 border-primary-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{agent.name}</h4>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">{agent.category}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold">{agent.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
                    <span>{agent.average_latency_ms.toFixed(0)}ms latency</span>
                    <span>{agent.total_invocations} calls</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Agent Inspector & Real Workflow Runner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          {selectedAgent ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-primary-700 font-bold bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                  {selectedAgent.category} domain agent
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">{selectedAgent.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Code: {selectedAgent.agent_code}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 block">System Directive:</span>
                <p className="text-[11px] text-slate-600 italic leading-relaxed">
                  "Autonomous specialized operator responsible for domain execution with verified database access."
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">Approved Capabilities:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedAgent.capabilities?.map((cap: string) => (
                    <span
                      key={cap}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Invocations:</span>
                  <span className="text-slate-900 font-bold">{selectedAgent.total_invocations}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mean Duration:</span>
                  <span className="text-emerald-700 font-bold">{selectedAgent.average_latency_ms.toFixed(1)}ms</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select an agent to inspect details.</p>
          )}

          {selectedAgent && (
            <button
              onClick={() => handleExecuteAgent(selectedAgent)}
              disabled={executing}
              className="w-full mt-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-primary-600/20"
            >
              {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Execute Real Tested Workflow</span>
            </button>
          )}
        </div>
      </div>

      {/* Recent Execution Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-primary-600" />
            <span>Agent Activity & Execution Audit Logs</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Last 50 Recorded Runs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px] bg-slate-50/50">
                <th className="py-2.5 px-3">Task ID</th>
                <th className="py-2.5 px-3">Agent</th>
                <th className="py-2.5 px-3">Task Type</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Tokens</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.slice(0, 15).map(t => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition font-mono">
                  <td className="py-2.5 px-3 text-slate-500">{t.id.slice(0, 8)}...</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{t.agent_code}</td>
                  <td className="py-2.5 px-3 text-slate-600">{t.task_type}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'awaiting_approval'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{t.tokens_used}</td>
                  <td className="py-2.5 px-3 text-emerald-700 font-semibold">{t.execution_time_ms.toFixed(0)}ms</td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                    {new Date(t.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
