
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Incident, EntityType, BannedTechnician, UserAccount, MasterVendor, MasterTechnician } from './types';
import { MOCK_DATA } from './constants';
import StatsCard from './components/StatsCard';
import DataTable from './components/DataTable';
import DataImporter from './components/DataImporter';
import AddIncidentForm from './components/AddIncidentForm';
import { analyzePerformance } from './services/geminiService';

const STORAGE_KEY = 'fieldops_incidents_v2';
const BANNED_KEY = 'fieldops_banned_v1';
const USERS_KEY = 'fieldops_users_v1';
const MASTER_VENDORS_KEY = 'fieldops_master_vendors_v1';
const MASTER_TECHS_KEY = 'fieldops_master_techs_v1';

type TabType = 'Analysis' | 'Report' | 'Admin';
type AdminSubTab = 'Database' | 'ManageEntities' | 'Banned' | 'Users';

const App: React.FC = () => {
  // Data States
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : MOCK_DATA;
  });

  const [bannedTechs, setBannedTechs] = useState<BannedTechnician[]>(() => {
    const saved = localStorage.getItem(BANNED_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [masterVendors, setMasterVendors] = useState<MasterVendor[]>(() => {
    const saved = localStorage.getItem(MASTER_VENDORS_KEY);
    return saved ? JSON.parse(saved) : [
      { id: 'v1', name: 'QuickFix Systems' },
      { id: 'v2', name: 'Reliable Infra' }
    ];
  });

  const [masterTechnicians, setMasterTechnicians] = useState<MasterTechnician[]>(() => {
    const saved = localStorage.getItem(MASTER_TECHS_KEY);
    return saved ? JSON.parse(saved) : [
      { id: 't1', name: 'John Doe', vendorName: 'QuickFix Systems' },
      { id: 't2', name: 'Sarah Smith', vendorName: 'Reliable Infra' }
    ];
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(USERS_KEY);
    if (saved) return JSON.parse(saved);
    return [{ id: '1', username: 'gtorres@tech-americas.com', passwordHash: '2130' }];
  });

  // Auth States
  const [activeTab, setActiveTab] = useState<TabType>('Analysis');
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('Database');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analytics States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<{ type: EntityType, name: string } | null>(null);
  const [isBannedAlert, setIsBannedAlert] = useState<string | null>(null);
  
  // Filtering States for Analysis (BASED ON DATABASE RECORDS)
  const [vendorForTechFilter, setVendorForTechFilter] = useState<string>('');
  const [selectedTechName, setSelectedTechName] = useState<string>('');
  const [selectedVendorName, setSelectedVendorName] = useState<string>('');

  const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = useState(false);

  // Persistence
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents)), [incidents]);
  useEffect(() => localStorage.setItem(BANNED_KEY, JSON.stringify(bannedTechs)), [bannedTechs]);
  useEffect(() => localStorage.setItem(USERS_KEY, JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem(MASTER_VENDORS_KEY, JSON.stringify(masterVendors)), [masterVendors]);
  useEffect(() => localStorage.setItem(MASTER_TECHS_KEY, JSON.stringify(masterTechnicians)), [masterTechnicians]);

  // DERIVED DATA FOR REPORTING (Master Lists)
  const masterVendorNames = useMemo(() => masterVendors.map(v => v.name).sort(), [masterVendors]);
  const masterTechMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    masterTechnicians.forEach(tech => {
      if (!map[tech.vendorName]) map[tech.vendorName] = [];
      map[tech.vendorName].push(tech.name);
    });
    return map;
  }, [masterTechnicians]);

  // DERIVED DATA FOR ANALYSIS (Actual Records in DB)
  const vendorsInDatabase = useMemo(() => {
    return Array.from(new Set(incidents.map(i => i.vendorName))).sort();
  }, [incidents]);

  const techsInDatabaseMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    incidents.forEach(inc => {
      if (!map[inc.vendorName]) map[inc.vendorName] = [];
      if (!map[inc.vendorName].includes(inc.technicianName)) {
        map[inc.vendorName].push(inc.technicianName);
      }
    });
    return map;
  }, [incidents]);

  // Sync Analysis Selectors when Database changes
  useEffect(() => {
    if (vendorsInDatabase.length > 0) {
      if (!selectedVendorName || !vendorsInDatabase.includes(selectedVendorName)) {
        setSelectedVendorName(vendorsInDatabase[0]);
      }
      if (!vendorForTechFilter || !vendorsInDatabase.includes(vendorForTechFilter)) {
        setVendorForTechFilter(vendorsInDatabase[0]);
      }
    }
  }, [vendorsInDatabase]);

  const techniciansFromRecords = useMemo(() => {
    if (!vendorForTechFilter) return [];
    return (techsInDatabaseMap[vendorForTechFilter] || []).sort();
  }, [techsInDatabaseMap, vendorForTechFilter]);

  useEffect(() => {
    if (techniciansFromRecords.length > 0) {
      if (!selectedTechName || !techniciansFromRecords.includes(selectedTechName)) {
        setSelectedTechName(techniciansFromRecords[0]);
      }
    } else {
      setSelectedTechName('');
    }
  }, [techniciansFromRecords]);

  const stats = useMemo(() => {
    const total = incidents.length;
    const abandons = incidents.filter(i => i.isAbandoned).length;
    const avgScore = total > 0 ? incidents.reduce((acc, i) => acc + i.overallScore, 0) / total : 0;
    const highPerf = incidents.filter(i => i.overallScore >= 4).length;
    return { 
      total, 
      abandons, 
      avgScore: avgScore.toFixed(1), 
      highPerfPercent: total > 0 ? ((highPerf / total) * 100).toFixed(0) : 0 
    };
  }, [incidents]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === loginForm.username && u.passwordHash === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginForm({ username: '', password: '' });
  };

  const handleBackup = () => {
    const backupData = {
      incidents,
      bannedTechs,
      users,
      masterVendors,
      masterTechnicians,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fieldops_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleQuickCopy = () => {
    const backupData = {
      incidents,
      bannedTechs,
      users,
      masterVendors,
      masterTechnicians,
      exportDate: new Date().toISOString()
    };
    navigator.clipboard.writeText(JSON.stringify(backupData)).then(() => {
      alert("✅ App data copied to clipboard!");
    });
  };

  const handlePasteRestore = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      if (data.incidents && data.bannedTechs && data.users) {
        if (confirm('This will OVERWRITE all current data with the clipboard content. Proceed?')) {
          setIncidents(data.incidents);
          setBannedTechs(data.bannedTechs);
          setUsers(data.users);
          if (data.masterVendors) setMasterVendors(data.masterVendors);
          if (data.masterTechnicians) setMasterTechnicians(data.masterTechnicians);
          alert('✅ Restore complete!');
        }
      } else {
        alert('Invalid data format.');
      }
    } catch (err) {
      alert('Failed to read from clipboard.');
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.incidents && data.bannedTechs && data.users) {
          if (confirm('Overwrite all current data?')) {
            setIncidents(data.incidents);
            setBannedTechs(data.bannedTechs);
            setUsers(data.users);
            if (data.masterVendors) setMasterVendors(data.masterVendors);
            if (data.masterTechnicians) setMasterTechnicians(data.masterTechnicians);
            alert('✅ Restore complete!');
          }
        }
      } catch (err) { alert('Error reading file.'); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const runAnalysis = async (type: EntityType, name: string) => {
    if (!name) return;
    setIsAnalyzing(true);
    setAnalysisReport(null);
    setSelectedEntity({ type, name });
    
    let banProjects: string[] = [];
    if (type === EntityType.TECHNICIAN) {
      banProjects = bannedTechs
        .filter(b => b.name.toLowerCase() === name.toLowerCase())
        .map(b => b.customerName);
    }
    
    const banContext = banProjects.length > 0 ? banProjects.join(', ') : null;
    setIsBannedAlert(banContext);

    const filtered = incidents.filter(i => type === EntityType.TECHNICIAN ? i.technicianName === name : i.vendorName === name);
    const result = await analyzePerformance(name, type, filtered, banContext);
    setAnalysisReport(result);
    setIsAnalyzing(false);
  };

  const handleManualAdd = (newInc: Incident) => {
    setIncidents(prev => [newInc, ...prev]);
    alert("✅ Record saved successfully.");
  };

  const handleAddBanned = (name: string, vendor: string, customer: string, reason: string) => {
    const newBanned: BannedTechnician = {
      id: Date.now().toString(),
      name,
      vendorName: vendor,
      customerName: customer,
      reason,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    setBannedTechs(prev => [...prev, newBanned]);
  };

  const handleAddMasterVendor = (name: string) => {
    if (masterVendors.some(v => v.name.toLowerCase() === name.toLowerCase())) {
      alert("Vendor already exists.");
      return;
    }
    setMasterVendors(prev => [...prev, { id: Date.now().toString(), name }]);
  };

  const handleAddMasterTech = (name: string, vendorName: string) => {
    if (masterTechnicians.some(t => t.name.toLowerCase() === name.toLowerCase() && t.vendorName === vendorName)) {
      alert("Technician already exists for this vendor.");
      return;
    }
    setMasterTechnicians(prev => [...prev, { id: Date.now().toString(), name, vendorName }]);
  };

  const handleAddUser = (user: string, pass: string) => {
    if (users.some(u => u.username === user)) {
      alert("Username already exists.");
      return;
    }
    const newUser: UserAccount = { id: Date.now().toString(), username: user, passwordHash: pass };
    setUsers(prev => [...prev, newUser]);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50/30 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm no-print">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">F</div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-800 leading-none">FieldOps Analyst</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Operational Intel</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Auto-Save Active</span>
          </div>
        </div>
        
        <nav className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl">
          <button onClick={() => setActiveTab('Analysis')} className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'Analysis' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Analysis</button>
          <button onClick={() => setActiveTab('Report')} className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'Report' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}>Report</button>
          <button onClick={() => setActiveTab('Admin')} className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center ${activeTab === 'Admin' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-800'}`}><svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>Admin</button>
        </nav>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'Analysis' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
              <StatsCard label="Total Sample" value={stats.total} color="blue" />
              <StatsCard label="Avg Score" value={stats.avgScore} color="orange" />
              <StatsCard label="High Performance" value={`${stats.highPerfPercent}%`} color="green" />
              <StatsCard label="Abandons" value={stats.abandons} color="red" />
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden report-container">
              <div className="flex items-center justify-between mb-8 no-print">
                <h2 className="text-xl font-black text-slate-800 flex items-center">
                  <span className="w-2 h-6 bg-indigo-600 rounded-full mr-3"></span>
                  Intelligent Auditing (Based on Database)
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-colors">
                  <span className="text-[10px] font-black text-indigo-500 uppercase block mb-4 tracking-widest">Audit Vendor From History</span>
                  <select value={selectedVendorName} onChange={(e) => setSelectedVendorName(e.target.value)} className="w-full rounded-xl border-slate-200 p-3 mb-3 text-sm font-bold bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                    {vendorsInDatabase.length > 0 ? (
                      vendorsInDatabase.map(v => <option key={v} value={v}>{v}</option>)
                    ) : (
                      <option disabled>No vendors in database</option>
                    )}
                  </select>
                  <button onClick={() => runAnalysis(EntityType.VENDOR, selectedVendorName)} disabled={isAnalyzing || !selectedVendorName} className="w-full py-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50 transition-all active:scale-[0.98]">Analyze Vendor</button>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 group hover:border-emerald-200 transition-colors">
                  <span className="text-[10px] font-black text-emerald-500 uppercase block mb-4 tracking-widest">Audit Technician From History</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <select value={vendorForTechFilter} onChange={(e) => setVendorForTechFilter(e.target.value)} className="w-full rounded-xl border-slate-200 p-3 text-sm font-bold bg-white">
                      {vendorsInDatabase.length > 0 ? (
                        vendorsInDatabase.map(v => <option key={v} value={v}>{v}</option>)
                      ) : (
                        <option disabled>No data</option>
                      )}
                    </select>
                    <select value={selectedTechName} onChange={(e) => setSelectedTechName(e.target.value)} className="w-full rounded-xl border-slate-200 p-3 text-sm font-bold bg-white">
                      {techniciansFromRecords.length > 0 ? (
                        techniciansFromRecords.map(t => <option key={t} value={t}>{t}</option>)
                      ) : (
                        <option disabled>No techs found</option>
                      )}
                    </select>
                  </div>
                  <button onClick={() => runAnalysis(EntityType.TECHNICIAN, selectedTechName)} disabled={isAnalyzing || !selectedTechName} className="w-full py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-all active:scale-[0.98]">Analyze Technician</button>
                </div>
              </div>

              {isAnalyzing && <div className="mt-12 py-12 flex flex-col items-center justify-center bg-indigo-50/30 rounded-3xl border border-dashed border-indigo-100 no-print"><div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div><p className="mt-4 text-indigo-900 font-black tracking-widest text-xs uppercase">Scanning performance patterns...</p></div>}
              {isBannedAlert && !isAnalyzing && <div className="mt-8 p-6 bg-rose-50 border-2 border-rose-200 rounded-2xl animate-in slide-in-from-top-4 duration-300 no-print"><div className="flex items-center space-x-3 text-rose-700"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg><div><h4 className="font-black uppercase tracking-widest text-sm">Technician Blacklisted</h4><p className="text-xs font-bold mt-1 uppercase">This individual is banned from: <span className="underline">{isBannedAlert}</span></p></div></div></div>}
              {analysisReport && !isAnalyzing && (
                <div className="mt-10 animate-in slide-in-from-bottom-8 duration-500 report-container">
                  <div className="flex items-center justify-between mb-4 no-print">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Generated Intel Report</h3>
                    <div className="flex space-x-2">
                       <button onClick={() => window.print()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center"><svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>Print / PDF</button>
                      <button onClick={() => {setAnalysisReport(null); setIsBannedAlert(null);}} className="px-4 py-2 text-slate-400 hover:text-rose-500 text-[10px] font-black uppercase tracking-widest">Clear</button>
                    </div>
                  </div>
                  <div className="bg-slate-900 text-slate-100 p-8 rounded-3xl font-mono text-sm leading-relaxed overflow-auto max-h-[600px] border-4 border-slate-800 shadow-2xl relative report-container">
                    <pre className="whitespace-pre-wrap selection:bg-indigo-500/40">{analysisReport}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Report' && (
          <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-12 duration-500 no-print">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-800">Report Incident</h2>
              <p className="text-slate-500 font-medium mt-2">Operational field service audit entry (Choose from Authorized Lists).</p>
            </div>
            <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-xl">
               <AddIncidentForm 
                onAdd={handleManualAdd} 
                isFullPage={true}
                masterVendors={masterVendorNames}
                masterTechs={masterTechMap}
                bannedTechs={bannedTechs.map(b => b.name.toLowerCase())}
              />
            </div>
          </div>
        )}

        {activeTab === 'Admin' && (
          <div className="space-y-6 animate-in fade-in duration-500 no-print">
            {!currentUser ? (
              <div className="max-w-md mx-auto py-20">
                <form onSubmit={handleLogin} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl space-y-6">
                  <div className="text-center mb-8"><div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-white mx-auto mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></div><h3 className="text-2xl font-black text-slate-800">Admin Hub</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Authorized Access</p></div>
                  {loginError && <p className="text-rose-500 text-xs font-black uppercase tracking-widest text-center bg-rose-50 py-2 rounded-xl">{loginError}</p>}
                  <div className="space-y-4">
                    <input type="text" placeholder="Username" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
                    <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
                  </div>
                  <button type="submit" className="w-full py-5 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 shadow-xl">Access Hub</button>
                </form>
              </div>
            ) : (
              <>
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">Administration Hub</h2>
                    <div className="flex space-x-4 mt-4">
                      <button onClick={() => setAdminSubTab('Database')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 ${adminSubTab === 'Database' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Records</button>
                      <button onClick={() => setAdminSubTab('ManageEntities')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 ${adminSubTab === 'ManageEntities' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-400'}`}>Entities</button>
                      <button onClick={() => setAdminSubTab('Banned')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 ${adminSubTab === 'Banned' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400'}`}>Blacklist</button>
                      <button onClick={() => setAdminSubTab('Users')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 ${adminSubTab === 'Users' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400'}`}>Users</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                      <button onClick={handleBackup} className="bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Backup</button>
                      <button onClick={handleQuickCopy} className="px-4 py-2 text-indigo-600 text-[10px] font-black uppercase">Share</button>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                      <label className="cursor-pointer bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Restore File<input type="file" accept=".json" onChange={handleRestore} className="hidden" ref={fileInputRef} /></label>
                      <button onClick={handlePasteRestore} className="px-4 py-2 text-emerald-600 text-[10px] font-black uppercase">Paste</button>
                    </div>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500 text-[10px] font-black uppercase px-4 py-2 border border-slate-100 rounded-xl">Exit</button>
                  </div>
                </div>

                {adminSubTab === 'Database' && (
                  <div className="space-y-6">
                    <div className="flex justify-end gap-3">
                      {incidents.length > 0 && (
                        <button onClick={() => isConfirmingDeleteAll ? (setIncidents([]), setIsConfirmingDeleteAll(false)) : setIsConfirmingDeleteAll(true)} className={`px-4 py-2 rounded-xl text-xs font-bold ${isConfirmingDeleteAll ? 'bg-red-600 text-white' : 'text-red-500 hover:bg-red-50'}`}>{isConfirmingDeleteAll ? 'Confirm Wipe?' : 'Clear All Data'}</button>
                      )}
                      <DataImporter onImport={(data) => setIncidents(prev => [...prev, ...data])} />
                    </div>
                    <DataTable incidents={incidents} onDelete={(id) => setIncidents(prev => prev.filter(i => i.id !== id))} />
                  </div>
                )}

                {adminSubTab === 'ManageEntities' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                      <div>
                        <h4 className="text-lg font-black text-slate-800 mb-4">Add Master Vendor (Reporting Source)</h4>
                        <form onSubmit={(e) => { e.preventDefault(); handleAddMasterVendor(e.currentTarget.vname.value); e.currentTarget.reset(); }} className="flex gap-2">
                          <input name="vname" required className="flex-1 p-3 bg-slate-50 rounded-xl text-sm font-bold border" placeholder="Vendor Name" />
                          <button type="submit" className="px-6 py-3 bg-slate-800 text-white rounded-xl text-xs font-black uppercase">Add</button>
                        </form>
                      </div>
                      <div className="h-[400px] overflow-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 font-black uppercase sticky top-0"><tr><th className="p-4">Vendor Name</th><th className="p-4 text-right">Action</th></tr></thead>
                          <tbody className="divide-y">{masterVendors.map(v => <tr key={v.id} className="hover:bg-slate-50"><td className="p-4 font-bold">{v.name}</td><td className="p-4 text-right"><button onClick={() => setMasterVendors(prev => prev.filter(x => x.id !== v.id))} className="text-rose-400">Del</button></td></tr>)}</tbody>
                        </table>
                      </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                      <div>
                        <h4 className="text-lg font-black text-slate-800 mb-4">Add Master Technician (Reporting Source)</h4>
                        <form onSubmit={(e) => { e.preventDefault(); handleAddMasterTech(e.currentTarget.tname.value, e.currentTarget.tvendor.value); e.currentTarget.reset(); }} className="space-y-3">
                          <input name="tname" required className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border" placeholder="Technician Name" />
                          <div className="flex gap-2">
                            <select name="tvendor" required className="flex-1 p-3 bg-slate-50 rounded-xl text-sm font-bold border">
                              {masterVendorNames.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                            <button type="submit" className="px-6 py-3 bg-amber-600 text-white rounded-xl text-xs font-black uppercase">Register Tech</button>
                          </div>
                        </form>
                      </div>
                      <div className="h-[400px] overflow-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 font-black uppercase sticky top-0"><tr><th className="p-4">Technician</th><th className="p-4">Vendor</th><th className="p-4 text-right">Action</th></tr></thead>
                          <tbody className="divide-y">{masterTechnicians.map(t => <tr key={t.id} className="hover:bg-slate-50"><td className="p-4 font-bold">{t.name}</td><td className="p-4 text-indigo-600 font-bold">{t.vendorName}</td><td className="p-4 text-right"><button onClick={() => setMasterTechnicians(prev => prev.filter(x => x.id !== t.id))} className="text-rose-400">Del</button></td></tr>)}</tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'Banned' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit">
                      <h4 className="text-lg font-black text-slate-800 mb-6">Ban Technician</h4>
                      <form onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; handleAddBanned(f.techname.value, f.vendorname.value, f.customername.value, f.reason.value); f.reset(); }} className="space-y-4">
                        <select name="vendorname" required className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border">
                          <option value="">Select Vendor</option>
                          {masterVendorNames.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <input name="techname" required className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border" placeholder="Tech Name" />
                        <input name="customername" required placeholder="Project / Customer" className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border" />
                        <textarea name="reason" required className="w-full h-24 p-3 bg-slate-50 rounded-xl text-sm font-medium border" placeholder="Reason..." />
                        <button type="submit" className="w-full py-4 bg-rose-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-rose-100">Add to Blacklist</button>
                      </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"><tr><th className="p-4">Technician</th><th className="p-4">Vendor</th><th className="p-4">Project</th><th className="p-4">Reason</th><th className="p-4 text-right">Action</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                          {bannedTechs.map(b => (
                            <tr key={b.id} className="hover:bg-rose-50/30 transition-colors"><td className="p-4 font-black text-slate-800">{b.name}</td><td className="p-4 text-indigo-600 font-bold">{b.vendorName}</td><td className="p-4 text-indigo-900 font-black tracking-tight">{b.customerName}</td><td className="p-4 text-slate-500 italic">{b.reason}</td><td className="p-4 text-right"><button onClick={() => setBannedTechs(prev => prev.filter(p => p.id !== b.id))} className="text-rose-400 hover:text-rose-600 p-2">Remove</button></td></tr>
                          ))}
                          {bannedTechs.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-slate-300 font-black uppercase">No banned technicians</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {adminSubTab === 'Users' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit">
                      <h4 className="text-lg font-black text-slate-800 mb-6">Create Authorized User</h4>
                      <form onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; handleAddUser(f.uname.value, f.upass.value); f.reset(); }} className="space-y-4">
                        <input name="uname" placeholder="Username" required className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-100" />
                        <input name="upass" type="password" placeholder="Password" required className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-100" />
                        <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest">Create User</button>
                      </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"><tr><th className="p-4">Username</th><th className="p-4">Account ID</th><th className="p-4 text-right">Action</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                          {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors"><td className="p-4 font-black text-slate-800">{u.username}</td><td className="p-4 font-mono text-slate-400 uppercase">{u.id}</td><td className="p-4 text-right">{u.username !== 'gtorres@tech-americas.com' && <button onClick={() => setUsers(prev => prev.filter(p => p.id !== u.id))} className="text-rose-400 hover:text-rose-600 p-2">Delete</button>}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 p-8 text-center mt-auto no-print">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">FieldOps Intelligence Hub • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;
