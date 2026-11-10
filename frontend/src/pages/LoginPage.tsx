import React, { useState } from 'react';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { ApiService } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@estateos.ai');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [backendUrl, setBackendUrl] = useState(ApiService.getBaseUrl());
  const [urlSaved, setUrlSaved] = useState(false);

  const handleSaveBackendUrl = (e: React.FormEvent) => {
    e.preventDefault();
    ApiService.setCustomApiUrl(backendUrl);
    setUrlSaved(true);
    setError(null);
    setTimeout(() => setUrlSaved(false), 2000);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.login(email, password);
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-50 flex flex-col justify-center items-center p-6 text-slate-800 selection:bg-primary-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-200/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo & Headline */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-primary-500/20 mb-3">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center space-x-2">
            <span>EstateOS</span>
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 border border-primary-200">
              AI
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">The Autonomous Real Estate Operating System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-xl space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-2">
              <p className="font-medium">{error}</p>
              <div className="pt-2 border-t border-red-200/60">
                <p className="text-[11px] text-red-600 mb-1.5 font-semibold">Connect to your live Render Backend:</p>
                <form onSubmit={handleSaveBackendUrl} className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://estateos-api-xxxx.onrender.com"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-red-300 rounded-lg text-slate-800 text-xs font-mono focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition"
                  >
                    Connect
                  </button>
                </form>
                {urlSaved && <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Backend URL saved! Click Sign In to connect.</p>}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Corporate Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@estateos.ai"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-primary-600/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In to Platform</span>}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Switch Demo Accounts */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block text-center">
              One-Click Demo Personas & Tailored Workspaces
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setDemoAccount('admin@estateos.ai')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                  email === 'admin@estateos.ai'
                    ? 'bg-primary-50 border-primary-400 text-primary-900 font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>👑 Super Admin</span>
                <span className="text-[9px] text-slate-400 font-mono">Overview Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('manager@estateos.ai')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                  email === 'manager@estateos.ai'
                    ? 'bg-primary-50 border-primary-400 text-primary-900 font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>🏢 Property Mgr</span>
                <span className="text-[9px] text-slate-400 font-mono">Property Portfolio</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('agent@estateos.ai')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                  email === 'agent@estateos.ai'
                    ? 'bg-primary-50 border-primary-400 text-primary-900 font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>💼 Real Estate Agent</span>
                <span className="text-[9px] text-slate-400 font-mono">Leads Kanban & Deals</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('finance@estateos.ai')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                  email === 'finance@estateos.ai'
                    ? 'bg-primary-50 border-primary-400 text-primary-900 font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>📊 Accountant</span>
                <span className="text-[9px] text-slate-400 font-mono">Finance & Ledgers</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('facility@estateos.ai')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                  email === 'facility@estateos.ai'
                    ? 'bg-primary-50 border-primary-400 text-primary-900 font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>🔧 Facility Mgr</span>
                <span className="text-[9px] text-slate-400 font-mono">Maintenance Triage</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('tenant@estateos.ai')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                  email === 'tenant@estateos.ai'
                    ? 'bg-primary-50 border-primary-400 text-primary-900 font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>🔑 Resident / Tenant</span>
                <span className="text-[9px] text-slate-400 font-mono">Resident Portal</span>
              </button>
            </div>

            {/* Backend URL Configuration */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="text-[10px] text-slate-400 hover:text-primary-600 underline transition"
              >
                {showConfig ? 'Hide Backend Settings' : '⚙️ Configure Backend Server URL'}
              </button>
              {showConfig && (
                <form onSubmit={handleSaveBackendUrl} className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-semibold block">Backend API URL:</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={backendUrl}
                      onChange={(e) => setBackendUrl(e.target.value)}
                      placeholder="https://estateos-api-xxxx.onrender.com"
                      className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 text-[11px] font-mono focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold text-[11px] transition"
                    >
                      Save
                    </button>
                  </div>
                  {urlSaved && <p className="text-[10px] text-emerald-600 font-semibold">Saved! Click Sign In to connect.</p>}
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>Apex Real Estate Holdings Pvt Ltd • ZillowCore Engine</p>
          <p className="font-mono">Sub-50ms PostGIS Routing • MVE Multimodal Valuation</p>
        </div>
      </div>
    </div>
  );
};
