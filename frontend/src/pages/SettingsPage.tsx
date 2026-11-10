import React, { useState, useEffect } from 'react';
import {
  Settings, ShieldCheck, Building2, Check, Loader2
} from 'lucide-react';
import { ApiService } from '../services/api';
import { Organization, User } from '../types';

export const SettingsPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [taxRate, setTaxRate] = useState(18.0);

  useEffect(() => {
    Promise.all([
      ApiService.getOrganization(),
      ApiService.getTeam()
    ])
      .then(([orgData, teamData]) => {
        setOrganization(orgData);
        setTeam(teamData);
        setName(orgData.name);
        setCurrency(orgData.currency);
        setTaxRate(orgData.tax_rate);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ApiService.updateOrganization({ name, currency, tax_rate: taxRate });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert('Error updating settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2.5">
          <span>Enterprise Settings & RBAC</span>
          <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Multi-Tenant Isolated
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Tenant organization profile, 14-role access controls, currency configuration, and data isolation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Organization Profile */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-primary-600" />
            <h3 className="text-sm font-bold text-slate-900">Tenant Organization</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Organization Legal Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-primary-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Functional Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-primary-500 focus:bg-white"
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="AED">AED (Dirham)</option>
                <option value="EUR">EUR (€ - Euro)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Statutory GST / Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={taxRate}
                onChange={e => setTaxRate(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-primary-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4 text-white" /> : null}
              <span>{saved ? 'Settings Saved!' : 'Save Organization Profile'}</span>
            </button>
          </form>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between font-mono">
              <span>TENANT ID:</span>
              <span className="text-slate-800 font-semibold">{organization?.id.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between font-mono">
              <span>TIER:</span>
              <span className="text-emerald-700 font-bold uppercase">{organization?.subscription_tier}</span>
            </div>
          </div>
        </div>

        {/* Right: 14-Role RBAC Team Directory */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">14-Role Enterprise Team Directory ({team.length})</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Granular Resource Guard</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-sans">Full Name</th>
                  <th className="py-2.5 px-3 font-sans">Email</th>
                  <th className="py-2.5 px-3 font-sans">Enterprise Role</th>
                  <th className="py-2.5 px-3 font-sans">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {team.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{member.full_name}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{member.email}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 capitalize">
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-700 text-xs font-semibold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Active</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
