
import React, { useState, useMemo } from 'react';
import { Incident } from '../types';

interface AddIncidentFormProps {
  onAdd: (incident: Incident) => void;
  onClose?: () => void;
  isFullPage?: boolean;
  masterVendors: string[];
  masterTechs: Record<string, string[]>;
  bannedTechs: string[];
}

const AddIncidentForm: React.FC<AddIncidentFormProps> = ({ onAdd, onClose, isFullPage, masterVendors, masterTechs, bannedTechs }) => {
  const initialForm = {
    incidentNumber: '',
    date: new Date().toISOString().split('T')[0],
    vendorName: '',
    technicianName: '',
    overallScore: 5,
    punctualityScore: 5,
    deliverablesScore: 5,
    isAbandoned: false,
    feedback: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const availableTechs = useMemo(() => {
    if (!formData.vendorName) return [];
    return masterTechs[formData.vendorName] || [];
  }, [formData.vendorName, masterTechs]);

  const isBanned = bannedTechs.includes(formData.technicianName.toLowerCase());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorName || !formData.technicianName) {
      alert("Please select both a Vendor and a Technician.");
      return;
    }
    const newIncident: Incident = {
      ...formData,
      id: `manual-${Date.now()}`
    };
    onAdd(newIncident);
    setFormData(initialForm);
    if (onClose) onClose();
  };

  const renderStars = (key: 'overallScore' | 'punctualityScore' | 'deliverablesScore') => (
    <div className="flex space-x-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setFormData({ ...formData, [key]: star })}
          className={`text-2xl transition-all hover:scale-110 active:scale-90 ${formData[key] >= star ? 'text-amber-400' : 'text-slate-200'}`}
        >
          ★
        </button>
      ))}
    </div>
  );

  const containerClass = isFullPage 
    ? "w-full bg-white rounded-3xl p-8" 
    : "w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col";

  return (
    <div className={containerClass}>
      {!isFullPage && (
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
          <div>
            <h3 className="text-xl font-black">New Record</h3>
            <p className="text-xs text-indigo-100 font-bold uppercase tracking-wider">Manual Entry</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-6 ${!isFullPage ? 'flex-1 overflow-y-auto p-6' : ''}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Incident #</label>
            <input
              required
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g. 123456"
              value={formData.incidentNumber}
              onChange={(e) => setFormData({ ...formData, incidentNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Date</label>
            <input
              type="date"
              required
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Select Vendor</label>
            <select
              required
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              value={formData.vendorName}
              onChange={(e) => setFormData({ ...formData, vendorName: e.target.value, technicianName: '' })}
            >
              <option value="">-- Choose Vendor --</option>
              {masterVendors.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Select Technician</label>
            <div className="relative">
              <select
                required
                disabled={!formData.vendorName}
                className={`w-full p-3.5 bg-slate-50 border rounded-xl text-sm font-bold focus:ring-4 outline-none transition-all ${!formData.vendorName ? 'opacity-50 cursor-not-allowed' : ''} ${isBanned ? 'border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:ring-indigo-500/10 focus:border-indigo-500'}`}
                value={formData.technicianName}
                onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
              >
                <option value="">-- Choose Tech --</option>
                {availableTechs.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {isBanned && (
                <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg">
                  <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest">⚠️ WARNING: This technician is blacklisted!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Overall Performance</span>
            {renderStars('overallScore')}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Punctuality</span>
            {renderStars('punctualityScore')}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Deliverables</span>
            {renderStars('deliverablesScore')}
          </div>
        </div>

        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest block">Service Abandoned?</span>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Mark if technician left mid-job</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isAbandoned: !formData.isAbandoned })}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${formData.isAbandoned ? 'bg-rose-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${formData.isAbandoned ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Comments & Feedback</label>
          <textarea
            required
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
            placeholder="Technical details, customer feedback..."
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
          />
        </div>

        <button
          type="submit"
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] mt-4"
        >
          Save Incident Record
        </button>
      </form>
    </div>
  );
};

export default AddIncidentForm;
