
import React, { useState, useEffect, useRef } from 'react';
import { Survey, QuestionType, SurveyResponse, Paradata, Question } from '../types';
import { CheckCircle, X, ChevronRight, Star, Globe, Mic, Volume2, MapPin, ShieldCheck, Loader2 } from 'lucide-react';
import ConsentScreen from './ConsentScreen';
import { autoCodeTextResponse } from '../services/geminiService';

interface SurveyResponseViewProps {
  survey: Survey;
  onSubmit: (response: SurveyResponse) => void;
  onCancel: () => void;
}

const SurveyResponseView: React.FC<SurveyResponseViewProps> = ({ survey, onSubmit, onCancel }) => {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [consented, setConsented] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [location, setLocation] = useState<{latitude: number; longitude: number; accuracy: number} | undefined>(undefined);
  const [isListening, setIsListening] = useState<string | null>(null);
  const [autoCodedData, setAutoCodedData] = useState<Record<string, string>>({});
  
  // Use state for startTime to ensure it persists correctly across renders and transitions
  const [surveyStartTime, setSurveyStartTime] = useState<number>(0);
  
  const questionStartTimes = useRef<Record<string, number>>({});
  const [questionTimings, setQuestionTimings] = useState<Record<string, number>>({});

  useEffect(() => {
    if (consented) {
      // Capture geolocation if permitted
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            });
          },
          (err) => console.log("GPS denied or unavailable"),
          { enableHighAccuracy: true }
        );
      }
    }
  }, [consented]);

  const handleConsentAccept = () => {
    setSurveyStartTime(Date.now());
    setConsented(true);
  };

  const handleInputChange = (questionId: string, value: any) => {
    const now = Date.now();
    const prevTime = questionStartTimes.current[questionId] || now;
    const duration = (now - prevTime) / 1000;
    
    setQuestionTimings(prev => ({
      ...prev,
      [questionId]: (prev[questionId] || 0) + duration
    }));
    questionStartTimes.current[questionId] = now;
    
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleBlur = async (q: Question, value: string) => {
    if (q.type === QuestionType.TEXT && value.length > 3) {
      // Simulate/Run Auto-coding
      const coded = await autoCodeTextResponse(q.text, value);
      if (coded && coded.code) {
        setAutoCodedData(prev => ({ ...prev, [q.id]: `${coded.code} - ${coded.category}` }));
      }
    }
  };

  const speakQuestion = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const startListening = (qId: string) => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice input not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    
    setIsListening(qId);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleInputChange(qId, transcript);
      setIsListening(null);
    };

    recognition.onerror = () => setIsListening(null);
    recognition.onend = () => setIsListening(null);
  };

  const isQuestionVisible = (q: Question) => {
    if (!q.logic) return true;
    const { dependsOn, operator, value } = q.logic;
    const dependentValue = answers[dependsOn];
    
    // Safety check if dependent question hasn't been answered yet
    // Strict undefined check allows 0 or empty string as valid answers
    if (dependentValue === undefined || dependentValue === null) return false;

    // Normalize for comparison (handles "5" vs 5 or "true" vs true)
    const normDep = String(dependentValue).trim().toLowerCase();
    const normVal = String(value).trim().toLowerCase();

    if (operator === 'equals') return normDep === normVal;
    if (operator === 'not_equals') return normDep !== normVal;
    if (operator === 'greater_than') return Number(dependentValue) > Number(value);
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const visibleQuestions = survey.questions.filter(isQuestionVisible);
    const missing = visibleQuestions.filter(q => q.required && !answers[q.id]);
    
    if (missing.length > 0) {
      alert(lang === 'en' ? "Please fill all required fields." : "कृपया सभी आवश्यक फ़ील्ड भरें।");
      return;
    }

    const endTime = Date.now();
    const totalDuration = (endTime - surveyStartTime) / 1000;

    const paradata: Paradata = {
      totalTime: totalDuration > 0 ? totalDuration : 1, // Ensure non-zero
      questionTimings,
      deviceInfo: navigator.userAgent,
      location,
      voiceInputUsed: Object.keys(answers).length > 0 
    };

    const response: SurveyResponse = {
      id: Math.random().toString(36).substr(2, 9),
      surveyId: survey.id,
      answers,
      paradata,
      submittedAt: endTime,
      autoCodedTags: autoCodedData
    };
    
    setSubmitted(true);
    setTimeout(() => onSubmit(response), 2000);
  };

  if (!consented) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center mb-4">
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            <button onClick={() => setLang('en')} className={`px-4 py-1.5 rounded-md text-sm font-bold ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>English</button>
            <button onClick={() => setLang('hi')} className={`px-4 py-1.5 rounded-md text-sm font-bold ${lang === 'hi' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>हिंदी</button>
          </div>
        </div>
        <ConsentScreen lang={lang} onAccept={handleConsentAccept} onDecline={onCancel} />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-50 text-green-500 rounded-full mb-6 animate-pulse">
          <CheckCircle size={64} />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-4">{lang === 'en' ? 'Submission Recorded' : 'सबमिशन दर्ज किया गया'}</h2>
        <p className="text-slate-500 text-xl">{lang === 'en' ? 'Synced securely with National Registry.' : 'राष्ट्रीय रजिस्ट्री के साथ सुरक्षित रूप से सिंक किया गया।'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="sticky top-20 z-10 flex justify-between items-center mb-4 px-4">
         <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200">
             {location ? <MapPin size={14} className="text-emerald-500" /> : <Loader2 size={14} className="animate-spin text-slate-400" />}
             <span className="text-xs font-bold text-slate-600">{location ? 'GPS Locked' : 'Locating...'}</span>
         </div>
        <button 
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="flex items-center gap-2 bg-white/80 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 shadow-sm hover:bg-white"
        >
          <Globe size={14} />
          {lang === 'en' ? 'HINDI' : 'ENGLISH'}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 via-white to-green-400"></div>
        <h1 className="text-3xl font-black text-slate-900 mb-3">{lang === 'en' ? survey.title : survey.title}</h1>
        <p className="text-slate-600 text-lg leading-relaxed">{survey.description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {survey.questions.map((question) => {
          if (!isQuestionVisible(question)) return null;
          const qText = lang === 'en' ? question.text : (question.text_hi || question.text);

          return (
            <div key={question.id} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:border-indigo-100 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-start mb-6">
                <label className="block text-xl font-bold text-slate-800 flex-1">
                    {qText}
                    {question.required && <span className="text-red-500 ml-1 font-black">*</span>}
                    {question.logic && <span className="ml-2 text-xs font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded">CONDITIONAL</span>}
                </label>
                <div className="flex gap-2">
                    <button type="button" onClick={() => speakQuestion(qText)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"><Volume2 size={20} /></button>
                </div>
              </div>

              {/* Mock DPI Integration for Demographic fields */}
              {(question.text.toLowerCase().includes('name') || question.text.toLowerCase().includes('age')) && (
                 <div className="mb-4 bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-700 text-sm font-bold">
                        <ShieldCheck size={16} /> DigiLocker Verification Available
                    </div>
                    <button type="button" className="text-xs bg-white border border-blue-200 px-3 py-1 rounded-lg text-blue-600 font-bold hover:bg-blue-600 hover:text-white transition-colors">Verify eKYC</button>
                 </div>
              )}

              {question.type === QuestionType.TEXT && (
                <div className="relative">
                    <input 
                    type="text"
                    className="w-full border-2 border-slate-100 rounded-xl p-4 pr-12 outline-none focus:border-indigo-500 transition-all text-lg"
                    placeholder={lang === 'en' ? "Enter answer..." : "उत्तर दर्ज करें..."}
                    value={answers[question.id] || ''}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    onBlur={(e) => handleBlur(question, e.target.value)}
                    />
                    <button 
                        type="button" 
                        onClick={() => startListening(question.id)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full ${isListening === question.id ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-indigo-600'}`}
                    >
                        <Mic size={20} />
                    </button>
                    {autoCodedData[question.id] && (
                        <div className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded border border-emerald-100">
                            Auto-coded: {autoCodedData[question.id]}
                        </div>
                    )}
                </div>
              )}

              {question.type === QuestionType.NUMBER && (
                <input 
                  type="number"
                  className="w-full border-2 border-slate-100 rounded-xl p-4 outline-none focus:border-indigo-500 transition-all text-lg"
                  placeholder="0"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                />
              )}

              {question.type === QuestionType.DATE && (
                <input 
                  type="date"
                  className="w-full border-2 border-slate-100 rounded-xl p-4 outline-none focus:border-indigo-500 transition-all text-lg"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                />
              )}

              {question.type === QuestionType.MULTIPLE_CHOICE && (
                <div className="grid grid-cols-1 gap-3">
                  {(lang === 'en' ? question.options : question.options_hi || question.options)?.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleInputChange(question.id, (question.options || [])[i])}
                      className={`flex items-center p-4 rounded-xl border-2 text-left font-bold transition-all ${answers[question.id] === (question.options || [])[i] ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 hover:border-slate-200 text-slate-600'}`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${answers[question.id] === (question.options || [])[i] ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                        {answers[question.id] === (question.options || [])[i] && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {question.type === QuestionType.RATING && (
                <div className="flex justify-between items-center max-w-sm">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleInputChange(question.id, s)}
                      className={`transition-all hover:scale-125 ${answers[question.id] >= s ? 'text-yellow-400' : 'text-slate-100'}`}
                    >
                      <Star size={48} fill={answers[question.id] >= s ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="flex flex-col items-center gap-6 py-12">
          <button 
            type="submit"
            className="w-full max-w-md bg-indigo-600 text-white py-5 rounded-2xl text-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <ShieldCheck size={28} />
            {lang === 'en' ? 'Submit Securely' : 'सुरक्षित रूप से सबमिट करें'}
          </button>
          
          <div className="flex gap-4">
            <button type="button" className="text-slate-400 font-bold hover:text-slate-600">IVR Backup</button>
            <span className="text-slate-200">|</span>
            <button type="button" className="text-slate-400 font-bold hover:text-slate-600">WhatsApp Mode</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SurveyResponseView;
