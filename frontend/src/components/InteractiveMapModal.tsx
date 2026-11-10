import React, { useState, useEffect } from 'react';
import { X, MapPin, Building2, Compass } from 'lucide-react';
import { ApiService } from '../services/api';
import { Property } from '../types';

interface InteractiveMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProperty?: (prop: Property) => void;
}

export const InteractiveMapModal: React.FC<InteractiveMapModalProps> = ({
  isOpen,
  onClose,
  onSelectProperty
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);

  useEffect(() => {
    if (isOpen) {
      ApiService.getProperties().then(data => {
        setProperties(data);
        if (data.length > 0) setActiveProperty(data[0]);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = selectedCity === 'All'
    ? properties
    : properties.filter(p => p.city.toLowerCase().includes(selectedCity.toLowerCase()));

  const cities = ['All', 'Bhopal', 'Mumbai', 'Bengaluru', 'Delhi NCR', 'Pune'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Geo-Spatial PostGIS Explorer</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Sub-50ms Bounding Box
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">High-Concurrency Spatial Indexing & Geohashes</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* City Centroid Filters */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              {cities.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCity(c)}
                  className={`px-2.5 py-1 rounded-lg transition font-medium ${
                    selectedCity === c ? 'bg-white text-primary-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Map Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Interactive Geo Canvas Visualizer */}
          <div className="flex-1 bg-slate-100/70 relative overflow-hidden flex flex-col justify-between p-6">
            {/* Grid Pattern Background */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px), radial-gradient(#94a3b8 1px, #f1f5f9 1px)',
                backgroundSize: '36px 36px',
                backgroundPosition: '0 0, 18px 18px'
              }}
            ></div>

            {/* Simulated Satellite HUD overlay */}
            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-600 bg-white/90 backdrop-blur-sm p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center space-x-4">
                <span>DATUM: WGS84 (SRID 4326)</span>
                <span>CENTROID: {selectedCity.toUpperCase()}</span>
                <span>NODES: {filtered.length} ACTIVE PINS</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-700 font-semibold">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>RTK FIX 0.04m</span>
              </div>
            </div>

            {/* Property Marker Pins on Spatial Canvas */}
            <div className="relative flex-1 my-4 flex items-center justify-center">
              <div className="w-full h-full max-w-2xl relative border border-slate-200 rounded-2xl bg-white/70 backdrop-blur-xs p-8 flex flex-wrap gap-8 items-center justify-around shadow-sm">
                {filtered.map((prop) => {
                  const isSelected = activeProperty?.id === prop.id;
                  return (
                    <div
                      key={prop.id}
                      onClick={() => setActiveProperty(prop)}
                      className={`cursor-pointer transition-all duration-200 transform hover:scale-110 flex flex-col items-center ${
                        isSelected ? 'scale-110 z-20' : 'z-10'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition ${
                          isSelected
                            ? 'bg-primary-600 text-white ring-4 ring-primary-300'
                            : 'bg-white text-primary-600 border border-slate-300 hover:border-primary-500'
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="mt-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-mono text-slate-800 font-bold shadow-xs">
                        ₹{(prop.current_valuation / 10000000).toFixed(1)} Cr
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Coordinates Bar */}
            <div className="relative z-10 text-[10px] font-mono text-slate-500 flex items-center justify-between">
              <span>LAT: {activeProperty?.latitude.toFixed(4) || '23.2599'}° N | LON: {activeProperty?.longitude.toFixed(4) || '77.4126'}° E</span>
              <span>GEOHASH: {activeProperty?.geohash || 'tsj02n1'}</span>
            </div>
          </div>

          {/* Property Sidebar Inspector */}
          <div className="w-80 bg-white border-l border-slate-200 p-4 flex flex-col justify-between overflow-y-auto">
            {activeProperty ? (
              <div className="space-y-4">
                {activeProperty.featured_image && (
                  <img
                    src={activeProperty.featured_image}
                    alt={activeProperty.title}
                    className="w-full h-40 object-cover rounded-xl border border-slate-200 shadow-xs"
                  />
                )}
                <div>
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary-100 text-primary-700 border border-primary-200">
                      {activeProperty.property_type}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      activeProperty.status === 'occupied' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {activeProperty.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{activeProperty.title}</h4>
                  <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                    <span>{activeProperty.address_line}, {activeProperty.city}</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Valuation:</span>
                    <span className="font-bold text-emerald-700 font-mono">₹{activeProperty.current_valuation.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Rental Yield:</span>
                    <span className="font-semibold text-slate-800 font-mono">₹{activeProperty.rental_value.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Floor Space:</span>
                    <span className="font-semibold text-slate-800 font-mono">{activeProperty.area_sqft} sq.ft</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Configuration:</span>
                    <span className="font-semibold text-slate-800">{activeProperty.bedrooms} Beds • {activeProperty.bathrooms} Baths</span>
                  </div>
                </div>

                {activeProperty.amenities && (
                  <div>
                    <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amenities</h5>
                    <div className="flex flex-wrap gap-1">
                      {activeProperty.amenities.map(a => (
                        <span key={a} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Select a property pin to inspect spatial telemetry.</p>
            )}

            <button
              onClick={() => {
                if (activeProperty && onSelectProperty) {
                  onSelectProperty(activeProperty);
                }
                onClose();
              }}
              className="w-full mt-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition shadow-sm"
            >
              Open Full Asset View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
