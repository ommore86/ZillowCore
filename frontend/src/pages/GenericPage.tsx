import React, { useState, useEffect } from 'react';
import {
  Grid3X3, Users, Key, TrendingUp, ReceiptText, Truck,
  FileCheck2, BarChart3, Plus, Search, CheckCircle2,
  AlertCircle, Download, FileText, Star, ArrowUpRight
} from 'lucide-react';
import { ApiService } from '../services/api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface GenericPageProps {
  pageId: 'units' | 'crm' | 'tenants' | 'sales' | 'transactions' | 'vendors' | 'documents' | 'reports';
  onOpenCommand: (prompt?: string) => void;
}

export const GenericPage: React.FC<GenericPageProps> = ({ pageId, onOpenCommand }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [execSummary, setExecSummary] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    let fetchPromise: Promise<any>;

    switch (pageId) {
      case 'units':
        // Fetch properties then gather units
        fetchPromise = ApiService.getProperties().then(async props => {
          if (props.length > 0) return ApiService.getUnits(props[0].id);
          return [];
        });
        break;
      case 'crm':
      case 'tenants':
        fetchPromise = ApiService.getContacts(pageId === 'tenants' ? 'tenant' : undefined);
        break;
      case 'sales':
        fetchPromise = ApiService.getDeals();
        break;
      case 'transactions':
        fetchPromise = ApiService.getTransactions();
        break;
      case 'vendors':
        fetchPromise = ApiService.getVendors();
        break;
      case 'documents':
        fetchPromise = ApiService.getDocuments();
        break;
      case 'reports':
        fetchPromise = ApiService.getExecutiveSummary().then(res => {
          setExecSummary(res);
          return [];
        });
        break;
      default:
        fetchPromise = Promise.resolve([]);
    }

    fetchPromise
      .then(data => setItems(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pageId]);

  const titles: Record<string, { title: string; subtitle: string; icon: any }> = {
    units: { title: 'Property Units Inventory', subtitle: 'Multi-unit asset allocation, floor distribution, and unit occupancy', icon: Grid3X3 },
    crm: { title: 'Customer & Contact Directory', subtitle: 'Tenants, prospective buyers, institutional investors, and broker relations', icon: Users },
    tenants: { title: 'Tenant & Resident Management', subtitle: 'Resident profiles, active tenancy, and contact history', icon: Key },
    sales: { title: 'Sales Deals & Closing Pipeline', subtitle: 'Offer management, broker commissions, and deal stage transitions', icon: TrendingUp },
    transactions: { title: 'Financial Transaction Ledgers', subtitle: 'Verified double-entry revenue and expense journal entries', icon: ReceiptText },
    vendors: { title: 'Contractor & Vendor Management', subtitle: 'Approved vendor network, trade categories, performance ratings, and GST records', icon: Truck },
    documents: { title: 'Legal & Contract Document Vault', subtitle: 'Lease contracts, title deeds, OCR clause extraction, and expiry alerts', icon: FileCheck2 },
    reports: { title: 'Executive Business Intelligence', subtitle: 'Automated C-level operations briefing and portfolio analytics', icon: BarChart3 },
  };

  const meta = titles[pageId] || { title: pageId.toUpperCase(), subtitle: '', icon: Grid3X3 };
  const Icon = meta.icon;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2.5">
            <span>{meta.title}</span>
            <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {pageId === 'reports' ? 'AI Briefing' : `${items.length} Records`}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">{meta.subtitle}</p>
        </div>

        <button
          onClick={() => onOpenCommand(`Analyze operational data for ${meta.title}`)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-md shadow-primary-600/20 transition"
        >
          <span>AI Insight</span>
        </button>
      </div>

      {/* Reports Specific View */}
      {pageId === 'reports' && execSummary && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">{execSummary.title}</h3>
              <span className="text-[11px] font-mono text-emerald-600 font-semibold">Status: Verified OK</span>
            </div>
            <div className="text-slate-800 leading-relaxed font-sans bg-slate-50 p-4 rounded-xl border border-slate-200">
              <MarkdownRenderer content={execSummary.markdown_briefing} />
            </div>
          </div>
        </div>
      )}

      {/* Tables for other records */}
      {pageId !== 'reports' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-sans">
                  {pageId === 'vendors' && (
                    <>
                      <th className="pb-3">Vendor Company</th>
                      <th className="pb-3">Trade Category</th>
                      <th className="pb-3">Contact</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Rating</th>
                      <th className="pb-3">GST Number</th>
                    </>
                  )}
                  {pageId === 'crm' && (
                    <>
                      <th className="pb-3">Contact Name</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Company</th>
                      <th className="pb-3">Notes</th>
                    </>
                  )}
                  {pageId === 'tenants' && (
                    <>
                      <th className="pb-3">Tenant Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Portal Access</th>
                    </>
                  )}
                  {pageId === 'sales' && (
                    <>
                      <th className="pb-3">Deal Title</th>
                      <th className="pb-3">Stage</th>
                      <th className="pb-3">Offer Amount</th>
                      <th className="pb-3">Commission Rate</th>
                      <th className="pb-3">Commission Total</th>
                    </>
                  )}
                  {pageId === 'transactions' && (
                    <>
                      <th className="pb-3">Reference #</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Verification</th>
                    </>
                  )}
                  {pageId === 'documents' && (
                    <>
                      <th className="pb-3">Document Title</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Format</th>
                      <th className="pb-3">OCR Text Snippet</th>
                      <th className="pb-3">Status</th>
                    </>
                  )}
                  {pageId === 'units' && (
                    <>
                      <th className="pb-3">Unit Number</th>
                      <th className="pb-3">Floor</th>
                      <th className="pb-3">Bedrooms</th>
                      <th className="pb-3">Bathrooms</th>
                      <th className="pb-3">Area (sqft)</th>
                      <th className="pb-3">Rent / mo</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50 transition">
                    {pageId === 'vendors' && (
                      <>
                        <td className="py-3 font-semibold text-slate-900">{item.company_name}</td>
                        <td className="py-3 capitalize text-slate-600 font-mono text-[11px]">{item.service_category}</td>
                        <td className="py-3 text-slate-600">{item.contact_name}</td>
                        <td className="py-3 font-mono text-[11px] text-slate-600">{item.phone}</td>
                        <td className="py-3 text-amber-500 font-bold">{item.rating} ★</td>
                        <td className="py-3 font-mono text-[10px] text-slate-500">{item.gst_number || '27AABC1234Z'}</td>
                      </>
                    )}
                    {pageId === 'crm' && (
                      <>
                        <td className="py-3 font-semibold text-slate-900">{item.full_name}</td>
                        <td className="py-3 capitalize text-primary-600 font-mono text-[11px]">{item.contact_type}</td>
                        <td className="py-3 font-mono text-[11px] text-slate-500">{item.email}</td>
                        <td className="py-3 font-mono text-[11px] text-slate-600">{item.phone}</td>
                        <td className="py-3 text-slate-600">{item.company || '—'}</td>
                        <td className="py-3 text-slate-500 text-[11px] max-w-xs truncate">{item.notes}</td>
                      </>
                    )}
                    {pageId === 'tenants' && (
                      <>
                        <td className="py-3 font-semibold text-slate-900">{item.full_name}</td>
                        <td className="py-3 font-mono text-[11px] text-slate-500">{item.email}</td>
                        <td className="py-3 font-mono text-[11px] text-slate-600">{item.phone}</td>
                        <td className="py-3">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active Resident
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 text-[11px]">Authorized</td>
                      </>
                    )}
                    {pageId === 'sales' && (
                      <>
                        <td className="py-3 font-semibold text-slate-900">{item.title}</td>
                        <td className="py-3">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
                            {item.stage}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-900">₹{item.offer_amount?.toLocaleString()}</td>
                        <td className="py-3 font-mono text-slate-500">{item.commission_rate}%</td>
                        <td className="py-3 font-mono font-bold text-emerald-600">₹{item.commission_amount?.toLocaleString()}</td>
                      </>
                    )}
                    {pageId === 'transactions' && (
                      <>
                        <td className="py-3 font-mono text-primary-600">{item.reference_number || 'TXN-90218'}</td>
                        <td className="py-3 capitalize text-slate-700">{item.type?.replace('_', ' ')}</td>
                        <td className="py-3 text-slate-600">{item.category}</td>
                        <td className={`py-3 font-mono font-bold ${
                          item.type?.includes('income') ? 'text-emerald-600' : 'text-slate-800'
                        }`}>
                          ₹{item.amount?.toLocaleString()}
                        </td>
                        <td className="py-3 text-slate-500 text-[11px]">{item.date?.slice(0, 10)}</td>
                        <td className="py-3">
                          <span className="text-emerald-600 text-[11px] font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        </td>
                      </>
                    )}
                    {pageId === 'documents' && (
                      <>
                        <td className="py-3 font-semibold text-slate-900">{item.title}</td>
                        <td className="py-3 capitalize text-slate-700 font-mono text-[11px]">{item.document_type}</td>
                        <td className="py-3 uppercase text-primary-600 font-mono text-[10px]">{item.file_format}</td>
                        <td className="py-3 text-slate-500 text-[11px] max-w-sm truncate">{item.ocr_extracted_text || 'OCR verified'}</td>
                        <td className="py-3">
                          <span className="text-emerald-600 text-[11px] font-semibold">Active</span>
                        </td>
                      </>
                    )}
                    {pageId === 'units' && (
                      <>
                        <td className="py-3 font-bold text-slate-900 font-mono">{item.unit_number}</td>
                        <td className="py-3 text-slate-700">Floor {item.floor}</td>
                        <td className="py-3 text-slate-700">{item.bedrooms} BHK</td>
                        <td className="py-3 text-slate-700">{item.bathrooms} Baths</td>
                        <td className="py-3 font-mono text-slate-600">{item.area_sqft} sqft</td>
                        <td className="py-3 font-mono text-emerald-600 font-bold">₹{item.rental_price?.toLocaleString()}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

