import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from './Modal';
import { GraduationCap, Briefcase, CheckCircle, ShieldCheck } from 'lucide-react';
import { UserType } from '../../types';

interface AssignUserTypeModalProps {
  isOpen: boolean;
  onAssigned?: (type: UserType) => void;
}

export const AssignUserTypeModal: React.FC<AssignUserTypeModalProps> = ({ isOpen, onAssigned }) => {
  const { setUserType } = useAuth();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<UserType>('business');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    const { error } = await setUserType(selected);
    setLoading(false);

    if (error) {
      showToast(error, 'error');
    } else {
      showToast(
        selected === 'student'
          ? 'শিক্ষার্থী মোড সফলভাবে নির্বাচন করা হয়েছে! (Student Mode Activated)'
          : 'ব্যবসা মোড সফলভাবে সংরক্ষিত হয়েছে! (Business Mode Activated)',
        'success'
      );
      if (onAssigned) onAssigned(selected);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        // Must choose to proceed
      }}
      title="অ্যাকাউন্টের ধরন নিশ্চিত করুন (Choose Your Account Mode)"
      subtitle="সহজ ব্যবসা আপনি কোন উদ্দেশ্যে ব্যবহার করতে চান তা নির্বাচন করুন"
      maxWidth="max-w-lg"
    >
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option 1: Business User */}
          <div
            id="choose-business-mode-card"
            onClick={() => setSelected('business')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              selected === 'business'
                ? 'border-emerald-600 bg-emerald-50/50 shadow-md shadow-emerald-600/10'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            {selected === 'business' && (
              <CheckCircle className="w-5 h-5 text-emerald-600 absolute top-4 right-4" />
            )}
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
              <Briefcase className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">ব্যবসায়ী (Business User)</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              দোকান বা ব্যবসা পরিচালনা, ইনভেন্টরি, বিক্রয়, খরচের খাতা, বাকি ও লাভ-ক্ষতির বাস্তব হিসাব।
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200/60 text-[11px] font-semibold text-emerald-800">
              ব্যবসায়িক ড্যাশবোর্ড
            </div>
          </div>

          {/* Option 2: Student */}
          <div
            id="choose-student-mode-card"
            onClick={() => setSelected('student')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              selected === 'student'
                ? 'border-emerald-600 bg-emerald-50/50 shadow-md shadow-emerald-600/10'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            {selected === 'student' && (
              <CheckCircle className="w-5 h-5 text-emerald-600 absolute top-4 right-4" />
            )}
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-3">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">শিক্ষার্থী (Student)</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              অ্যাকাউন্টিং শিক্ষা, বিজনেস কেস সিমুলেশন, ফাইনান্সিয়াল ফর্মুলা ও প্রজেক্ট প্র্যাকটিস।
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200/60 text-[11px] font-semibold text-blue-800">
              শিক্ষার্থী ড্যাশবোর্ড
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>এটি আপনার প্রোফাইলে নিরাপদে সংরক্ষিত হবে। যেকোনো সময় প্রোফাইল থেকে পরিবর্তন করতে পারবেন।</span>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            id="confirm-user-type-btn"
            disabled={loading}
            onClick={handleConfirm}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>নিশ্চিত করে এগিয়ে যান (Continue)</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
