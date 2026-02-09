import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Sparkles,
  X,
  Type as TypeIcon,
  List,
  Loader2,
  Hash,
  Globe,
  Tag,
  GitMerge,
  ArrowRight,
} from "lucide-react";
import { Survey, Question, QuestionType } from "../types";
import { generateSmartSurvey } from "../services/geminiService";
import QuestionBank from "./QuestionBank";

interface SurveyCreatorProps {
  onSave: (survey: Survey) => void;
  onCancel: () => void;
}

const SurveyCreator: React.FC<SurveyCreatorProps> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewLang, setPreviewLang] = useState<"en" | "hi">("en");
  const [showBank, setShowBank] = useState(false);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      text: "",
      text_hi: "",
      required: true,
      options: type === QuestionType.MULTIPLE_CHOICE ? ["Option 1"] : undefined,
      options_hi: type === QuestionType.MULTIPLE_CHOICE ? ["विकल्प 1"] : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const generated = await generateSmartSurvey(aiPrompt);
      setTitle(generated.title);
      setDescription(generated.description);
      setQuestions(generated.questions);
      setAiPrompt("");
    } catch (error) {
      alert("Error generating survey. Please try a more descriptive prompt." + error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!title) return alert("Title is required");
    const newSurvey: Survey = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      questions,
      createdAt: Date.now(),
      language: "en",
    };
    onSave(newSurvey);
  };

  const getQuestionIndex = (id: string) => questions.findIndex((q) => q.id === id);

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-slate-400 font-bold hover:text-red-500 transition-colors cursor-pointer"
        >
          <X size={24} />
          Discard Draft
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => setShowBank(!showBank)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
          >
            {showBank ? "Hide Bank" : "Show Question Bank"}
          </button>
          <button
            onClick={() => setPreviewLang(previewLang === "en" ? "hi" : "en")}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
          >
            <Globe size={18} className="text-indigo-600" />
            Preview: {previewLang === "en" ? "ENGLISH" : "हिंदी"}
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer active:scale-95"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        <div className="flex-1">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 mb-12 overflow-hidden">
            <div className="p-12 bg-white">
              <input
                className="text-5xl font-black w-full outline-none placeholder:text-slate-200 mb-6 tracking-tighter text-slate-900 bg-white"
                placeholder="Survey Title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="w-full text-xl text-slate-500 outline-none resize-none placeholder:text-slate-200 h-24 font-medium bg-white"
                placeholder="Provide context for the enumerators and participants..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="bg-indigo-50/50 border-t border-indigo-100 p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Sparkles size={28} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-slate-900 text-xl font-black mb-1">AI Smart Builder</h3>
                <p className="text-slate-500 font-medium">
                  Describe your survey goal to auto-generate questions.
                </p>
              </div>
              <div className="w-full md:w-2/3 flex gap-2">
                <input
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                  placeholder="e.g., 'Sanitation survey for rural households'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
                />
                <button
                  disabled={isGenerating || !aiPrompt}
                  onClick={handleAiGenerate}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-100 active:scale-95"
                >
                  {isGenerating ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Plus size={20} />
                  )}
                  Execute
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {questions.length === 0 && (
              <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <Plus size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-400">
                  Add questions manually or use the Bank
                </h3>
              </div>
            )}

            {questions.map((q, i) => {
              // Questions available to depend on (must be before current question)
              const availableParents = questions.slice(0, i);
              const parentQ = q.logic?.dependsOn
                ? questions.find((pq) => pq.id === q.logic?.dependsOn)
                : null;

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm hover:shadow-md transition-all group border-l-4 border-l-transparent hover:border-l-indigo-500"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 pr-12">
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <span className="text-xs font-black text-indigo-600 tracking-[0.2em] uppercase bg-indigo-50 px-3 py-1 rounded-full">
                          Q{i + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {q.type}
                        </span>
                        {q.mospiCode && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                            <Tag size={10} /> {q.mospiCode}
                          </span>
                        )}

                        {/* Logic Badge */}
                        {parentQ && (
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 animate-in fade-in slide-in-from-left-2">
                            <GitMerge size={12} />
                            <span>
                              SHOW IF Q{getQuestionIndex(parentQ.id) + 1}{" "}
                              {q.logic?.operator === "equals" ? "==" : "!="} "{q.logic?.value}"
                            </span>
                          </div>
                        )}
                      </div>
                      <input
                        className="text-2xl font-bold w-full outline-none mb-4 text-slate-800 focus:text-indigo-600 transition-colors bg-white"
                        placeholder={
                          previewLang === "en" ? "Enter Question..." : "प्रश्न दर्ज करें..."
                        }
                        value={previewLang === "en" ? q.text : q.text_hi}
                        onChange={(e) => {
                          const field = previewLang === "en" ? "text" : "text_hi";
                          updateQuestion(q.id, { [field]: e.target.value });
                        }}
                      />
                    </div>
                    <button
                      onClick={() => setQuestions(questions.filter((item) => item.id !== q.id))}
                      className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all cursor-pointer"
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>

                  {q.type === QuestionType.MULTIPLE_CHOICE && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {(previewLang === "en" ? q.options : q.options_hi)?.map((opt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center bg-slate-50/50 rounded-2xl px-5 py-4 border border-slate-100 focus-within:bg-white focus-within:border-indigo-200 transition-all"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-200 mr-4" />
                          <input
                            className="bg-transparent outline-none flex-1 font-bold text-slate-700"
                            value={opt}
                            onChange={(e) => {
                              const field = previewLang === "en" ? "options" : "options_hi";
                              const newOpts = [...(q[field] || [])];
                              newOpts[idx] = e.target.value;
                              updateQuestion(q.id, { [field]: newOpts });
                            }}
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const field = previewLang === "en" ? "options" : "options_hi";
                          const newOpts = [
                            ...(q[field] || []),
                            previewLang === "en" ? "New Option" : "नया विकल्प",
                          ];
                          updateQuestion(q.id, { [field]: newOpts });
                        }}
                        className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl py-4 text-slate-400 font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all cursor-pointer bg-white"
                      >
                        <Plus size={18} /> Add Option
                      </button>
                    </div>
                  )}

                  {/* Logic Builder Section */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                      <GitMerge size={16} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Logic & Conditions
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-medium text-slate-600">
                        Show this question if
                      </span>
                      <select
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                        value={q.logic?.dependsOn || ""}
                        onChange={(e) => {
                          if (e.target.value === "") {
                            updateQuestion(q.id, { logic: undefined });
                          } else {
                            updateQuestion(q.id, {
                              logic: {
                                dependsOn: e.target.value,
                                operator: "equals",
                                value: "",
                              },
                            });
                          }
                        }}
                      >
                        <option value="">-- Always Show --</option>
                        {availableParents.map((pq, idx) => (
                          <option key={pq.id} value={pq.id}>
                            Q{idx + 1}: {pq.text.substring(0, 30)}...
                          </option>
                        ))}
                      </select>

                      {q.logic && (
                        <>
                          <select
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                            value={q.logic.operator}
                            onChange={(e) =>
                              updateQuestion(q.id, {
                                logic: { ...q.logic!, operator: e.target.value as any },
                              })
                            }
                          >
                            <option value="equals">Equals (=)</option>
                            <option value="not_equals">Does Not Equal (≠)</option>
                          </select>

                          {(() => {
                            const parent = questions.find((p) => p.id === q.logic?.dependsOn);
                            if (parent?.type === QuestionType.MULTIPLE_CHOICE && parent.options) {
                              return (
                                <select
                                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                                  value={q.logic.value}
                                  onChange={(e) =>
                                    updateQuestion(q.id, {
                                      logic: { ...q.logic!, value: e.target.value },
                                    })
                                  }
                                >
                                  <option value="">-- Select Value --</option>
                                  {parent.options.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              );
                            } else {
                              return (
                                <input
                                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 w-32"
                                  placeholder="Value..."
                                  value={q.logic.value}
                                  onChange={(e) =>
                                    updateQuestion(q.id, {
                                      logic: { ...q.logic!, value: e.target.value },
                                    })
                                  }
                                />
                              );
                            }
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showBank && (
          <div className="w-80 flex-shrink-0 animate-in slide-in-from-right duration-300 sticky top-24">
            <QuestionBank onAdd={(q) => setQuestions([...questions, q])} />
          </div>
        )}
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] p-3 shadow-2xl flex gap-2 z-50 border border-white/10">
        {[
          { type: QuestionType.TEXT, icon: <TypeIcon size={20} />, label: "Text" },
          { type: QuestionType.MULTIPLE_CHOICE, icon: <List size={20} />, label: "Choices" },
          { type: QuestionType.NUMBER, icon: <Hash size={20} />, label: "Number" },
          { type: QuestionType.DATE, icon: <Calendar size={20} />, label: "Date" },
        ].map((btn) => (
          <button
            key={btn.type}
            onClick={() => addQuestion(btn.type)}
            className="group px-5 py-4 hover:bg-white/10 text-white rounded-[1.8rem] flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-90"
          >
            <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
              {btn.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">
              {btn.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Added icon import
import { Calendar } from "lucide-react";

export default SurveyCreator;
