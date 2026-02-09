
import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface ConsentScreenProps {
  onAccept: () => void;
  onDecline: () => void;
  lang: 'en' | 'hi';
}

const ConsentScreen: React.FC<ConsentScreenProps> = ({ onAccept, onDecline, lang }) => {
  const content = {
    en: {
      title: "Participant Consent",
      body: "Your privacy is important to us. This survey collects demographic and response data for government statistical analysis. Participation is voluntary.",
      accept: "I Agree & Continue",
      decline: "Decline",
      rights: "You have the right to withdraw at any time."
    },
    hi: {
      title: "प्रतिभागी सहमति",
      body: "आपकी गोपनीयता हमारे लिए महत्वपूर्ण है। यह सर्वेक्षण सरकारी सांख्यिकीय विश्लेषण के लिए जनसांख्यिकीय और प्रतिक्रिया डेटा एकत्र करता है। भागीदारी स्वैच्छिक है।",
      accept: "मैं सहमत हूँ और आगे बढ़ें",
      decline: "अस्वीकार करें",
      rights: "आपको किसी भी समय वापस लेने का अधिकार है।"
    }
  };

  const t = content[lang];

  return (
    <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
      <div className="flex items-center gap-3 text-indigo-600 mb-6">
        <ShieldCheck size={32} />
        <h2 className="text-2xl font-bold text-slate-900">{t.title}</h2>
      </div>
      
      <div className="bg-slate-50 rounded-xl p-6 mb-8 text-slate-700 leading-relaxed">
        <p className="mb-4 font-medium">{t.body}</p>
        <div className="flex items-start gap-2 text-sm text-slate-500">
          <Info size={16} className="mt-1 flex-shrink-0" />
          <p>{t.rights}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={onDecline}
          className="flex-1 py-3 px-6 rounded-xl border border-slate-200 font-bold text-slate-500 hover:bg-slate-50 transition-colors"
        >
          {t.decline}
        </button>
        <button 
          onClick={onAccept}
          className="flex-1 py-3 px-6 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          {t.accept}
        </button>
      </div>
    </div>
  );
};

export default ConsentScreen;
