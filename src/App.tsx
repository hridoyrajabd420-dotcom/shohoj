import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { StudentProvider } from './context/StudentContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ViewTab } from './types';

// Layout
import { Sidebar } from './components/layout/Sidebar';
import { StudentSidebar } from './components/layout/StudentSidebar';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { SupabaseSetupBanner } from './components/common/SupabaseSetupBanner';
import { AssignUserTypeModal } from './components/common/AssignUserTypeModal';

// Auth Modals
import { AuthModal } from './components/auth/AuthModal';
import { ResetPasswordModal } from './components/auth/ResetPasswordModal';

// Views
import { LandingPage } from './components/landing/LandingPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { StudentDashboardView } from './components/dashboard/StudentDashboardView';
import { AcademicSubjectView } from './components/student/AcademicSubjectView';
import { StudentPracticeView } from './components/student/StudentPracticeView';
import { StudentSavedProblemsView } from './components/student/StudentSavedProblemsView';
import { StudentStudyHistoryView } from './components/student/StudentStudyHistoryView';
import { ACADEMIC_CURRICULA } from './components/student/curriculaData';
import { ProductsView } from './components/products/ProductsView';
import { SalesView } from './components/sales/SalesView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { CustomersView } from './components/customers/CustomersView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';

// Business, Reports & Tool Views (All Free & Unrestricted)
import { FinancialsView } from './components/pro/FinancialsView';
import { FixedAssetsView } from './components/assets/FixedAssetsView';
import { InventoryProView } from './components/pro/InventoryProView';
import { PayablesView } from './components/pro/PayablesView';
import { InvoicesView } from './components/pro/InvoicesView';
import { ReportsView } from './components/pro/ReportsView';
import { AnalyticsView } from './components/pro/AnalyticsView';
import { CalculatorsView } from './components/pro/CalculatorsView';

// Quick Action Modals
import { SaleFormModal } from './components/sales/SaleFormModal';
import { ProductFormModal } from './components/products/ProductFormModal';
import { ExpenseFormModal } from './components/expenses/ExpenseFormModal';

const AppContent: React.FC = () => {
  const { user, profile, loading, isConfigured } = useAuth();
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // User Type redirect tracker
  const [hasRedirectedForUser, setHasRedirectedForUser] = useState<string | null>(null);

  // Auth modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Quick Action Modal states
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Automatic redirect based on user_type after successful login / profile load
  useEffect(() => {
    if (user && profile && hasRedirectedForUser !== user.id) {
      if (profile.user_type === 'student') {
        setCurrentTab('student_dashboard');
      } else if (profile.user_type === 'business') {
        // If coming from another session or fresh login, route to business dashboard
        if (currentTab === 'student_dashboard') {
          setCurrentTab('dashboard');
        }
      }
      setHasRedirectedForUser(user.id);
    }
  }, [user, profile, hasRedirectedForUser, currentTab]);

  // Full-screen loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-md mb-4 flex items-center justify-center">
          <img
            src="/assets/shohoj-bebsha-logo.png"
            alt="Shohoj Bebsha Logo"
            className="h-12 w-auto object-contain animate-pulse"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-slate-500 font-medium">সহজ ব্যবসা লোড হচ্ছে...</p>
      </div>
    );
  }

  // If user is not logged in, render the Landing Page
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Banner for Supabase credentials / quick setup */}
        <SupabaseSetupBanner />

        <LandingPage
          onOpenAuth={(mode: 'login' | 'signup') => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
          onOpenSetup={() => {
            const bannerBtn = document.getElementById('open-supabase-setup-btn');
            if (bannerBtn) bannerBtn.click();
          }}
          isConfigured={isConfigured}
        />

        {/* Authentication Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
        />

        {/* Reset Password Modal (handled automatically when reset flow is active) */}
        <ResetPasswordModal />
      </div>
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="min-h-screen bg-slate-50/70 flex">
      {/* Supabase Setup Banner if needs configuration */}
      <SupabaseSetupBanner />

      {/* Desktop & Tablet Sidebar (Switches cleanly between Business & Student) */}
      {profile?.user_type === 'student' ? (
        <StudentSidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />
      ) : (
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Top Sticky Navbar */}
        <Navbar
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileNavOpen(true)}
          onOpenSetup={() => {
            setCurrentTab('settings');
          }}
        />

        {/* Main View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {/* STUDENT SUITE VIEWS */}
          {currentTab === 'student_dashboard' && (
            <StudentDashboardView
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenSaleModal={() => setIsSaleModalOpen(true)}
              onOpenProductModal={() => setIsProductModalOpen(true)}
              onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
            />
          )}

          {currentTab === 'student_accounting' && (
            <AcademicSubjectView
              onNavigate={(tab) => setCurrentTab(tab)}
              subjectKey="accounting"
              {...ACADEMIC_CURRICULA.accounting}
            />
          )}

          {currentTab === 'student_finance' && (
            <AcademicSubjectView
              onNavigate={(tab) => setCurrentTab(tab)}
              subjectKey="finance"
              {...ACADEMIC_CURRICULA.finance}
            />
          )}

          {currentTab === 'student_economics' && (
            <AcademicSubjectView
              onNavigate={(tab) => setCurrentTab(tab)}
              subjectKey="economics"
              {...ACADEMIC_CURRICULA.economics}
            />
          )}

          {currentTab === 'student_business_math' && (
            <AcademicSubjectView
              onNavigate={(tab) => setCurrentTab(tab)}
              subjectKey="business_math"
              {...ACADEMIC_CURRICULA.business_math}
            />
          )}

          {currentTab === 'student_cost_accounting' && (
            <AcademicSubjectView
              onNavigate={(tab) => setCurrentTab(tab)}
              subjectKey="cost_accounting"
              {...ACADEMIC_CURRICULA.cost_accounting}
            />
          )}

          {currentTab === 'student_management_accounting' && (
            <AcademicSubjectView
              onNavigate={(tab) => setCurrentTab(tab)}
              subjectKey="management_accounting"
              {...ACADEMIC_CURRICULA.management_accounting}
            />
          )}

          {currentTab === 'student_statistics' && (
            <AcademicSubjectView
              onNavigate={(tab) => setCurrentTab(tab)}
              subjectKey="statistics"
              {...ACADEMIC_CURRICULA.statistics}
            />
          )}

          {currentTab === 'student_practice' && (
            <StudentPracticeView
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'student_saved_problems' && (
            <StudentSavedProblemsView
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'student_study_history' && (
            <StudentStudyHistoryView
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {/* BUSINESS DASHBOARD & VIEWS (100% UNCHANGED) */}
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenSaleModal={() => setIsSaleModalOpen(true)}
              onOpenProductModal={() => setIsProductModalOpen(true)}
              onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
            />
          )}

          {currentTab === 'products' && <ProductsView />}

          {currentTab === 'sales' && <SalesView />}

          {currentTab === 'expenses' && <ExpensesView />}

          {currentTab === 'customers' && <CustomersView />}

          {/* FINANCIAL, REPORTS & UTILITY VIEWS (ALL 100% FREE) */}
          {currentTab === 'financials' && <FinancialsView />}

          {currentTab === 'fixed_assets' && <FixedAssetsView />}

          {currentTab === 'inventory_pro' && <InventoryProView />}

          {currentTab === 'payables' && <PayablesView />}

          {currentTab === 'invoices' && <InvoicesView />}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'analytics' && <AnalyticsView />}

          {currentTab === 'calculators' && <CalculatorsView />}

          {/* SETTINGS & PROFILE */}
          {currentTab === 'profile' && <ProfileView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Navigation (Drawer & Bottom App Bar) */}
      <MobileNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Quick Action Modals */}
      <SaleFormModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
      />

      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
      />

      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />

      {/* Reset password modal if triggered during active session */}
      <ResetPasswordModal />

      {/* Assign User Type Modal if existing user has no user_type set */}
      <AssignUserTypeModal
        isOpen={Boolean(user && profile && !profile.user_type)}
        onAssigned={(assignedType) => {
          if (assignedType === 'student') {
            setCurrentTab('student_dashboard');
          } else {
            setCurrentTab('dashboard');
          }
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <StudentProvider>
              <AppContent />
            </StudentProvider>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
