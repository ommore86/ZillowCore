import React, { useState, useEffect } from 'react';
import {
  Code2, Key, Webhook as WebhookIcon, Terminal, Copy, Check,
  Plus, Trash2, ArrowUpRight, Play, Loader2
} from 'lucide-react';
import { ApiService } from '../services/api';
import { APIKey, Webhook } from '../types';

export const DeveloperPortalPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [sdkSnippets, setSdkSnippets] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSdkTab, setActiveSdkTab] = useState<'python' | 'typescript' | 'curl'>('python');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Key creation state
  const [newKeyName, setNewKeyName] = useState('');
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);

  // Live API Sandbox Runner State
  const [sandboxEndpoint, setSandboxEndpoint] = useState('/geospatial/route-intent');
  const [sandboxPayload, setSandboxPayload] = useState(`{
  "natural_language_query": "3BHK luxury apartment in Mumbai under 4.5 Crore",
  "target_result_limit": 3
}`);
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);
  const [sandboxRunning, setSandboxRunning] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      ApiService.getApiKeys(),
      ApiService.getWebhooks(),
      ApiService.getSdkSnippets()
    ])
      .then(([keysData, whData, sdkData]) => {
        setApiKeys(keysData);
        setWebhooks(whData);
        setSdkSnippets(sdkData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      const res = await ApiService.createApiKey(newKeyName);
      setCreatedRawKey(res.raw_key || 'eos_live_demo1234567890');
      setNewKeyName('');
      loadData();
    } catch (err: any) {
      alert('Error generating API key: ' + err.message);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (confirm('Revoke this API Key permanently?')) {
      await ApiService.revokeApiKey(id);
      loadData();
    }
  };

  const handleRunSandbox = async () => {
    setSandboxRunning(true);
    try {
      const parsed = JSON.parse(sandboxPayload);
      const res = await ApiService.routeSpatialIntent(parsed.natural_language_query, parsed.target_result_limit);
      setSandboxResponse(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setSandboxResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setSandboxRunning(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2.5">
            <span>Developer API Platform</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 border border-primary-200">
              REST v1.0
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise REST endpoints (`/api/v1`), OpenAPI/Swagger specification, rate limiting, and webhooks
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <a
            href={`${ApiService.getBaseUrl().replace(/\/api\/v1\/?$/, '')}/docs`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition shadow-xs"
          >
            <span>OpenAPI Swagger UI</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* API Key Management */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Key className="w-4 h-4 text-primary-600" />
              <span>Production API Keys</span>
            </h3>
            <p className="text-xs text-slate-500">Authenticated with SHA-256 key hashing and organization isolation</p>
          </div>
        </div>

        {/* Create Key Bar */}
        <form onSubmit={handleCreateKey} className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., 'External Listing Sync Adapter')..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            Generate Key
          </button>
        </form>

        {createdRawKey && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
            <div className="font-bold">New API Key Created! Copy it now (it will not be displayed again):</div>
            <div className="font-mono bg-white p-2 rounded-lg border border-slate-200 text-slate-900 flex items-center justify-between shadow-xs">
              <span>{createdRawKey}</span>
              <button
                onClick={() => copyToClipboard(createdRawKey, 'new-key')}
                className="text-slate-500 hover:text-slate-900 p-1"
              >
                {copiedKey === 'new-key' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Prefix</th>
                <th className="py-2.5 px-3">Role Scope</th>
                <th className="py-2.5 px-3">Rate Limit</th>
                <th className="py-2.5 px-3">Created</th>
                <th className="py-2.5 px-3 text-right">Revoke</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apiKeys.map(k => (
                <tr key={k.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{k.name}</td>
                  <td className="py-2.5 px-3 text-primary-600 font-bold">{k.key_prefix}...</td>
                  <td className="py-2.5 px-3 text-slate-600 capitalize">{k.role.replace('_', ' ')}</td>
                  <td className="py-2.5 px-3 text-slate-500">{k.rate_limit_per_minute} req/min</td>
                  <td className="py-2.5 px-3 text-slate-400">{k.created_at.slice(0, 10)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleRevokeKey(k.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Interactive Sandbox Query Runner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-600" />
              <span>Live API Sandbox Test</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">POST /api/v1/geospatial/route-intent</span>
          </div>

          <textarea
            rows={7}
            value={sandboxPayload}
            onChange={e => setSandboxPayload(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-emerald-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
          />

          <button
            onClick={handleRunSandbox}
            disabled={sandboxRunning}
            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm"
          >
            {sandboxRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Execute Live API Call</span>
          </button>
        </div>

        {/* Sandbox Response Output */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-700">HTTP Response 200 OK</span>
              <span className="text-[10px] font-mono text-slate-400">application/json</span>
            </div>
            <pre className="p-3 mt-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-56">
              {sandboxResponse || '// Click Execute Live API Call to verify query execution'}
            </pre>
          </div>
          <span className="text-[10px] text-slate-400 font-mono text-center">
            Zero-latency PostGIS indexing • 1536-dim vector matchmaking
          </span>
        </div>
      </div>

      {/* SDK Snippets (Python / TS / cURL) */}
      {sdkSnippets && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-primary-600" />
              <span>Multi-Language Integration SDK Snippets</span>
            </h3>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              {(['python', 'typescript', 'curl'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveSdkTab(tab)}
                  className={`px-3 py-1 rounded-lg capitalize font-mono text-[11px] transition ${
                    activeSdkTab === tab ? 'bg-white text-primary-700 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 overflow-x-auto">
            {sdkSnippets[activeSdkTab]}
          </pre>
        </div>
      )}
    </div>
  );
};
