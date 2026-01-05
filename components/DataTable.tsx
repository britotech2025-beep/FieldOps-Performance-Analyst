
import React from 'react';
import { Incident } from '../types';

interface DataTableProps {
  incidents: Incident[];
  onDelete: (id: string) => void;
}

const DataTable: React.FC<DataTableProps> = ({ incidents, onDelete }) => {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Incident #</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Service Info</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Scores</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Status</th>
              <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Comments</th>
              <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {incidents.map((inc) => (
              <tr key={inc.id} className="hover:bg-slate-50/80 transition-all group">
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="font-black text-slate-800 text-sm tracking-tight">{inc.incidentNumber}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{inc.date}</div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="font-black text-indigo-600 text-xs uppercase tracking-wider">{inc.vendorName}</div>
                  <div className="text-slate-500 font-medium text-xs mt-0.5">{inc.technicianName}</div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-slate-300 uppercase mb-0.5">OVR</span>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-sm ${
                        inc.overallScore >= 4 ? 'bg-emerald-500 text-white' : 
                        inc.overallScore >= 3 ? 'bg-amber-400 text-white' : 
                        'bg-rose-500 text-white'
                      }`}>
                        {inc.overallScore}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-slate-300 uppercase mb-0.5">PNC</span>
                      <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-slate-600">
                        {inc.punctualityScore}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-slate-300 uppercase mb-0.5">DLV</span>
                      <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-slate-600">
                        {inc.deliverablesScore}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-center">
                  {inc.isAbandoned ? (
                    <span className="inline-flex items-center px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-100">
                      Abandoned
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                      Completed
                    </span>
                  )}
                </td>
                <td className="px-6 py-5 text-xs text-slate-500 max-w-[250px] leading-relaxed italic" title={inc.feedback}>
                  {inc.feedback}
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right">
                  <button 
                    onClick={() => onDelete(inc.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                    title="Delete Record"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {incidents.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Database is empty</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
