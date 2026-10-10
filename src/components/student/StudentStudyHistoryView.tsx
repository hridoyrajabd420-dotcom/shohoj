import React from 'react';
import { ViewTab } from '../../types';
import { useStudent } from '../../context/StudentContext';
import {
  History,
  ArrowLeft,
  Trash2,
  BookOpen,
  Calculator,
  Bookmark,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';

interface StudentStudyHistoryViewProps {
  onNavigate: (tab: ViewTab) => void;
}

export const StudentStudyHistoryView: React.FC<StudentStudyHistoryViewProps> = ({
  onNavigate,
}) => {
  const { studyHistory, calculations, clearStudyHistory } = useStudent();

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'studied_topic':
        return { label: 'টপিক স্টাডি', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: BookOpen };
      case 'ran_calculation':
        return { label: 'ক্যালকুলেশন', color: 'bg-blue-50 text-blue-800 border-blue-200', icon: Calculator };
      case 'saved_problem':
        return { label: 'সমস্যা সেভ', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Bookmark };
      default:
        return { label: 'অ্যাক্টিভিটি', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: Sparkles };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
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
              ১০. অধ্যয়ন ইতিহাস ও অগ্রগতি লগ (Study History)
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              {studyHistory.length} টি রেকর্ড
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            আপনার অ্যাকাডেমিক অনুশীলন, ফর্মুলা সমাধান এবং বিষয়ভিত্তিক পড়াশোনার স্বয়ংক্রিয় ট্র্যাকার।
          </p>
        </div>

        {studyHistory.length > 0 && (
          <button
            onClick={clearStudyHistory}
            className="px-4 py-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>হিস্ট্রি ক্লিয়ার করুন</span>
          </button>
        )}
      </div>

      {/* Recent Calculations Quick Carousel */}
      {calculations.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                সাম্প্রতিক গাণিতিক হিসাবসমূহ ({calculations.length} টি)
              </h3>
            </div>
            <button
              onClick={() => onNavigate('student_practice')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              প্র্যাকটিস ল্যাবে যান
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {calculations.slice(0, 6).map((c) => (
              <div
                key={c.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-emerald-700">{c.subject}</span>
                  <span>{new Date(c.timestamp).toLocaleDateString('bn-BD')}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 truncate">{c.topicTitle}</h4>
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900 truncate">
                  {c.summary}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          <span>দৈনিক পড়াশোনার টাইমলাইন লগ</span>
        </h3>

        {studyHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-300" />
            <p>এখনো কোনো স্টাডি লগ রেকর্ড হয়নি।</p>
            <p className="text-[11px] text-slate-500">
              যেকোনো অ্যাকাডেমিক বিষয় পড়ার সময় বা ক্যালকুলেটর ব্যবহারের সাথে সাথে স্বয়ংক্রিয়ভাবে এখানে লগ তৈরি হবে।
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {studyHistory.map((item) => {
              const badge = getActionBadge(item.action);
              const Icon = badge.icon;
              return (
                <div key={item.id} className="relative group">
                  {/* Timeline point */}
                  <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 shadow-2xs group-hover:scale-125 transition-transform" />

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badge.color}`}>
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {item.topicTitle}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleString('bn-BD', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
