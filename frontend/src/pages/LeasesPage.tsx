import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, CheckCircle2, Clock, AlertTriangle, Key,
  Building2, RefreshCw, Edit3, ShieldCheck, X, Loader2
} from 'lucide-react';
import { ApiService } from '../services/api';
import { Lease, Property, Contact } from '../types';

export const LeasesPage: React.FC = () => {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Lease form
  const [propertyId, setPropertyId] = useState('');
  const [tenantContactId, setTenantContactId] = useState('');
  const [monthlyRent, setMonthlyRent] = useState(120000);
  const [deposit, setDeposit] = useState(360000);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      ApiService.getLeases(),
      ApiService.getProperties(),
      ApiService.getContacts('tenant')
    ])
      .then(([lData, pData, cData]) => {
        setLeases(lData);
        setProperties(pData);
        setContacts(cData);
        if (pData.length > 0 && !propertyId) setPropertyId(pData[0].id);
        if (cData.length > 0 && !tenantContactId) setTenantContactId(cData[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRenew = async (id: string) => {
    try {
      await ApiService.renewLease(id, 12);
      loadData();
    } catch (err: any) {
      alert('Error renewing lease: ' + err.message);
    }
  };

  const handleSign = async (id: string) => {
    try {
      await ApiService.signLease(id, 'Authorized Signer');
      loadData();
    } catch (err: any) {
      alert('Error signing lease: ' + err.message);
    }
  };

  const handleCreateLease = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ApiService.createLease({
        property_id: propertyId,
        tenant_contact_id: tenantContactId || (contacts[0]?.id),
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        monthly_rent: monthlyRent,
        security_deposit: deposit,
        escalation_rate_percent: 5.0
      });
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert('Error creating lease: ' + err.message);
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
            <span>Lease & Rental Agreements</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {leases.length} Active
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Contract lifecycle, automated 5% escalation, electronic signing, and compliance tracking
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Lease Contract</span>
        </button>
      </div>

      {/* Leases Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-2.5 px-3">Property Asset</th>
                <th className="py-2.5 px-3">Term Period</th>
                <th className="py-2.5 px-3">Monthly Rent</th>
                <th className="py-2.5 px-3">Deposit</th>
                <th className="py-2.5 px-3">Escalation</th>
                <th className="py-2.5 px-3">E-Sign Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {leases.map(lease => (
                <tr key={lease.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-sans font-semibold text-slate-900">
                    {lease.property?.title || 'Prime BKC Residential Unit'}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {lease.start_date.slice(0, 10)} to {lease.end_date.slice(0, 10)}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">₹{lease.monthly_rent?.toLocaleString()}/mo</td>
                  <td className="py-3 px-3 text-slate-600">₹{lease.security_deposit?.toLocaleString()}</td>
                  <td className="py-3 px-3 text-primary-700 font-semibold">{lease.escalation_rate_percent}% / yr</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      lease.signature_status === 'signed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {lease.signature_status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-2 font-sans">
                    {lease.signature_status !== 'signed' && (
                      <button
                        onClick={() => handleSign(lease.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition shadow-xs"
                      >
                        Sign E-Doc
                      </button>
                    )}
                    <button
                      onClick={() => handleRenew(lease.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition border border-slate-200"
                    >
                      Renew (+5%)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lease Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Draft Rental Agreement</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateLease} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Property</label>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Monthly Rent (INR)</label>
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={e => setMonthlyRent(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Security Deposit</label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={e => setDeposit(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
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
                  <span>Generate Agreement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
