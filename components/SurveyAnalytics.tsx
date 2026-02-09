
import React, { useState, useMemo } from 'react';
import { Survey, SurveyResponse, QuestionType } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  ArrowLeft, LayoutDashboard, Sparkles, Loader2, 
  AlertTriangle, Clock, ShieldAlert, FileSpreadsheet,
  RefreshCcw, Smartphone, Zap, ClipboardCheck, Map
} from 'lucide-react';
import { analyzeSurveyParadata } from '../services/geminiService';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SurveyAnalyticsProps {
  survey: Survey;
  responses: SurveyResponse[];
  onBack: () => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const SurveyAnalytics: React.FC<SurveyAnalyticsProps> = ({ survey, responses, onBack }) => {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'PARADATA' | 'AI'>('METRICS');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const stats = useMemo(() => {
    if (!responses.length) return null;
    const avgTime = responses.reduce((acc, r) => acc + (r.paradata?.totalTime || 0), 0) / responses.length;
    const suspicious = responses.filter(r => (r.paradata?.totalTime || 0) < 5 || Object.keys(r.answers).length < survey.questions.length * 0.3);
    
    return {
      total: responses.length,
      avgTime: avgTime.toFixed(1),
      suspicious: suspicious.length
    };
  }, [responses, survey]);

  const handleAiAudit = async () => {
    if (isAnalyzing) return;
    if (responses.length === 0) {
      alert("No responses available to analyze.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const report = await analyzeSurveyParadata(responses);
      setAiReport(report);
    } catch (e) {
      alert("AI Audit failed. Please check your API configuration.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportToCSV = () => {
    if (responses.length === 0) return;
    
    const headers = ["Response ID", "Submitted At", "Total Time (s)", "Latitude", "Longitude", ...survey.questions.map(q => q.text)];
    const rows = responses.map(r => [
      r.id,
      new Date(r.submittedAt).toLocaleString(),
      r.paradata.totalTime,
      r.paradata.location?.latitude || '',
      r.paradata.location?.longitude || '',
      ...survey.questions.map(q => r.answers[q.id] || '')
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${survey.title.replace(/\s+/g, '_')}_Responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm hover:border-indigo-200 transition-all cursor-pointer group">
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Analytics</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{survey.title}</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Registry Code: {survey.id.split('-')[0]}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            Export Data
          </button>
          
          <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1 shadow-inner border border-slate-100">
            {['METRICS', 'PARADATA', 'AI'].map((t) => (
              <button 
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-6 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest cursor-pointer ${activeTab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'METRICS' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center gap-3 text-indigo-600 mb-6">
                <div className="bg-indigo-50 p-2.5 rounded-xl"><LayoutDashboard size={20} /></div>
                <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Total Sample</span>
              </div>
              <p className="text-6xl font-black text-slate-900 tracking-tighter">{stats?.total || 0}</p>
            </div>
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center gap-3 text-emerald-600 mb-6">
                <div className="bg-emerald-50 p-2.5 rounded-xl"><Clock size={20} /></div>
                <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Avg. Duration</span>
              </div>
              <p className="text-6xl font-black text-slate-900 tracking-tighter">{stats?.avgTime || 0}<span className="text-2xl ml-1 text-slate-300">s</span></p>
            </div>
            <div className="bg-red-50/30 rounded-[2.5rem] p-10 border border-red-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="flex items-center gap-3 text-red-600 mb-6">
                <div className="bg-red-100/50 p-2.5 rounded-xl"><AlertTriangle size={20} /></div>
                <span className="font-black text-[10px] uppercase tracking-widest text-red-400">Anomalies</span>
              </div>
              <p className="text-6xl font-black text-red-600 tracking-tighter">{stats?.suspicious || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {survey.questions.map(q => {
              if (q.type === QuestionType.TEXT) return null;
              return (
                <div key={q.id} className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm hover:border-indigo-100 transition-colors h-[500px] flex flex-col">
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="text-xl font-black text-slate-800 leading-tight max-w-[80%]">{q.text}</h3>
                    <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-100">{q.type}</span>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      {q.type === QuestionType.MULTIPLE_CHOICE ? (
                        <PieChart>
                          <Pie
                            data={q.options?.map(opt => ({
                              name: opt,
                              value: responses.filter(r => r.answers[q.id] === opt).length
                            }))}
                            innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value" stroke="none"
                          >
                            {q.options?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px' }} />
                        </PieChart>
                      ) : (
                        <BarChart data={[1, 2, 3, 4, 5].map(v => ({
                          name: `${v}★`,
                          count: responses.filter(r => r.answers[q.id] === v).length
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="count" fill="#6366f1" radius={[12, 12, 0, 0]} barSize={50} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'PARADATA' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-2xl font-black text-slate-900">Enumeration Logs</h3>
               <div className="flex items-center gap-2">
                 <ShieldAlert size={16} className="text-emerald-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integrity Verified</span>
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="p-10">Response UID</th>
                    <th className="p-10">Time (Sec)</th>
                    <th className="p-10">Location</th>
                    <th className="p-10">Platform</th>
                    <th className="p-10">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium bg-white">
                  {responses.map(r => (
                    <tr key={r.id} className="hover:bg-indigo-50/20 transition-colors group">
                      <td className="p-10 font-black font-mono text-xs text-slate-400 group-hover:text-indigo-600 transition-colors">#{r.id.toUpperCase()}</td>
                      <td className="p-10 font-bold text-slate-900">{r.paradata.totalTime.toFixed(1)}s</td>
                      <td className="p-10 font-bold text-slate-900">
                        {r.paradata.location ? (
                            <div className="flex items-center gap-1 text-emerald-600 text-xs">
                                <Map size={14} />
                                {r.paradata.location.latitude.toFixed(4)}, {r.paradata.location.longitude.toFixed(4)}
                            </div>
                        ) : (
                            <span className="text-slate-300 text-xs">No GPS</span>
                        )}
                      </td>
                      <td className="p-10 text-slate-500 text-xs"><Smartphone size={14} className="inline mr-2 opacity-50" /> {r.paradata.deviceInfo}</td>
                      <td className="p-10">
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${r.paradata.totalTime < 5 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {r.paradata.totalTime < 5 ? 'Flagged' : 'Clean'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'AI' && (
        <div className="max-w-4xl mx-auto">
          {!aiReport ? (
            <div className="bg-white rounded-[3rem] p-20 text-center shadow-2xl border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
               <div className="relative z-10">
                <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-indigo-200 animate-pulse">
                   <Zap className="text-white fill-white" size={48} />
                </div>
                <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">Smart Integrity Audit</h2>
                <p className="text-slate-500 text-xl mb-12 max-w-xl mx-auto font-medium leading-relaxed">
                  Analyze response patterns, identify bias, and verify data integrity using Gemini Pro.
                </p>
                <div className="flex flex-col items-center gap-4">
                  <button 
                    onClick={handleAiAudit}
                    disabled={isAnalyzing}
                    className="group bg-indigo-600 text-white px-12 py-6 rounded-[2rem] text-2xl font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-200 flex items-center gap-4 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="animate-spin" size={28} />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />
                        Execute Analysis
                      </>
                    )}
                  </button>
                  {responses.length === 0 && (
                    <p className="text-red-500 font-bold text-sm flex items-center gap-2">
                      <AlertTriangle size={16} /> No response data found to analyze.
                    </p>
                  )}
                </div>
               </div>
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] border border-slate-200 p-12 md:p-16 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
               <div className="absolute top-0 right-0 p-8">
                 <button 
                  onClick={() => setAiReport(null)} 
                  className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer shadow-sm"
                  title="Rerun Audit"
                 >
                    <RefreshCcw size={20} />
                 </button>
               </div>
               
               <div className="flex items-center gap-6 text-indigo-600 mb-12">
                 <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center border border-indigo-100">
                    <ClipboardCheck size={32} />
                 </div>
                 <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Audit Report</h2>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-1 block">Certified Data Verification</span>
                 </div>
               </div>

               <div className="bg-white border-2 border-slate-50 p-12 rounded-[2.5rem] shadow-inner">
                  <div className="markdown-body prose prose-slate max-w-none text-slate-900 font-medium !bg-white">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {aiReport}
                    </ReactMarkdown>
                  </div>
               </div>

               <div className="mt-12 pt-12 border-t border-dashed border-slate-100 text-center">
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">End of Official Audit Result</div>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SurveyAnalytics;
