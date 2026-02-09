
import React, { useState, useEffect } from 'react';
import { 
  Plus, ClipboardList, Database, RefreshCcw, Loader2, AlertCircle, ExternalLink, Settings, Terminal, Shield
} from 'lucide-react';
import { Survey, SurveyResponse } from './types';
import SurveyCreator from './components/SurveyCreator';
import SurveyList from './components/SurveyList';
import SurveyResponseView from './components/SurveyResponseView';
import SurveyAnalytics from './components/SurveyAnalytics';
import { supabase } from './lib/supabaseClient';

type View = 'DASHBOARD' | 'CREATE' | 'TAKE' | 'ANALYTICS';

const App: React.FC = () => {
  const [view, setView] = useState<View>('DASHBOARD');
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data: surveysData } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: responsesData } = await supabase
        .from('responses')
        .select('*, paradata(*)');

      if (surveysData) {
        setSurveys(surveysData.map(s => ({
          ...s,
          createdAt: new Date(s.created_at).getTime(),
          language: 'en'
        })));
      }
      
      if (responsesData) {
        setResponses(responsesData.map(r => ({
          id: r.id,
          surveyId: r.survey_id,
          answers: r.answers,
          submittedAt: new Date(r.submitted_at).getTime(),
          paradata: r.paradata?.[0] ? {
            totalTime: r.paradata[0].total_time_seconds,
            questionTimings: r.paradata[0].question_timings,
            deviceInfo: r.paradata[0].device_info?.userAgent || 'Unknown',
            location: r.paradata[0].latitude ? {
                latitude: r.paradata[0].latitude,
                longitude: r.paradata[0].longitude,
                accuracy: 0
            } : undefined
          } : { totalTime: 0, questionTimings: {}, deviceInfo: 'Unknown' }
        })));
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (supabase) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, []);

  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-[2.5rem] border border-slate-200 p-12 shadow-2xl">
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-8 border border-amber-100">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">SurveySaksham Configuration</h1>
          <p className="text-slate-500 text-lg font-medium mb-8 leading-relaxed">
            Please configure your Supabase credentials to enable the national statistics backend.
          </p>
          <button 
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              Retry Connection <RefreshCcw size={18} />
          </button>
        </div>
      </div>
    );
  }

  const handleCreateSurvey = async (newSurvey: Survey) => {
    const { data, error } = await supabase
      .from('surveys')
      .insert([{
        title: newSurvey.title,
        description: newSurvey.description,
        questions: newSurvey.questions,
        is_published: true
      }])
      .select();

    if (!error && data) {
      await fetchData();
      setView('DASHBOARD');
    } else {
      alert("Error saving survey: " + error?.message);
    }
  };

  const handleDeleteSurvey = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this survey? All collected data will be lost.")) return;
    
    setIsLoading(true);
    try {
      // 1. Deep clean: Delete paradata associated with responses of this survey
      // This is necessary if ON DELETE CASCADE is missing from the database schema for responses->paradata
      const { data: surveyResponses } = await supabase
        .from('responses')
        .select('id')
        .eq('survey_id', id);
        
      if (surveyResponses && surveyResponses.length > 0) {
        const responseIds = surveyResponses.map(r => r.id);
        await supabase.from('paradata').delete().in('response_id', responseIds);
      }

      // 2. Delete responses (Manual cascade for Survey->Responses)
      await supabase.from('responses').delete().eq('survey_id', id);

      // 3. Delete survey
      const { error } = await supabase.from('surveys').delete().eq('id', id);
      
      if (error) throw error;
      
      // Refresh data to update UI
      await fetchData();
    } catch (err: any) {
      console.error("Delete error:", err);
      alert("Error deleting survey: " + (err.message || "Unknown error"));
      setIsLoading(false); // Reset loading state if error occurs
    }
  };

  const handleAddResponse = async (response: SurveyResponse) => {
    try {
      // 1. Insert Response
      const { data: rData, error: rError } = await supabase
        .from('responses')
        .insert([{
          survey_id: response.surveyId,
          answers: response.answers
        }])
        .select();

      if (rError || !rData) {
        throw new Error(rError?.message || "Failed to save response");
      }

      const responseId = rData[0].id;

      // 2. Insert Paradata (Explicitly handle nulls and ensure columns exist in DB)
      // Note: Ensure your 'paradata' table has 'latitude' and 'longitude' columns
      const { error: pError } = await supabase.from('paradata').insert([{
        response_id: responseId,
        total_time_seconds: response.paradata.totalTime,
        question_timings: response.paradata.questionTimings,
        device_info: { userAgent: response.paradata.deviceInfo },
        latitude: response.paradata.location?.latitude ?? null,
        longitude: response.paradata.location?.longitude ?? null
      }]);
      
      if (pError) {
        console.error("Paradata insert failed. Check if latitude/longitude columns exist in DB.", pError);
        // We don't block the flow for paradata failure, but we log it
      }
      
      await fetchData();
      setView('DASHBOARD');
      setActiveSurvey(null);
    } catch (err: any) {
      console.error("Submission error:", err);
      alert("Failed to submit survey: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100">
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-1 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('DASHBOARD')}>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 group-hover:rotate-6 transition-all duration-300">
              <Shield size={24} strokeWidth={3} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 tracking-tighter">SURVEY<span className="text-indigo-600">SAKSHAM</span></span>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">MoSPI</span>
                 <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Govt of India</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                DPI Gateway: Connected
             </div>
             <button onClick={fetchData} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
             </button>
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden border-2 border-white shadow-md cursor-pointer hover:ring-2 ring-indigo-500 transition-all">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=admin`} alt="User" />
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        {isLoading && view === 'DASHBOARD' ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
            <p className="text-slate-500 font-bold animate-pulse">Synchronizing with National Database...</p>
          </div>
        ) : (
          <>
            {view === 'DASHBOARD' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-2">
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">Command Center</h1>
                    <p className="text-slate-500 font-bold text-xl max-w-xl leading-relaxed">Official portal for national-scale statistical acquisition.</p>
                  </div>
                  <button 
                    onClick={() => setView('CREATE')}
                    className="group bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-3 relative overflow-hidden"
                  >
                    <Plus size={24} strokeWidth={4} />
                    New Instrument
                  </button>
                </div>
                
                <SurveyList 
                  surveys={surveys} 
                  onTake={(s) => { setActiveSurvey(s); setView('TAKE'); }}
                  onAnalyze={(s) => { setActiveSurvey(s); setView('ANALYTICS'); }}
                  onDelete={handleDeleteSurvey}
                  responseCountMap={responses.reduce((acc, r) => {
                    acc[r.surveyId] = (acc[r.surveyId] || 0) + 1;
                    return acc;
                  }, {} as any)}
                />
              </div>
            )}

            {view === 'CREATE' && <SurveyCreator onSave={handleCreateSurvey} onCancel={() => setView('DASHBOARD')} />}
            {view === 'TAKE' && activeSurvey && <SurveyResponseView survey={activeSurvey} onSubmit={handleAddResponse} onCancel={() => setView('DASHBOARD')} />}
            {view === 'ANALYTICS' && activeSurvey && (
              <SurveyAnalytics 
                survey={activeSurvey} 
                responses={responses.filter(r => r.surveyId === activeSurvey.id)} 
                onBack={() => setView('DASHBOARD')} 
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
