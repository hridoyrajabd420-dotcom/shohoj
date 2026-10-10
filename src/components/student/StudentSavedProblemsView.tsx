import React, { useState } from 'react';
import { ViewTab } from '../../types';
import { useStudent } from '../../context/StudentContext';
import {
  Bookmark,
  ArrowLeft,
  Trash2,
  Star,
  Plus,
  HelpCircle,
  CheckCircle2,
  Search,
  Filter,
} from 'lucide-react';

interface StudentSavedProblemsViewProps {
  onNavigate: (tab: ViewTab) => void;
}

export const StudentSavedProblemsView: React.FC<StudentSavedProblemsViewProps> = ({
  onNavigate,
}) => {
  const { savedProblems, deleteProblem, toggleFavoriteProblem, saveProblem } = useStudent();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Problem Form Modal state
  const [newSubject, setNewSubject] = useState('Accounting');
  const [newTitle, setNewTitle] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const filteredProblems = savedProblems.filter((p) => {
    const matchesSubject = selectedSubject === 'all' || p.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchesSearch =
      p.topicTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const handleCreateCustomProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newQuestion.trim()) return;

    await saveProblem({
      subject: newSubject,
      topicTitle: newTitle.trim(),
      question: newQuestion.trim(),
      givenData: {},
      solutionSteps: newSolution.trim() ? newSolution.split('\n').filter(Boolean) : ['শিক্ষার্থী কর্তৃক প্রস্তুতকৃত নোট।'],
      finalAnswer: newAnswer.trim() || 'নোটবুক সমাধান',
      explanation: 'ব্যক্তিগত পাঠ্যবই বা ক্লাসরুম লেকচার থেকে সংরক্ষিত প্রশ্ন।',
      isFavorite: true,
    });

    setNewTitle('');
    setNewQuestion('');
    setNewSolution('');
    setNewAnswer('');
    setIsAddModalOpen(false);
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
              ৯. সংরক্ষিত সমস্যা ও প্রশ্নব্যাংক (Saved Problems)
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {savedProblems.length} টি সমস্যা
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            আপনার অ্যাকাডেমিক পরীক্ষার রিভিশন, জটিল অঙ্কের সমাধান ও ব্যক্তিগত নোট সংরক্ষণের খাতা।
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন সমস্যা যোগ করুন</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="টপিক বা প্রশ্ন খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="all">সকল বিষয় ({savedProblems.length})</option>
          <option value="Accounting">Accounting (হিসাববিজ্ঞান)</option>
          <option value="Finance">Finance (অর্থায়ন)</option>
          <option value="Cost Accounting">Cost Accounting</option>
          <option value="Economics">Economics</option>
          <option value="Business Math">Business Math</option>
          <option value="Statistics">Statistics</option>
        </select>
      </div>

      {/* Problems List */}
      {filteredProblems.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">কোনো সংরক্ষিত সমস্যা পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            লেকচার নোট থেকে অথবা উপরের "নতুন সমস্যা যোগ করুন" বাটনে ক্লিক করে পরীক্ষার জন্য গুরুত্বপূর্ণ সমস্যা সেভ করুন।
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProblems.map((prob) => (
            <div
              key={prob.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-amber-300 shadow-xs transition-all space-y-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                    {prob.subject}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{prob.topicTitle}</h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleFavoriteProblem(prob.id)}
                    className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                    title="স্টার মার্ক করুন"
                  >
                    <Star
                      className={`w-4 h-4 ${prob.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`}
                    />
                  </button>
                  <button
                    onClick={() => deleteProblem(prob.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question */}
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-800 leading-relaxed font-medium">
                <span className="font-bold text-slate-900 block mb-1">প্রশ্ন / গাণিতিক সমস্যা:</span>
                {prob.question}
              </div>

              {/* Solution steps */}
              {prob.solutionSteps && prob.solutionSteps.length > 0 && (
                <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-900 block mb-1">সমাধানের ধাপ:</span>
                  {prob.solutionSteps.map((step, idx) => (
                    <p key={idx} className="leading-relaxed">{step}</p>
                  ))}
                </div>
              )}

              {/* Final Answer */}
              {prob.finalAnswer && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center justify-between">
                  <span>উত্তর: {prob.finalAnswer}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    সেভ হয়েছে: {new Date(prob.savedAt).toLocaleDateString('bn-BD')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Problem Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              নতুন সমস্যা বা নোট সংরক্ষণ করুন
            </h3>

            <form onSubmit={handleCreateCustomProblem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">বিষয় (Subject)</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Accounting">Accounting (হিসাববিজ্ঞান)</option>
                  <option value="Finance">Finance (অর্থায়ন)</option>
                  <option value="Economics">Economics (অর্থনীতি)</option>
                  <option value="Business Math">Business Math (ব্যবসায়িক গণিত)</option>
                  <option value="Cost Accounting">Cost Accounting (কস্ট অ্যাকাউন্টিং)</option>
                  <option value="Management Accounting">Management Accounting</option>
                  <option value="Statistics">Business Statistics (পরিসংখ্যান)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">টপিক বা অধ্যায়ের শিরোনাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: অনুপাত বিশ্লেষণ (Ratio Analysis)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">প্রশ্ন / সমস্যা *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="প্রশ্নের বিবরণ লিখুন..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">সমাধানের ধাপসমূহ (লাইন বাই লাইন)</label>
                <textarea
                  rows={3}
                  placeholder="ধাপ ১: ...&#10;ধাপ ২: ..."
                  value={newSolution}
                  onChange={(e) => setNewSolution(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">চূড়ান্ত উত্তর / ফলাফল</label>
                <input
                  type="text"
                  placeholder="যেমন: কারেন্ট রেশিও = ২.৫:১"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
