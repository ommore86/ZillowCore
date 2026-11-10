import React, { useState, useEffect } from 'react';
import {
  Wallet, ReceiptText, Plus, CheckCircle2, Clock, AlertTriangle,
  ArrowUpRight, ArrowDownRight, DollarSign, X, Loader2
} from 'lucide-react';
import { ApiService } from '../services/api';
import { Invoice } from '../types';

export const FinancePage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pnl, setPnl] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Invoice Form
  const [invNumber, setInvNumber] = useState(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [amount, setAmount] = useState(120000);
  const [notes, setNotes] = useState('Monthly rental invoice with 18% GST');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      ApiService.getInvoices(),
      ApiService.getPnl()
    ])
      .then(([invData, pnlData]) => {
        setInvoices(invData);
        setPnl(pnlData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePayInvoice = async (id: string) => {
    try {
      await ApiService.payInvoice(id);
      loadData();
    } catch (err: any) {
      alert('Error recording payment: ' + err.message);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ApiService.createInvoice({
        invoice_number: invNumber,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        amount: amount,
        notes: notes
      });
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert('Error generating invoice: ' + err.message);
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
            <span>Financial Accounting & Invoicing</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Double-Entry Ledger
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Accounts receivable, rental collections, GST tax ledgers, and verified payment settlements
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* P&L Statement Summary Cards */}
      {pnl && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Gross Operating Revenue</span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">₹{pnl.gross_revenue.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Rental & sales revenue</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Operating Expenditures</span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">₹{pnl.operating_expenses.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 font-medium">Maintenance & vendor payouts</div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 space-y-1 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Net Operating Income (NOI)</span>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono">₹{pnl.net_operating_income.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-800 font-bold">{pnl.noi_margin_percent}% Margin</div>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <ReceiptText className="w-4 h-4 text-primary-600" />
            <span>Accounts Receivable Invoices ({invoices.length})</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">18% GST Enabled</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Issue Date</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Base Rent</th>
                <th className="py-2.5 px-3">GST (18%)</th>
                <th className="py-2.5 px-3">Total Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900">{inv.invoice_number}</td>
                  <td className="py-3 px-3 text-slate-500">{inv.issue_date.slice(0, 10)}</td>
                  <td className="py-3 px-3 text-slate-700">{inv.due_date.slice(0, 10)}</td>
                  <td className="py-3 px-3 text-slate-700">₹{inv.amount.toLocaleString()}</td>
                  <td className="py-3 px-3 text-slate-500">₹{inv.gst_amount.toLocaleString()}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">₹{inv.total_amount.toLocaleString()}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {inv.status !== 'paid' && (
                      <button
                        onClick={() => handlePayInvoice(inv.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-[11px] font-semibold transition shadow-xs"
                      >
                        Settle Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Create Receivable Invoice</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Invoice Number</label>
                <input
                  type="text"
                  required
                  value={invNumber}
                  onChange={e => setInvNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Base Rental Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-primary-500 focus:bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  18% GST (₹{(amount * 0.18).toLocaleString()}) will be added automatically. Total: ₹{(amount * 1.18).toLocaleString()}
                </span>
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white"
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
                  <span>Generate Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
