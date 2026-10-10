import React, { useState } from 'react';
import { ViewTab } from '../../types';
import { useStudent } from '../../context/StudentContext';
import {
  BookOpen,
  ArrowLeft,
  Calculator,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Lightbulb,
  Plus,
} from 'lucide-react';

interface AcademicSubjectViewProps {
  onNavigate: (tab: ViewTab) => void;
  subjectKey: 'accounting' | 'finance' | 'economics' | 'business_math' | 'cost_accounting' | 'management_accounting' | 'statistics';
  titleBn: string;
  titleEn: string;
  badge: string;
  description: string;
  topics: Array<{
    titleBn: string;
    titleEn: string;
    theory: string[];
    formula?: string;
    formulaExplanation?: string;
    exampleProblem?: {
      question: string;
      given: Record<string, string>;
      solution: string[];
      answer: string;
    };
  }>;
}

export const AcademicSubjectView: React.FC<AcademicSubjectViewProps> = ({
  onNavigate,
  subjectKey,
  titleBn,
  titleEn,
  badge,
  description,
  topics,
}) => {
  const { saveProblem, logStudyActivity } = useStudent();
  const [expandedTopicIdx, setExpandedTopicIdx] = useState<number>(0);
  const [savedSuccessIdx, setSavedSuccessIdx] = useState<number | null>(null);

  const handleSaveProblem = async (topic: (typeof topics)[0], idx: number) => {
    if (!topic.exampleProblem) return;
    await saveProblem({
      subject: titleEn,
      topicTitle: topic.titleBn,
      question: topic.exampleProblem.question,
      givenData: topic.exampleProblem.given,
      solutionSteps: topic.exampleProblem.solution,
      finalAnswer: topic.exampleProblem.answer,
      explanation: topic.formulaExplanation || topic.theory[0] || '',
      isFavorite: true,
    });
    setSavedSuccessIdx(idx);
    setTimeout(() => setSavedSuccessIdx(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <button
            onClick={() => onNavigate('student_dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>শিক্ষার্থী ড্যাশবোর্ডে ফিরে যান</span>
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {titleBn}
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {badge}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{titleEn}</p>
          <p className="text-xs text-slate-600 mt-2 max-w-3xl leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('student_practice')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>প্র্যাকটিস ল্যাব</span>
          </button>
          <button
            onClick={() => onNavigate('student_saved_problems')}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-600" />
            <span>প্রশ্নব্যাংক</span>
          </button>
        </div>
      </div>

      {/* Topics Accordion List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            বিষয়ভিত্তিক লেকচার নোট ও সমাধান ({topics.length} টি টপিক)
          </h2>
          <span className="text-[11px] text-slate-400">টপিকে ক্লিক করে বিস্তারিত দেখুন</span>
        </div>

        {topics.map((topic, idx) => {
          const isExpanded = expandedTopicIdx === idx;
          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl border transition-all ${
                isExpanded ? 'border-emerald-300 shadow-sm ring-1 ring-emerald-500/10' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Topic Header Toggle */}
              <button
                type="button"
                onClick={() => {
                  setExpandedTopicIdx(isExpanded ? -1 : idx);
                  if (!isExpanded) {
                    logStudyActivity({
                      subject: titleEn,
                      topicTitle: topic.titleBn,
                      action: 'studied_topic',
                      description: `${titleBn}-এর "${topic.titleBn}" অধ্যায় রিভিশন করা হয়েছে।`,
                    });
                  }
                }}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                    isExpanded ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                      {topic.titleBn}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">{topic.titleEn}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {topic.formula && (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ফর্মুলা অন্তর্ভুক্ত
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Topic Body Content */}
              {isExpanded && (
                <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
                  {/* Theory Points */}
                  <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>মৌলিক ধারণা ও নিয়মাবলী (Core Concepts)</span>
                    </h4>
                    <ul className="space-y-1.5 pl-5 list-disc text-slate-600">
                      {topic.theory.map((pt, pIdx) => (
                        <li key={pIdx}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Formula Box if available */}
                  {topic.formula && (
                    <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                        প্রয়োজনীয় গাণিতিক সূত্র (Formula)
                      </span>
                      <div className="p-3 bg-white rounded-lg border border-emerald-300 font-mono text-xs sm:text-sm text-emerald-950 font-bold">
                        {topic.formula}
                      </div>
                      {topic.formulaExplanation && (
                        <p className="text-xs text-emerald-800 leading-relaxed">
                          • {topic.formulaExplanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Worked Example Problem */}
                  {topic.exampleProblem && (
                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          <span>ব্যবহারিক উদাহরণ ও সমস্যা সমাধান (Worked Example)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSaveProblem(topic, idx)}
                          className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {savedSuccessIdx === idx ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>নোটবুকে সেভ হয়েছে!</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                              <span>প্রশ্নব্যাংকে সেভ করুন</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-800 font-medium">
                        <span className="font-bold text-slate-900 block mb-1">প্রশ্ন / কেস:</span>
                        {topic.exampleProblem.question}
                      </div>

                      {/* Given data */}
                      {Object.keys(topic.exampleProblem.given).length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {Object.entries(topic.exampleProblem.given).map(([key, val], gIdx) => (
                            <div key={gIdx} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                              <span className="text-[10px] text-slate-400 block">{key}</span>
                              <span className="font-bold text-slate-800">{val}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Solution steps */}
                      <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-900 block mb-1">সমাধানের ধাপসমূহ:</span>
                        {topic.exampleProblem.solution.map((step, sIdx) => (
                          <p key={sIdx} className="leading-relaxed">{step}</p>
                        ))}
                      </div>

                      {/* Final Answer */}
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-bold text-emerald-900">
                        উত্তর: {topic.exampleProblem.answer}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
