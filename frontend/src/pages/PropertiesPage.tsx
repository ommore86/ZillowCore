import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Download, Search, MapPin, Calculator,
  Bed, Bath, Maximize2, Trash2, X, Loader2
} from 'lucide-react';
import { ApiService } from '../services/api';
import { Property } from '../types';

interface PropertiesPageProps {
  onOpenValuation: (property?: Property) => void;
  onOpenMap: () => void;
}

export const PropertiesPage: React.FC<PropertiesPageProps> = ({ onOpenValuation, onOpenMap }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Property Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('apartment');
  const [newCity, setNewCity] = useState('Mumbai');
  const [newPrice, setNewPrice] = useState(25000000);
  const [newRent, setNewRent] = useState(85000);
  const [newArea, setNewArea] = useState(1600);
  const [newBeds, setNewBeds] = useState(3);
  const [newBaths, setNewBaths] = useState(2.5);

  const loadProperties = () => {
    setLoading(true);
    const params: Record<string, any> = {};
    if (typeFilter !== 'All') params.property_type = typeFilter.toLowerCase();
    if (cityFilter !== 'All') params.city = cityFilter;
    if (search) params.search = search;

    ApiService.getProperties(params)
      .then(data => setProperties(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProperties();
  }, [typeFilter, cityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProperties();
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ApiService.createProperty({
        title: newTitle,
        property_type: newType,
        address_line: `Prime Sector 4, ${newCity}`,
        city: newCity,
        state: 'Maharashtra',
        country: 'India',
        latitude: 19.0760,
        longitude: 72.8777,
        purchase_price: newPrice * 0.9,
        current_valuation: newPrice,
        rental_value: newRent,
        area_sqft: newArea,
        bedrooms: newBeds,
        bathrooms: newBaths,
        units_count: 1,
        amenities: ['Italian Marble', 'Smart Home Automation']
      });
      setShowAddModal(false);
      setNewTitle('');
      loadProperties();
    } catch (err: any) {
      alert('Error creating property: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to archive this property?')) {
      await ApiService.deleteProperty(id);
      loadProperties();
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2.5">
            <span>Property Asset Portfolio</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {properties.length} Total
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete property lifecycle management with PostGIS geo-coordinates and MVE valuation
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => ApiService.exportPropertiesCsv()}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenMap}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-primary-600" />
            <span>Geo Map</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, address, parcel ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {/* Property Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white"
          >
            <option value="All">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="office">Office</option>
            <option value="retail">Retail</option>
            <option value="warehouse">Warehouse</option>
          </select>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white"
          >
            <option value="All">All Markets</option>
            <option value="Bhopal">Bhopal</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Delhi">Delhi NCR</option>
            <option value="Pune">Pune</option>
          </select>
        </div>
      </div>

      {/* Property Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading assets...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(p => (
            <div
              key={p.id}
              className="rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-slate-300 transition flex flex-col justify-between group shadow-xs"
            >
              <div>
                {/* Image & Badges */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  {p.featured_image ? (
                    <img
                      src={p.featured_image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Building2 className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase text-primary-700 border border-slate-200 shadow-xs">
                      {p.property_type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] font-bold uppercase shadow-xs ${
                      p.status === 'occupied' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-md font-mono text-xs font-bold text-slate-900 shadow-md border border-slate-200">
                    ₹{p.current_valuation?.toLocaleString()}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-primary-600 transition truncate">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center space-x-1 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                      <span className="truncate">{p.address_line}, {p.city}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <Bed className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.bedrooms} Beds</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Bath className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.bathrooms} Baths</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.area_sqft} sqft</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Rental Value:</span>
                    <span className="font-mono font-bold text-slate-800">₹{p.rental_value?.toLocaleString()}/mo</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onOpenValuation(p)}
                  className="flex items-center space-x-1 text-xs text-amber-700 hover:text-amber-800 font-semibold"
                >
                  <Calculator className="w-3.5 h-3.5 text-amber-600" />
                  <span>Run MVE Valuation</span>
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 transition"
                  title="Archive Property"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-bold text-slate-900">Add New Property Asset</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Property Name / Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Prestige Lakeview Penthouse"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                  >
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="office">Office</option>
                    <option value="retail">Retail</option>
                    <option value="warehouse">Warehouse</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">City</label>
                  <select
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bhopal">Bhopal</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Delhi">Delhi NCR</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Purchase / Market Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={e => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    required
                    value={newRent}
                    onChange={e => setNewRent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Area (sqft)</label>
                  <input
                    type="number"
                    required
                    value={newArea}
                    onChange={e => setNewArea(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={newBeds}
                    onChange={e => setNewBeds(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Baths</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newBaths}
                    onChange={e => setNewBaths(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold flex items-center space-x-1.5 shadow-sm"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Property</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
