import React, { useState, useEffect } from 'react';
import {
  Building2, Wallet, ReceiptText, Wrench, TrendingUp,
  Sparkles, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock
} from 'lucide-react';
import { ApiService } from '../services/api';
import { DashboardMetrics } from '../types';

interface DashboardPageProps {
  onOpenCommand: (prompt?: string) => void;
  onOpenValuation: () => void;
  onOpenMap: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenCommand,
  onOpenValuation,
  onOpenMap
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.getDashboardMetrics()
      .then(data => setMetrics(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-mono">Aggregating live real estate transactional ledgers...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Monthly Recurring Revenue',
      val: `₹${metrics.monthly_recurring_revenue.toLocaleString()}`,
      trend: '+6.8% vs last month',
      isUp: true,
      icon: Wallet,
      color: 'emerald'
    },
    {
      label: 'Net Operating Income (NOI)',
      val: `₹${metrics.net_operating_income.toLocaleString()}`,
      trend: '78% NOI margin',
      isUp: true,
      icon: TrendingUp,
      color: 'primary'
    },
    {
      label: 'Portfolio Occupancy',
      val: `${metrics.occupancy_percentage}%`,
      trend: `${metrics.occupied_properties} of ${metrics.total_properties} properties`,
      isUp: true,
      icon: Building2,
      color: 'indigo'
    },
    {
      label: 'Outstanding Receivables',
      val: `₹${metrics.outstanding_rent.toLocaleString()}`,
      trend: 'Pending tenant collection',
      isUp: false,
      icon: ReceiptText,
      color: 'amber'
    },
    {
      label: 'Pending Maintenance',
      val: metrics.pending_maintenance_requests,
      trend: 'Dispatched to vendor mesh',
      isUp: true,
      icon: Wrench,
      color: 'cyan'
    },
    {
      label: 'Lease Renewal Horizon',
      val: `${metrics.upcoming_lease_expirations} Leases`,
      trend: 'Expiring in next 60 days',
      isUp: false,
      icon: Clock,
      color: 'purple'
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2.5">
            <span>Executive Command Center</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live Relational DB
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-tenant telemetry for Apex Real Estate Holdings Pvt Ltd
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onOpenCommand("Generate monthly financial report")}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Executive Briefing</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
                <div className="p-2 rounded-xl bg-slate-50 text-primary-600 border border-slate-200">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">{kpi.val}</div>
              <div className="flex items-center space-x-1.5 mt-2 text-[11px]">
                {kpi.isUp ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span className={kpi.isUp ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                  {kpi.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Business Insights Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50/50 to-white border border-primary-200 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-primary-900">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Business Intelligence & Strategic Insights</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 font-semibold">Updated 5m ago</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {metrics.ai_insights.map((insight, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-700 flex items-start space-x-2 shadow-xs"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0"></div>
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts & Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expense Bar Trend */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Revenue Trends</h3>
              <p className="text-xs text-slate-500">Gross Rental Revenue vs Operational Outflows</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1 text-primary-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-600"></span>
                <span>Revenue</span>
              </span>
              <span className="flex items-center space-x-1 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span>Expenses</span>
              </span>
            </div>
          </div>

          <div className="h-64 flex items-end space-x-4 pt-6 pb-2">
            {metrics.revenue_trends.map((item, idx) => {
              const maxRev = Math.max(...metrics.revenue_trends.map(t => t.revenue)) || 1;
              const revHeight = (item.revenue / maxRev) * 100;
              const expHeight = (item.expenses / maxRev) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex items-end justify-center space-x-1.5 h-48">
                    <div
                      style={{ height: `${revHeight}%` }}
                      className="w-1/2 rounded-t-lg bg-primary-600 hover:bg-primary-500 transition relative group shadow-xs"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-[10px] font-mono text-white whitespace-nowrap z-20 pointer-events-none shadow-md">
                        ₹{(item.revenue / 100000).toFixed(1)}L
                      </div>
                    </div>
                    <div
                      style={{ height: `${expHeight}%` }}
                      className="w-1/2 rounded-t-lg bg-slate-300 hover:bg-slate-400 transition shadow-xs"
                    ></div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 mt-2 truncate w-full text-center">
                    {item.month.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Operations Launchpad */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Autonomous Launchpad</h3>
            <p className="text-xs text-slate-500 mt-0.5">Instant trigger for specialized AI sub-engines</p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={onOpenValuation}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 flex items-center justify-between text-left transition group shadow-xs"
            >
              <div>
                <span className="text-xs font-semibold text-slate-800 block group-hover:text-amber-700">
                  Multimodal Valuation Engine (MVE)
                </span>
                <span className="text-[11px] text-slate-500">Continuous appraisal with interior visual cues</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0" />
            </button>

            <button
              onClick={onOpenMap}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 flex items-center justify-between text-left transition group shadow-xs"
            >
              <div>
                <span className="text-xs font-semibold text-slate-800 block group-hover:text-primary-700">
                  Neural Geo-Spatial Query Router
                </span>
                <span className="text-[11px] text-slate-500">PostGIS dynamic polygon & geohash explorer</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 shrink-0" />
            </button>

            <button
              onClick={() => onOpenCommand("Send rent reminders to tenants with overdue payments")}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 flex items-center justify-between text-left transition group shadow-xs"
            >
              <div>
                <span className="text-xs font-semibold text-slate-800 block group-hover:text-emerald-700">
                  Rent Collection Dunning Workflow
                </span>
                <span className="text-[11px] text-slate-500">Dispatch automated reminders for unpaid invoices</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>24 domain agents actively monitoring property boundaries.</span>
          </div>
        </div>
      </div>

      {/* Property Performance Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Asset Performance & Valuation</h3>
            <p className="text-xs text-slate-500">Real-time asset metrics across active regional markets</p>
          </div>
          <button
            onClick={() => onOpenCommand("Show me all vacant properties")}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            Filter via AI Command →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-2.5 px-3">Asset Title</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Monthly Rent</th>
                <th className="py-2.5 px-3">Valuation</th>
                <th className="py-2.5 px-3">Cap Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.property_performance.map(prop => (
                <tr key={prop.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900">{prop.title}</td>
                  <td className="py-3 px-3 text-slate-600">{prop.city}</td>
                  <td className="py-3 px-3 capitalize text-slate-700">{prop.property_type}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      prop.occupancy === '100%' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {prop.occupancy === '100%' ? 'Occupied' : 'Vacant'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-800">₹{prop.monthly_income.toLocaleString()}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">₹{prop.current_valuation.toLocaleString()}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{prop.cap_rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
