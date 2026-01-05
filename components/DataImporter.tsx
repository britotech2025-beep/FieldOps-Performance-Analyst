
import React, { useState, useMemo } from 'react';
import { Incident } from '../types';

interface DataImporterProps {
  onImport: (data: Incident[]) => void;
}

type ColumnKey = keyof Omit<Incident, 'id'>;

const DataImporter: React.FC<DataImporterProps> = ({ onImport }) => {
  const [showModal, setShowModal] = useState(false);
  const [columns, setColumns] = useState<Record<ColumnKey, string[]>>({
    incidentNumber: [],
    date: [],
    vendorName: [],
    technicianName: [],
    overallScore: [],
    punctualityScore: [],
    deliverablesScore: [],
    isAbandoned: [],
    feedback: []
  });

  // Fix: Explicitly define the state type to include color and placeholder properties to fix TS errors on lines 243 and 256
  const [activePasteCol, setActivePasteCol] = useState<{ 
    key: ColumnKey; 
    label: string; 
    color: string; 
    placeholder: string; 
  } | null>(null);
  const [pasteValue, setPasteValue] = useState('');

  const columnConfig: { key: ColumnKey; label: string; placeholder: string; color: string }[] = [
    { key: 'incidentNumber', label: 'Incidents #', placeholder: 'INC-001\nINC-002...', color: 'bg-slate-100 text-slate-700' },
    { key: 'date', label: 'Dates', placeholder: '2024-01-01\n2024-01-02...', color: 'bg-blue-50 text-blue-700' },
    { key: 'vendorName', label: 'Vendors', placeholder: 'Company A\nCompany B...', color: 'bg-indigo-50 text-indigo-700' },
    { key: 'technicianName', label: 'Technicians', placeholder: 'John Doe\nJane Smith...', color: 'bg-emerald-50 text-emerald-700' },
    { key: 'overallScore', label: 'Overall Score (1-5)', placeholder: '5\n4\n3...', color: 'bg-amber-50 text-amber-700' },
    { key: 'punctualityScore', label: 'Punctuality (1-5)', placeholder: '5\n5\n2...', color: 'bg-orange-50 text-orange-700' },
    { key: 'deliverablesScore', label: 'Deliverables (1-5)', placeholder: '4\n5\n5...', color: 'bg-cyan-50 text-cyan-700' },
    { key: 'isAbandoned', label: 'Abandoned (Yes/No)', placeholder: 'No\nNo\nYes...', color: 'bg-rose-50 text-rose-700' },
    { key: 'feedback', label: 'Feedback / Comments', placeholder: 'Good job\nLate\nIncomplete...', color: 'bg-purple-50 text-purple-700' },
  ];

  const handlePasteSubmit = () => {
    if (activePasteCol) {
      const values = pasteValue.split(/\r?\n/).map(v => v.trim()).filter(v => v !== '');
      setColumns(prev => ({ ...prev, [activePasteCol.key]: values }));
      setActivePasteCol(null);
      setPasteValue('');
    }
  };

  const maxRows = useMemo(() => {
    return Math.max(...(Object.values(columns) as string[][]).map(arr => arr.length));
  }, [columns]);

  const previewData = useMemo(() => {
    const data: Incident[] = [];
    for (let i = 0; i < maxRows; i++) {
      data.push({
        id: `bulk-${Date.now()}-${i}`,
        incidentNumber: columns.incidentNumber[i] || `INC-TEMP-${i + 1}`,
        date: columns.date[i] || new Date().toISOString().split('T')[0],
        vendorName: columns.vendorName[i] || 'Unknown',
        technicianName: columns.technicianName[i] || 'Unnamed',
        overallScore: parseInt(columns.overallScore[i]) || 5,
        punctualityScore: parseInt(columns.punctualityScore[i]) || 5,
        deliverablesScore: parseInt(columns.deliverablesScore[i]) || 5,
        isAbandoned: (columns.isAbandoned[i] || '').toLowerCase().includes('yes') || (columns.isAbandoned[i] || '').toLowerCase() === 'si',
        feedback: columns.feedback[i] || ''
      });
    }
    return data;
  }, [columns, maxRows]);

  const handleFinalImport = () => {
    if (previewData.length === 0) return;
    onImport(previewData);
    setShowModal(false);
    setColumns({
      incidentNumber: [],
      date: [],
      vendorName: [],
      technicianName: [],
      overallScore: [],
      punctualityScore: [],
      deliverablesScore: [],
      isAbandoned: [],
      feedback: []
    });
    alert(`✅ ${previewData.length} records imported successfully.`);
  };

  const clearAll = () => {
    if (confirm('Wipe current column builder?')) {
      setColumns({
        incidentNumber: [],
        date: [],
        vendorName: [],
        technicianName: [],
        overallScore: [],
        punctualityScore: [],
        deliverablesScore: [],
        isAbandoned: [],
        feedback: []
      });
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center transition-all active:scale-[0.98]"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        Column Builder (Paste)
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Table Constructor</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Paste individual columns from Excel/Sheets</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={clearAll} className="px-4 py-2 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-colors">Clear Builder</button>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Column Inputs Area */}
              <div className="w-full lg:w-1/3 p-8 border-r border-slate-100 bg-slate-50/30 overflow-y-auto space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Data Fields</h4>
                <div className="grid grid-cols-1 gap-3">
                  {columnConfig.map((col) => (
                    <button
                      key={col.key}
                      onClick={() => {
                        setActivePasteCol(col);
                        setPasteValue(columns[col.key].join('\n'));
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                        columns[col.key].length > 0 
                          ? 'bg-white border-indigo-200 shadow-sm' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${col.color}`}>
                          {columns[col.key].length}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-700">{col.label}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Click to paste</p>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Area */}
              <div className="flex-1 flex flex-col p-8 overflow-hidden bg-white">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Row Preview ({maxRows})</h4>
                  <p className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded">Missing data will be filled with generic values</p>
                </div>
                
                <div className="flex-1 overflow-auto border border-slate-100 rounded-[2rem] shadow-inner bg-slate-50/20">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="sticky top-0 bg-white shadow-sm">
                      <tr>
                        <th className="p-4 font-black text-slate-400 uppercase border-b">Inc #</th>
                        <th className="p-4 font-black text-slate-400 uppercase border-b">Date</th>
                        <th className="p-4 font-black text-slate-400 uppercase border-b">Vendor</th>
                        <th className="p-4 font-black text-slate-400 uppercase border-b">Technician</th>
                        <th className="p-4 font-black text-slate-400 uppercase border-b text-center">Scores</th>
                        <th className="p-4 font-black text-slate-400 uppercase border-b text-center">Aba</th>
                        <th className="p-4 font-black text-slate-400 uppercase border-b">Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white/60">
                      {previewData.slice(0, 100).map((row, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="p-4 font-black text-slate-700">{row.incidentNumber}</td>
                          <td className="p-4 text-slate-500">{row.date}</td>
                          <td className="p-4 font-black text-indigo-600">{row.vendorName}</td>
                          <td className="p-4 font-medium text-slate-600">{row.technicianName}</td>
                          <td className="p-4 text-center font-bold text-slate-400">
                            {row.overallScore}·{row.punctualityScore}·{row.deliverablesScore}
                          </td>
                          <td className="p-4 text-center">
                            {row.isAbandoned ? <span className="text-rose-500 font-black">YES</span> : <span className="text-slate-200">NO</span>}
                          </td>
                          <td className="p-4 text-slate-400 italic truncate max-w-[150px]">{row.feedback}</td>
                        </tr>
                      ))}
                      {maxRows > 100 && (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400 font-bold uppercase text-[9px]">
                            ... Showing first 100 of {maxRows} records ...
                          </td>
                        </tr>
                      )}
                      {maxRows === 0 && (
                        <tr>
                          <td colSpan={7} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest">Start by pasting data in the columns to the left</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-8 flex justify-end">
                  <button
                    onClick={handleFinalImport}
                    disabled={maxRows === 0}
                    className="px-12 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all disabled:opacity-30 active:scale-[0.98]"
                  >
                    Confirm & Import {maxRows} Records
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column Paste Modal (Nested) */}
      {activePasteCol && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-indigo-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
            {/* Fix: Property 'color' and 'placeholder' are now available on the activePasteCol type */}
            <div className={`p-8 border-b border-slate-100 flex items-center space-x-4 ${activePasteCol.color}`}>
              <div className="flex-1">
                <h4 className="text-xl font-black tracking-tight">Paste: {activePasteCol.label}</h4>
                <p className="text-xs font-bold uppercase tracking-widest mt-0.5 opacity-70">Paste a list of values (one per line)</p>
              </div>
              <button onClick={() => setActivePasteCol(null)} className="p-2 hover:bg-black/5 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <textarea
                autoFocus
                className="w-full h-80 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-mono text-sm leading-relaxed"
                placeholder={activePasteCol.placeholder}
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <button onClick={() => { setColumns(prev => ({ ...prev, [activePasteCol.key]: [] })); setActivePasteCol(null); }} className="text-rose-500 font-black text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-rose-50 rounded-xl">Clear Column</button>
                <div className="flex space-x-3">
                  <button onClick={() => setActivePasteCol(null)} className="px-6 py-3 text-slate-400 font-black text-xs uppercase tracking-widest">Cancel</button>
                  <button
                    onClick={handlePasteSubmit}
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                  >
                    Save Column
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataImporter;
