import React, { useState, useEffect } from 'react';
import {
  GitPullRequest, Plus, Sparkles, MapPin, DollarSign,
  ChevronRight, X, Loader2
} from 'lucide-react';
import { ApiService } from '../services/api';
import { Lead } from '../types';

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Lead state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [budgetMax, setBudgetMax] = useState(20000000);
  const [preferredLocation, setPreferredLocation] = useState('Bhopal');

  const STAGES = [
    { id: 'new_lead', label: 'New Inquiries', color: 'slate' },
    { id: 'contacted', label: 'Contacted', color: 'blue' },
    { id: 'qualified', label: 'Qualified (AI Verified)', color: 'indigo' },
    { id: 'site_visit', label: 'Site Visits', color: 'amber' },
    { id: 'negotiation', label: 'Negotiation', color: 'purple' },
    { id: 'converted', label: 'Converted Deals', color: 'emerald' },
  ];

  const loadLeads = () => {
    setLoading(true);
    ApiService.getLeads()
      .then(data => setLeads(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleStageMove = async (leadId: string, nextStage: string) => {
    try {
      await ApiService.updateLeadStage(leadId, nextStage);
      loadLeads();
    } catch (err: any) {
      alert('Error updating lead stage: ' + err.message);
    }
  };

  const handleRunAiScoring = async () => {
    setScoring(true);
    try {
      await ApiService.executeAgentTask('lead_qualification', 'score_leads', {});
      loadLeads();
    } catch (err: any) {
      console.error(err);
    } finally {
      setScoring(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Create Contact
      const contact = await ApiService.createContact({
        contact_type: 'lead',
        full_name: contactName,
        email: contactEmail,
        phone: contactPhone,
        notes: `Interested in ${preferredLocation} property.`
      });

      // 2. Create Lead
      await ApiService.createLead({
        contact_id: contact.id,
        stage: 'new_lead',
        budget_min: budgetMax * 0.7,
        budget_max: budgetMax,
        preferred_location: preferredLocation,
        preferred_type: 'apartment',
        source: 'premier_agent'
      });

      setShowAddModal(false);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      loadLeads();
    } catch (err: any) {
      alert('Error adding lead: ' + err.message);
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
            <span>CRM & Sales Pipeline</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              6-Stage Kanban
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Zillow Premier Agent model with automated intent vectors and lead scoring
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleRunAiScoring}
            disabled={scoring}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-amber-700 border border-slate-200 text-xs font-semibold transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{scoring ? 'Scoring Leads...' : 'Run AI Lead Scoring'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* 6-Stage Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
        {STAGES.map((col, idx) => {
          const colLeads = leads.filter(l => l.stage === col.id);
          const nextStage = STAGES[idx + 1]?.id;

          return (
            <div key={col.id} className="bg-slate-100/70 border border-slate-200 rounded-2xl p-3 flex flex-col h-[70vh] shadow-xs">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-3">
                <span className="text-xs font-bold text-slate-800">{col.label}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-xs">
                  {colLeads.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                {colLeads.map(lead => (
                  <div
                    key={lead.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition shadow-xs space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {lead.contact?.full_name || 'Prospective Buyer'}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        lead.lead_score >= 80 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {lead.lead_score}★
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-primary-500 shrink-0" />
                        <span className="truncate">{lead.preferred_location || 'Pan-India'}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-700 font-mono">
                        <DollarSign className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>₹{(lead.budget_max / 10000000).toFixed(1)} Cr Max</span>
                      </div>
                    </div>

                    {/* Progress to next stage button */}
                    {nextStage && (
                      <button
                        onClick={() => handleStageMove(lead.id, nextStage)}
                        className="w-full mt-1.5 py-1 px-2 rounded-lg bg-slate-50 hover:bg-primary-600 text-[10px] font-semibold text-slate-600 hover:text-white flex items-center justify-center space-x-1 transition border border-slate-200"
                      >
                        <span>Move Next</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                {colLeads.length === 0 && (
                  <div className="text-center py-8 text-[11px] text-slate-400 italic">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Create New Lead Prospect</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="e.g. Anand Mahindra"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="name@corp.in"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="+91 98200 12345"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Budget Ceiling (INR)</label>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={e => setBudgetMax(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Target Market</label>
                  <select
                    value={preferredLocation}
                    onChange={e => setPreferredLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                  >
                    <option value="Bhopal">Bhopal</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create & Score Lead</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
