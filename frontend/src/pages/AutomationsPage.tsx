import React, { useState, useEffect } from 'react';
import {
  Workflow, Plus, Play, CheckCircle2, ArrowRight, Zap, Bot,
  Bell, Loader2, Sparkles, X, ShieldAlert
} from 'lucide-react';
import { ApiService } from '../services/api';
import { WorkflowDefinition } from '../types';

export const AutomationsPage: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [activeLog, setActiveLog] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Workflow Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('rent_overdue');
  const [selectedAgent, setSelectedAgent] = useState('rent_collection');
  const [actionName, setActionName] = useState('Dispatch WhatsApp & Email Dunning');

  const triggerOptions = [
    { id: 'rent_overdue', label: 'Rent 5 Days Overdue', defaultAgent: 'rent_collection', defaultAction: 'Dispatch WhatsApp & Email Dunning' },
    { id: 'maintenance_leak', label: 'Emergency Water Leak Reported', defaultAgent: 'maintenance_triage', defaultAction: 'Assign Verified Contractor & Work Order' },
    { id: 'lead_intake', label: 'High-Intent 4BHK Lead Form Submitted', defaultAgent: 'lead_qualification', defaultAction: 'Route to Premier Broker & Send SMS' },
    { id: 'lease_expiry', label: 'Lease Expiring in 30 Days', defaultAgent: 'lease_lifecycle', defaultAction: 'Generate Renewal Notice with 5% Escalation' },
    { id: 'inspection_due', label: 'Quarterly Preventive Inspection Due', defaultAgent: 'facility_manager', defaultAction: 'Schedule Site Visit & Equipment Audit' },
    { id: 'document_uploaded', label: 'Title Deed Uploaded for OCR', defaultAgent: 'document_intelligence', defaultAction: 'Extract Clauses & Audit Encumbrance' },
  ];

  const agentOptions = [
    { code: 'rent_collection', label: 'Rent Collection Agent' },
    { code: 'maintenance_triage', label: 'Maintenance Triage Agent' },
    { code: 'lead_qualification', label: 'Lead Qualification Agent' },
    { code: 'lease_lifecycle', label: 'Lease Lifecycle Agent' },
    { code: 'document_intelligence', label: 'Document Intelligence Agent' },
    { code: 'customer_communication', label: 'Customer Communication Agent' },
    { code: 'property_valuation', label: 'Property Valuation Agent (MVE)' },
  ];

  const loadData = () => {
    setLoading(true);
    ApiService.getWorkflows()
      .then(data => setWorkflows(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTrigger = async (id: string) => {
    setTriggeringId(id);
    setActiveLog(null);
    try {
      const res = await ApiService.triggerWorkflow(id);
      setActiveLog(res);
    } catch (err: any) {
      alert('Error triggering workflow: ' + err.message);
    } finally {
      setTriggeringId(null);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const triggerObj = triggerOptions.find(t => t.id === triggerEvent);
      const agentObj = agentOptions.find(a => a.code === selectedAgent);

      const nodes = [
        { id: 'node_trigger', type: 'trigger', label: triggerObj?.label || 'Event Trigger' },
        { id: 'node_agent', type: 'agent', label: agentObj?.label || 'Domain AI Agent' },
        { id: 'node_action', type: 'action', label: actionName || 'Automated Action' }
      ];

      await ApiService.createWorkflow({
        name,
        description,
        trigger_event: triggerEvent,
        nodes_json: nodes,
        edges_json: []
      });

      setShowCreateModal(false);
      setName('');
      setDescription('');
      loadData();
    } catch (err: any) {
      alert('Failed to create workflow: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2.5">
            <span>Agentic Workflow Automation</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 border border-primary-200">
              Visual State Machine
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Autonomous multi-agent triggers, conditional branches, approvals, and failure recovery
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Workflow Pipeline</span>
        </button>
      </div>

      {/* Execution Results Notification Banner */}
      {activeLog && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between font-bold">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{activeLog.message}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
              ID: {activeLog.execution_id?.slice(0, 8)}...
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-slate-600 pl-6">
            {activeLog.logs?.map((l: any, idx: number) => (
              <div key={idx}>✓ [{l.timestamp?.slice(11, 19)}] {l.step} — {l.status}</div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Workflows Cards */}
      <div className="space-y-4">
        {workflows.map(wf => (
          <div
            key={wf.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 hover:border-slate-300 transition shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900">{wf.name}</h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{wf.description}</p>
              </div>

              <button
                onClick={() => handleTrigger(wf.id)}
                disabled={triggeringId === wf.id}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-primary-600 text-slate-700 hover:text-white border border-slate-200 text-xs font-semibold transition shadow-xs"
              >
                {triggeringId === wf.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Trigger Now</span>
              </button>
            </div>

            {/* Visual Flow Diagram */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 overflow-x-auto">
              <div className="flex items-center space-x-3 text-xs font-mono min-w-[600px]">
                {wf.nodes_json?.map((node: any, idx: number) => (
                  <React.Fragment key={node.id || idx}>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center space-x-2 text-slate-800 shrink-0">
                      {node.type === 'trigger' && <Zap className="w-3.5 h-3.5 text-amber-500" />}
                      {node.type === 'agent' && <Bot className="w-3.5 h-3.5 text-primary-600" />}
                      {node.type === 'action' && <Bell className="w-3.5 h-3.5 text-emerald-600" />}
                      <span className="font-semibold">{node.label}</span>
                    </div>
                    {idx < wf.nodes_json.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create New Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-200 shadow-xs">
                  <Workflow className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">New Agentic Workflow Pipeline</h3>
                  <p className="text-[11px] text-slate-500">Configure event trigger, autonomous AI agent, and target execution</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Pipeline Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Automated Preventive HVAC Alert"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Dispatches contractor and alerts facility manager upon sensor alert"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Trigger Event</label>
                  <select
                    value={triggerEvent}
                    onChange={(e) => {
                      setTriggerEvent(e.target.value);
                      const opt = triggerOptions.find(o => o.id === e.target.value);
                      if (opt) {
                        setSelectedAgent(opt.defaultAgent);
                        setActionName(opt.defaultAction);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                  >
                    {triggerOptions.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Assigned AI Agent</label>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                  >
                    {agentOptions.map(a => (
                      <option key={a.code} value={a.code}>{a.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Target Action</label>
                <input
                  type="text"
                  required
                  value={actionName}
                  onChange={(e) => setActionName(e.target.value)}
                  placeholder="e.g. Dispatch WhatsApp & Email Dunning"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>

              {/* Visual Pipeline Node Preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-semibold text-slate-600 block">Pipeline State Machine Preview:</span>
                <div className="flex items-center space-x-2 text-[11px] font-mono">
                  <div className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                    ⚡ {triggerOptions.find(t => t.id === triggerEvent)?.label || triggerEvent}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <div className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-800 border border-primary-200">
                    🤖 {agentOptions.find(a => a.code === selectedAgent)?.label || selectedAgent}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                    🔔 {actionName}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold transition shadow-sm flex items-center space-x-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save & Activate Pipeline</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
