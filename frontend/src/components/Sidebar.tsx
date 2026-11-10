import React from 'react';
import {
  LayoutDashboard, Bot, Building2, Grid3X3, Users, GitPullRequest,
  Key, FileText, TrendingUp, ReceiptText, Wallet, Wrench, Truck,
  FileCheck2, BarChart3, Workflow, Cpu, Code2, Settings, LogOut,
  ChevronRight, Sparkles, ShieldCheck
} from 'lucide-react';
import { ApiService } from '../services/api';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: any;
}

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, section: 'Core' },
  { id: 'command-center', label: 'AI Command Center', icon: Bot, badge: 'AI', section: 'Core' },
  { id: 'properties', label: 'Properties', icon: Building2, section: 'Assets' },
  { id: 'units', label: 'Units', icon: Grid3X3, section: 'Assets' },
  { id: 'crm', label: 'CRM', icon: Users, section: 'Customer' },
  { id: 'leads', label: 'Leads & Pipeline', icon: GitPullRequest, badge: 'Kanban', section: 'Customer' },
  { id: 'tenants', label: 'Tenants', icon: Key, section: 'Customer' },
  { id: 'leases', label: 'Leases', icon: FileText, section: 'Operations' },
  { id: 'sales', label: 'Sales Deals', icon: TrendingUp, section: 'Operations' },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText, section: 'Finance' },
  { id: 'finance', label: 'Finance & Invoices', icon: Wallet, section: 'Finance' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, badge: 'AI Triage', section: 'Operations' },
  { id: 'vendors', label: 'Vendors', icon: Truck, section: 'Operations' },
  { id: 'documents', label: 'Documents & OCR', icon: FileCheck2, section: 'Legal' },
  { id: 'reports', label: 'Reports & BI', icon: BarChart3, section: 'Intelligence' },
  { id: 'automations', label: 'Automations', icon: Workflow, section: 'Intelligence' },
  { id: 'agents', label: 'AI Agent Center', icon: Cpu, badge: '24', section: 'Intelligence' },
  { id: 'developer', label: 'Developer Portal', icon: Code2, section: 'Platform' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'Platform' },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, currentUser }) => {
  const sections = ['Core', 'Assets', 'Customer', 'Operations', 'Finance', 'Legal', 'Intelligence', 'Platform'];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0 shadow-sm">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-600 flex items-center justify-center shadow-md shadow-primary-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900">EstateOS</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 border border-primary-200">AI</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">ZillowCore Engine</p>
          </div>
        </div>
      </div>

      {/* Tenant / Organization Pill */}
      <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 truncate">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-slate-700 font-semibold truncate">Apex Holdings</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">INR (₹)</span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {sections.map(section => {
          const items = NAV_ITEMS.filter(item => item.section === section);
          if (items.length === 0) return null;
          return (
            <div key={section} className="space-y-0.5">
              <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section}
              </div>
              {items.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-primary-600'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* AI Agents Online Status Box */}
      <div className="p-3 mx-2.5 mb-2 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Agent Orchestrator</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">24 / 24 Live</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          NGQR spatial router & MVE continuous valuation active.
        </p>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center font-bold text-xs text-primary-700">
            {currentUser?.full_name?.charAt(0) || 'A'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-800 truncate">{currentUser?.full_name || 'Admin User'}</p>
            <p className="text-[10px] text-slate-500 capitalize">{currentUser?.role?.replace('_', ' ') || 'Super Admin'}</p>
          </div>
        </div>
        <button
          onClick={() => {
            ApiService.logout();
            window.location.reload();
          }}
          title="Sign out"
          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
