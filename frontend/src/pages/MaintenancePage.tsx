import React, { useState, useEffect } from 'react';
import {
  Wrench, Plus, CheckCircle2, Clock, Truck, Sparkles, X, Loader2
} from 'lucide-react';
import { ApiService } from '../services/api';
import { MaintenanceTicket, WorkOrder, Property } from '../types';

export const MaintenancePage: React.FC = () => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [propertyId, setPropertyId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      ApiService.getMaintenanceTickets(),
      ApiService.getWorkOrders(),
      ApiService.getProperties()
    ])
      .then(([tData, woData, pData]) => {
        setTickets(tData);
        setWorkOrders(woData);
        setProperties(pData);
        if (pData.length > 0 && !propertyId) {
          setPropertyId(pData[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ApiService.createMaintenanceTicket({
        property_id: propertyId,
        title: title,
        description: description
      });
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      loadData();
    } catch (err: any) {
      alert('Error submitting ticket: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await ApiService.updateTicketStatus(id, status);
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2.5">
            <span>Maintenance & Facility Operations</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              AI Triage & SLA
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tenant requests, automated category & priority classification, vendor dispatch, and work order tracking
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Submit Request</span>
        </button>
      </div>

      {/* Grid: Tickets & Active Work Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Maintenance Tickets */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-primary-600" />
              <span>Service Tickets ({tickets.length})</span>
            </h3>
            <span className="text-xs font-mono text-slate-500">AI Priority Scored</span>
          </div>

          <div className="space-y-3">
            {tickets.map(t => (
              <div
                key={t.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono shadow-xs">
                      {t.category}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      t.priority === 'urgent'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : t.priority === 'high'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {t.priority} Priority
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500 font-semibold">SLA: {t.sla_hours}h</span>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-900">{t.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">{t.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Logged {t.created_at?.slice(0, 10)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {t.status !== 'resolved' ? (
                      <button
                        onClick={() => handleStatusChange(t.id, 'resolved')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition shadow-xs"
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-semibold text-[11px] flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Work Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Dispatched Work Orders ({workOrders.length})</span>
            </h3>
          </div>

          <div className="space-y-3">
            {workOrders.map(wo => (
              <div key={wo.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold font-mono text-slate-900">{wo.work_order_number}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary-100 text-primary-800 border border-primary-200">
                    {wo.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">{wo.notes}</p>
                <div className="text-xs font-mono text-emerald-700 font-bold flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-sans">Authorized Cost:</span>
                  <span>₹{wo.total_cost.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Ticket Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span>AI Maintenance Ticket Intake</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Select Property</label>
                <select
                  value={propertyId}
                  onChange={e => setPropertyId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.city})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Issue Headline</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Master bathroom pipe leakage"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the issue. AI Triage Agent will categorize and assign contractor priority..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
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
                  <span>Dispatch via AI Triage</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
