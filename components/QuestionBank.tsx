
import React from 'react';
import { Plus, Book, Tag } from 'lucide-react';
import { Question, QuestionType } from '../types';

interface QuestionBankProps {
  onAdd: (q: Question) => void;
}

const STANDARD_QUESTIONS: Partial<Question>[] = [
  {
    type: QuestionType.NUMBER,
    text: "Total number of members in the household?",
    text_hi: "घर में सदस्यों की कुल संख्या?",
    mospiCode: "H-SIZE-01",
    required: true
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    text: "Main source of drinking water?",
    text_hi: "पेयजल का मुख्य स्रोत?",
    options: ["Tap water", "Handpump/Tube well", "Well", "Tank/Pond", "Other"],
    options_hi: ["नल का पानी", "हैंडपंप/ट्यूबवेल", "कुआँ", "टैंक/तालाब", "अन्य"],
    mospiCode: "H-WATER-05",
    required: true
  },
  {
    type: QuestionType.TEXT,
    text: "Primary occupation of the head of household?",
    text_hi: "परिवार के मुखिया का मुख्य व्यवसाय?",
    mospiCode: "NCO-2015",
    required: true
  },
  {
    type: QuestionType.RATING,
    text: "Satisfaction with government health services?",
    text_hi: "सरकारी स्वास्थ्य सेवाओं से संतुष्टि?",
    mospiCode: "GOV-SAT-01",
    required: true
  },
  {
    type: QuestionType.DATE,
    text: "Date of birth of the youngest child?",
    text_hi: "सबसे छोटे बच्चे की जन्म तिथि?",
    mospiCode: "DEMO-DOB-03",
    required: true
  }
];

const QuestionBank: React.FC<QuestionBankProps> = ({ onAdd }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 h-full shadow-sm overflow-y-auto max-h-[600px]">
      <div className="flex items-center gap-3 mb-6 text-slate-800">
        <Book size={20} className="text-indigo-600" />
        <h3 className="font-bold text-lg">MoSPI Standard Bank</h3>
      </div>
      
      <div className="space-y-3">
        {STANDARD_QUESTIONS.map((q, i) => (
          <div 
            key={i} 
            className="group p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer relative"
            onClick={() => onAdd({ ...q, id: Math.random().toString(36).substr(2, 9) } as Question)}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-slate-700 text-sm mb-1 line-clamp-2">{q.text}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">{q.type}</span>
                  {q.mospiCode && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-indigo-600">
                      <Tag size={10} /> {q.mospiCode}
                    </span>
                  )}
                </div>
              </div>
              <button className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-indigo-50 rounded-2xl text-xs text-indigo-700 font-medium border border-indigo-100">
        <p>Questions in this bank align with National Statistical Office (NSO) standards for interoperability.</p>
      </div>
    </div>
  );
};

export default QuestionBank;
