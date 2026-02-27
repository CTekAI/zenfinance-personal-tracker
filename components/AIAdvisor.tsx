import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, Loader2, CheckCircle2 } from 'lucide-react';
import { FinanceData } from '../types';

interface AIAdvisorProps {
  data: FinanceData;
}

interface Advice {
  summary: string;
  steps: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content?: string;
  advice?: Advice;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ data }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question: userMsg }),
      });

      const json = await res.json();

      if (json.ok && json.advice) {
        setMessages(prev => [...prev, { role: 'assistant', advice: json.advice }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: json.error || "Sorry, I couldn't process that request."
        }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAssistantMessage = (msg: Message) => {
    if (msg.advice) {
      return (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-700">{msg.advice.summary}</p>
          {msg.advice.steps.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Action Steps</p>
              {msg.advice.steps.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-600">{step}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return <span>{msg.content}</span>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center space-x-4 bg-white/50 backdrop-blur-sm z-10">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-black text-slate-900 text-lg tracking-tight">ZenAdvisor</h3>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Online • Powered by OpenAI</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center border border-slate-100 shadow-sm">
               <Bot className="w-10 h-10 text-slate-300" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-xl tracking-tight">How can I help you prosper?</p>
              <p className="text-sm text-slate-400 font-medium mt-2">I analyze your full financial picture to give personalized advice.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full">
              {["How can I save more this month?", "Analyze my debt payoff strategy", "Am I on track for my wishlist?"].map((q) => (
                <button 
                  key={q} 
                  onClick={() => setInput(q)}
                  className="text-xs font-bold bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 text-slate-500 py-3 px-4 rounded-xl border border-slate-200 transition-all shadow-sm"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                m.role === 'user' ? 'bg-slate-200 text-slate-500' : 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              }`}>
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div className={`p-3 sm:p-5 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none whitespace-pre-wrap' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                {m.role === 'assistant' ? renderAssistantMessage(m) : m.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-[1.5rem] rounded-tl-none border border-slate-100 flex items-center space-x-3 shadow-sm ml-11">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Analyzing finances...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 bg-white border-t border-slate-100">
        <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-[1.5rem] border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask your financial assistant..." 
            className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-xl transition-all ${
              !input.trim() || isLoading ? 'text-slate-300 bg-slate-100' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;
