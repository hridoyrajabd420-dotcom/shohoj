import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { StudentCalculation, StudentProblem, StudentStudyHistoryItem } from '../types';

interface StudentContextType {
  calculations: StudentCalculation[];
  savedProblems: StudentProblem[];
  studyHistory: StudentStudyHistoryItem[];
  saveCalculation: (calc: Omit<StudentCalculation, 'id' | 'userId' | 'timestamp'>) => Promise<StudentCalculation>;
  deleteCalculation: (id: string) => Promise<void>;
  saveProblem: (problem: Omit<StudentProblem, 'id' | 'userId' | 'savedAt'>) => Promise<StudentProblem>;
  deleteProblem: (id: string) => Promise<void>;
  toggleFavoriteProblem: (id: string) => Promise<void>;
  logStudyActivity: (activity: Omit<StudentStudyHistoryItem, 'id' | 'userId' | 'timestamp'>) => Promise<void>;
  clearStudyHistory: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

// Initial curated foundational problems for commerce/business students
const DEFAULT_STUDENT_PROBLEMS: (userId: string) => StudentProblem[] = (userId) => [
  {
    id: 'prob-acc-1',
    userId,
    subject: 'Accounting',
    topicTitle: 'অ্যাকাউন্টিং সমীকরণ (Accounting Equation)',
    question: 'জনাব রহমান ৫০,০০০ টাকা নগদ এবং ৩০,০০০ টাকার পণ্য নিয়ে একটি ব্যবসা শুরু করলেন। প্রথম মাসে নগদে ২০,০০০ টাকার পণ্য বিক্রি হলো যার ক্রয়মূল্য ছিল ১৫,০০০ টাকা। সমাপনী সমীকরণ (A = L + OE) নির্ণয় করুন।',
    givenData: {
      'প্রারম্ভিক নগদ': '৳৫০,০০০',
      'প্রারম্ভিক মজুদ পণ্য': '৳৩০,০০০',
      'বিক্রয় (নগদ)': '৳২০,০০০',
      'বিক্রিত পণ্যের ব্যয় (COGS)': '৳১৫,০০০',
    },
    solutionSteps: [
      '১. প্রারম্ভিক মোট সম্পদ (Assets) = নগদ ৫০,০০০ + পণ্য ৩০,০০০ = ৮০,০০০ টাকা। প্রারম্ভিক মূলধন (Equity) = ৮০,০০০ টাকা।',
      '২. পণ্য বিক্রয়ে নিট লাভ = বিক্রয় ২০,০০০ - বিক্রিত পণ্যের ব্যয় ১৫,০০০ = ৫,০০০ টাকা।',
      '৩. সমাপনী নগদ = ৫০,০০০ + ২০,০০০ = ৭০,০০০ টাকা। সমাপনী মজুদ = ৩০,০০০ - ১৫,০০০ = ১৫,০০০ টাকা।',
      '৪. মোট সম্পদ (Assets) = নগদ ৭০,০০০ + মজুদ ১৫,০০০ = ৮৫,০০০ টাকা।',
      '৫. মোট স্বত্বাধিকার (Equity) = মূলধন ৮০,০০০ + লাভ ৫,০০০ = ৮৫,০০০ টাকা (A = L + OE প্রমাণিত)।',
    ],
    finalAnswer: 'মোট সম্পদ = ৳৮৫,০০০; দায় = ৳০; সমাপনী মূলধন = ৳৮৫,০০০',
    explanation: 'ব্যবসায়ের প্রতিটি লেনদেন হিসাব সমীকরণের উভয় দিককে সর্বদা সমান রাখে। লাভ সরাসরি মালিকানাস্বত্ব বা ইকুইটি বৃদ্ধি করে।',
    isFavorite: true,
    savedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'prob-fin-1',
    userId,
    subject: 'Finance',
    topicTitle: 'বর্তমান মূল্য নির্ণয় (Present Value of Cash Flow)',
    question: 'একটি বিনিয়োগ থেকে আগামী ৩ বছর প্রতি বছর শেষে ১০,০০০ টাকা করে পাওয়া যাবে। বাট্টার হার (Discount Rate) ১০% হলে বর্তমান মূল্য (PV) কত হবে?',
    givenData: {
      'বার্ষিক নগদ প্রবাহ (PMT)': '৳১০,০০০',
      'সুদের হার (r)': '১০% (০.১০)',
      'মেয়াদ (n)': '৩ বছর',
    },
    solutionSteps: [
      '১. বছর ১ এর PV = ১০,০০০ / (১ + ০.১০)¹ = ৯,০৯০.৯১ টাকা',
      '২. বছর ২ এর PV = ১০,০০০ / (১ + ০.১০)² = ৮,২৬৪.৪৬ টাকা',
      '৩. বছর ৩ এর PV = ১০,০০০ / (১ + ০.১০)³ = ৭,৫১৩.১৫ টাকা',
      '৪. মোট বর্তমান মূল্য (PVA) = ৯,০৯০.৯১ + ৮,২৬৪.৪৬ + ৭,৫১৩.১৫ = ২৪,৮৬৮.৫২ টাকা',
    ],
    finalAnswer: 'বর্তমান মোট মূল্য (PV) = ৳২৪,৮৬৯ (প্রায়)',
    explanation: 'ভবিষ্যতের টাকার চেয়ে বর্তমানের টাকার মূল্য সর্বদা বেশি, কারণ বর্তমান টাকাকে বিনিয়োগ করে সুদ অর্জন করা সম্ভব।',
    isFavorite: true,
    savedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'prob-cost-1',
    userId,
    subject: 'Cost Accounting',
    topicTitle: 'ব্রেক-ইভেন বিশ্লেষণ (Break-Even Point in Units)',
    question: 'একটি প্রস্তুতকারী প্রতিষ্ঠানের প্রতি ইউনিট বিক্রয়মূল্য ৫০ টাকা, প্রতি ইউনিট পরিবর্তনশীল ব্যয় (Variable Cost) ৩০ টাকা, এবং মাসিক মোট স্থির ব্যয় (Fixed Costs) ৪০,০০০ টাকা। ব্রেক-ইভেন পয়েন্ট (এককে এবং টাকায়) কত?',
    givenData: {
      'প্রতি ইউনিট বিক্রয়মূল্য (SP)': '৳৫০',
      'পরিবর্তনশীল ব্যয় (VC)': '৳৩০',
      'মোট স্থির ব্যয় (FC)': '৳৪০,০০০',
    },
    solutionSteps: [
      '১. প্রতি ইউনিট কন্ট্রিবিউশন মার্জিন (CM) = SP - VC = ৫০ - ৩০ = ২০ টাকা।',
      '২. কন্ট্রিবিউশন মার্জিন অনুপাত (CM Ratio) = ২০ / ৫০ = ০.৪০ (৪০%)।',
      '৩. ব্রেক-ইভেন একক (BEP Units) = Fixed Cost / CM = ৪০,০০০ / ২০ = ২,০০০ ইউনিট।',
      '৪. ব্রেক-ইভেন বিক্রয় মূল্য (BEP Sales) = ২,০০০ × ৫০ = ১,০০,০০০ টাকা।',
    ],
    finalAnswer: 'ব্রেক-ইভেন ইউনিট = ২,০০০ ইউনিট; ব্রেক-ইভেন বিক্রয় = ৳১,০০,০০০',
    explanation: 'ব্রেক-ইভেন পয়েন্টে প্রতিষ্ঠানের লাভও হয় না, ক্ষতিও হয় না (নিট মুনাফা = ০)।',
    isFavorite: false,
    savedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

const DEFAULT_HISTORY_ITEMS: (userId: string) => StudentStudyHistoryItem[] = (userId) => [
  {
    id: 'hist-1',
    userId,
    subject: 'Accounting',
    topicTitle: 'অ্যাকাউন্টিং সমীকরণ ও দুতরফা দাখিলা',
    action: 'studied_topic',
    description: 'হিসাব সমীকরণ (A = L + OE) এবং ডেবিট-ক্রেডিট স্বর্ণসূত্রের মূল নীতি পর্যালোচনা সম্পন্ন হয়েছে।',
    timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'hist-2',
    userId,
    subject: 'Finance',
    topicTitle: 'অর্থের সময়মূল্য (Time Value of Money)',
    action: 'ran_calculation',
    description: 'ভবিষ্যৎ মূল্য (FV) ও চক্রবৃদ্ধি সুদের মান গণনা করা হয়েছে।',
    timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'hist-3',
    userId,
    subject: 'Cost Accounting',
    topicTitle: 'ব্রেক-ইভেন বিশ্লেষণ (Break-Even Point)',
    action: 'saved_problem',
    description: 'কন্ট্রিবিউশন মার্জিন ও ব্রেক-ইভেন পয়েন্টের গাণিতিক কেস সমাধান নোটবুকে সংরক্ষণ করা হয়েছে।',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || 'guest-student';

  const [calculations, setCalculations] = useState<StudentCalculation[]>([]);
  const [savedProblems, setSavedProblems] = useState<StudentProblem[]>([]);
  const [studyHistory, setStudyHistory] = useState<StudentStudyHistoryItem[]>([]);

  // Load from student-specific scoped localStorage
  useEffect(() => {
    if (!userId) return;

    const calcKey = `shohoj_student_calcs_${userId}`;
    const probKey = `shohoj_student_problems_${userId}`;
    const histKey = `shohoj_student_history_${userId}`;

    try {
      const storedCalcs = localStorage.getItem(calcKey);
      if (storedCalcs) {
        setCalculations(JSON.parse(storedCalcs));
      } else {
        setCalculations([]);
      }

      const storedProbs = localStorage.getItem(probKey);
      if (storedProbs) {
        setSavedProblems(JSON.parse(storedProbs));
      } else {
        const defaults = DEFAULT_STUDENT_PROBLEMS(userId);
        setSavedProblems(defaults);
        localStorage.setItem(probKey, JSON.stringify(defaults));
      }

      const storedHistory = localStorage.getItem(histKey);
      if (storedHistory) {
        setStudyHistory(JSON.parse(storedHistory));
      } else {
        const defaults = DEFAULT_HISTORY_ITEMS(userId);
        setStudyHistory(defaults);
        localStorage.setItem(histKey, JSON.stringify(defaults));
      }
    } catch (e) {
      console.warn('Failed to load student data from storage:', e);
    }
  }, [userId]);

  // Save changes to localStorage
  const saveCalculation = useCallback(
    async (calcInput: Omit<StudentCalculation, 'id' | 'userId' | 'timestamp'>) => {
      const newCalc: StudentCalculation = {
        ...calcInput,
        id: `calc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        timestamp: new Date().toISOString(),
      };

      setCalculations((prev) => {
        const updated = [newCalc, ...prev];
        localStorage.setItem(`shohoj_student_calcs_${userId}`, JSON.stringify(updated));
        return updated;
      });

      // Also log activity automatically
      logStudyActivity({
        subject: calcInput.subject,
        topicTitle: calcInput.topicTitle,
        action: 'ran_calculation',
        description: `${calcInput.topicTitle} ফর্মুলার ক্যালকুলেশন সম্পন্ন: ${calcInput.summary}`,
      });

      return newCalc;
    },
    [userId]
  );

  const deleteCalculation = useCallback(
    async (id: string) => {
      setCalculations((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        localStorage.setItem(`shohoj_student_calcs_${userId}`, JSON.stringify(updated));
        return updated;
      });
    },
    [userId]
  );

  const saveProblem = useCallback(
    async (probInput: Omit<StudentProblem, 'id' | 'userId' | 'savedAt'>) => {
      const newProblem: StudentProblem = {
        ...probInput,
        id: `prob-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        savedAt: new Date().toISOString(),
      };

      setSavedProblems((prev) => {
        const updated = [newProblem, ...prev];
        localStorage.setItem(`shohoj_student_problems_${userId}`, JSON.stringify(updated));
        return updated;
      });

      logStudyActivity({
        subject: probInput.subject,
        topicTitle: probInput.topicTitle,
        action: 'saved_problem',
        description: `নতুন অ্যাকাডেমিক সমস্যা নোটবুকে সেভ করা হয়েছে: ${probInput.topicTitle}`,
      });

      return newProblem;
    },
    [userId]
  );

  const deleteProblem = useCallback(
    async (id: string) => {
      setSavedProblems((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        localStorage.setItem(`shohoj_student_problems_${userId}`, JSON.stringify(updated));
        return updated;
      });
    },
    [userId]
  );

  const toggleFavoriteProblem = useCallback(
    async (id: string) => {
      setSavedProblems((prev) => {
        const updated = prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
        localStorage.setItem(`shohoj_student_problems_${userId}`, JSON.stringify(updated));
        return updated;
      });
    },
    [userId]
  );

  const logStudyActivity = useCallback(
    async (activity: Omit<StudentStudyHistoryItem, 'id' | 'userId' | 'timestamp'>) => {
      const newHistoryItem: StudentStudyHistoryItem = {
        ...activity,
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        timestamp: new Date().toISOString(),
      };

      setStudyHistory((prev) => {
        const updated = [newHistoryItem, ...prev.slice(0, 49)]; // keep latest 50
        localStorage.setItem(`shohoj_student_history_${userId}`, JSON.stringify(updated));
        return updated;
      });
    },
    [userId]
  );

  const clearStudyHistory = useCallback(async () => {
    setStudyHistory([]);
    localStorage.removeItem(`shohoj_student_history_${userId}`);
  }, [userId]);

  return (
    <StudentContext.Provider
      value={{
        calculations,
        savedProblems,
        studyHistory,
        saveCalculation,
        deleteCalculation,
        saveProblem,
        deleteProblem,
        toggleFavoriteProblem,
        logStudyActivity,
        clearStudyHistory,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};
