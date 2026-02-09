
import React from 'react';
import { Survey } from '../types';
import { 
  FileText, 
  BarChart2, 
  Play, 
  Trash2, 
  Calendar, 
  Users 
} from 'lucide-react';

interface SurveyListProps {
  surveys: Survey[];
  onTake: (survey: Survey) => void;
  onAnalyze: (survey: Survey) => void;
  onDelete: (id: string) => void;
  responseCountMap: Record<string, number>;
}

const SurveyList: React.FC<SurveyListProps> = ({ 
  surveys, 
  onTake, 
  onAnalyze, 
  onDelete,
  responseCountMap
}) => {
  if (surveys.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="text-indigo-600" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">No surveys found</h3>
        <p className="text-slate-500 mt-2">Get started by creating your first survey.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {surveys.map((survey) => (
        <div 
          key={survey.id} 
          className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
              <FileText size={20} />
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(survey.id);
              }}
              className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
              title="Delete Survey"
            >
              <Trash2 size={18} />
            </button>
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">
            {survey.title}
          </h3>
          <p className="text-slate-500 text-sm mb-6 line-clamp-2 h-10">
            {survey.description || 'No description provided.'}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(survey.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              {responseCountMap[survey.id] || 0} responses
            </div>
          </div>

          <div className="mt-auto flex gap-2">
            <button 
              onClick={() => onTake(survey)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 py-2 rounded-lg font-medium transition-colors"
            >
              <Play size={16} />
              Take
            </button>
            <button 
              onClick={() => onAnalyze(survey)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 py-2 rounded-lg font-medium transition-colors"
            >
              <BarChart2 size={16} />
              Analyze
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SurveyList;
