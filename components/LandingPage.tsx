import React, { useState } from 'react';
import { Sparkles, PiggyBank, Shield, TrendingUp, BarChart3, LogIn, UserPlus } from 'lucide-react';
import AuthModal from './AuthModal';

const LandingPage: React.FC = () => {
  const [authModal, setAuthModal] = useState<'signup' | 'signin' | null>(null);

  return (
    <div className="min-h-screen bg-[#F9FBFC]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tighter">ZenFinance</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setAuthModal('signin')}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-2.5 border-2 border-slate-900 text-slate-900 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => setAuthModal('signup')}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </button>
          </div>
        </div>
      </nav>

      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-6">
              Take control of your{' '}
              <span className="bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                finances
              </span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              Track income, expenses, savings, and debt all in one place. Get AI-powered insights to make smarter financial decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={() => setAuthModal('signup')}
                className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 hover:shadow-2xl hover:shadow-slate-300"
              >
                Get Started Free
              </button>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> Secure & private
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI-powered insights
              </span>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative">
              <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200 p-8 border border-slate-100">
                <div className="bg-gradient-to-br from-rose-400 to-orange-400 rounded-2xl p-6 mb-6">
                  <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Total Capital</p>
                  <p className="text-white text-3xl font-black tracking-tighter">$20,200.00</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Income</p>
                    <p className="text-slate-900 font-black text-lg tracking-tight">$5,300</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Savings</p>
                    <p className="text-slate-900 font-black text-lg tracking-tight">$17,400</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Score</p>
                    <p className="text-slate-900 font-black text-lg tracking-tight">84</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter text-center mb-4">Everything you need</h2>
          <p className="text-slate-400 text-center mb-16 max-w-md mx-auto">Powerful tools to manage every aspect of your financial life.</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-[1.5rem] p-5 sm:p-8 border border-slate-100 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5">
                <PiggyBank className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="font-black text-slate-900 text-lg tracking-tight mb-2">Smart Savings</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Set targets, track progress, and watch your savings grow with visual progress bars.</p>
            </div>
            <div className="bg-white rounded-[1.5rem] p-5 sm:p-8 border border-slate-100 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-black text-slate-900 text-lg tracking-tight mb-2">Expense Tracking</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Categorize spending, spot patterns, and understand exactly where your money goes.</p>
            </div>
            <div className="bg-white rounded-[1.5rem] p-5 sm:p-8 border border-slate-100 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-5">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-black text-slate-900 text-lg tracking-tight mb-2">AI Advisor</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Get personalized financial guidance powered by AI that understands your complete picture.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} ZenFinance</span>
          <span>Built with care</span>
        </div>
      </footer>

      <AuthModal
        mode={authModal === 'signin' ? 'signin' : 'signup'}
        isOpen={authModal !== null}
        onClose={() => setAuthModal(null)}
        onSwitchMode={() => setAuthModal(authModal === 'signin' ? 'signup' : 'signin')}
      />
    </div>
  );
};

export default LandingPage;
