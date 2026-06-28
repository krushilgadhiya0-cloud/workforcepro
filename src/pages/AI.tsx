import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Brain, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useData, useCurrentCompany } from '../contexts/DataContext';
import { generateAIResponse } from '../utils/ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function AI() {
  const { workers, tasks, dailyRevenue } = useData();
  const company = useCurrentCompany();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am your WorkForce AI Assistant. I have analyzed your business data for **${company?.name || 'your company'}**. How can I help you manage your team or optimize your revenue today?`,
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);



  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Call real AI
    try {
      const companyWorkers = workers.filter(w => w.companyId === company?.id).map(w => ({ name: w.name, designation: w.designation, status: w.attendanceStatus }));
      const companyTasks = tasks.filter(t => workers.find(w => w.id === t.workerId)?.companyId === company?.id).map(t => ({ title: t.title, status: t.status }));
      const companyRevenue = dailyRevenue.filter(r => r.companyId === company?.id);
      const totalRevenue = companyRevenue.reduce((sum, r) => sum + r.amount, 0);

      const contextData = {
        companyName: company?.name,
        companySubscription: company?.subscription,
        totalWorkers: companyWorkers.length,
        workersList: companyWorkers,
        totalTasks: companyTasks.length,
        tasksSummary: companyTasks,
        totalRevenue: `₹${totalRevenue}`,
      };

      const response = await generateAIResponse(userMsg.content, contextData);
      const aiMsg: Message = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = { role: 'assistant', content: "Sorry, I ran into an issue connecting to the AI brain.", timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <PageHeader 
        title="AI Assistant" 
        subtitle="Intelligent insights powered by your business data" 
        showBack={false}
        action={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold animate-pulse">
            <Sparkles size={14} />
            AI ENGINE ACTIVE
          </div>
        }
      />

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col p-0 overflow-hidden glass-card border-[var(--primary)]/20 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50" />
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-slate-500/5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] sm:max-w-[75%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-lg ${
                    m.role === 'user' ? 'bg-[var(--primary)] text-white' : 'bg-white border border-[var(--primary)]/20'
                  }`}>
                    {m.role === 'user' ? <Users size={18} /> : <img src="/logo.png" alt="AI" className="w-full h-full object-cover" />}
                  </div>
                  <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} min-w-0`}>
                    <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl text-sm md:text-base font-bold leading-relaxed shadow-md break-words w-full selection:bg-white/30 ${
                      m.role === 'user' 
                        ? 'bg-[var(--primary)] text-white rounded-tr-none' 
                        : 'bg-white dark:bg-slate-100 text-[#0f172a] rounded-tl-none border border-[var(--border)] ring-1 ring-black/5'
                    }`}>
                      {m.content.split('\n').map((line, si) => (
                        <p key={si} className={si > 0 ? 'mt-2' : ''}>{line}</p>
                      ))}
                    </div>
                    <span className="text-[9px] md:text-[10px] text-[var(--text-muted)] mt-1.5 opacity-60">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white border border-[var(--primary)]/20 flex items-center justify-center shadow-lg">
                    <img src="/logo.png" alt="AI" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-[var(--border)] flex gap-1 items-center h-10">
                    <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-[var(--border)] flex gap-3 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your AI assistant anything..."
                className="w-full bg-white dark:bg-slate-800 border-2 border-[var(--border)] focus:border-[var(--primary)] rounded-2xl pl-12 pr-4 py-4 text-sm outline-none transition-all shadow-inner"
              />
              <Brain size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)] opacity-40" />
            </div>
            <Button type="submit" disabled={!input.trim() || isTyping} className="h-14 px-8 glow-primary rounded-2xl">
              <Send size={20} />
            </Button>
          </form>
        </Card>

        {/* Info Panel */}
        <div className="w-80 space-y-6 hidden lg:block overflow-y-auto custom-scrollbar">
          <Card className="bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white border-none shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Brain size={80} />
            </div>
            <div className="relative z-10">
              <h4 className="font-bold flex items-center gap-2 mb-3">
                <Sparkles size={18} />
                Smart Suggetions
              </h4>
              <ul className="space-y-3">
                {[
                  "Show me my revenue trends",
                  "Who are my top workers?",
                  "Analyze pending tasks",
                  "What is my profit this month?"
                ].map((s, i) => (
                  <li key={i}>
                    <button 
                      onClick={() => setInput(s)}
                      className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium backdrop-blur-md transition-all border border-white/5"
                    >
                      "{s}"
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card className="glass-card">
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-green-500" />
              Live Insights
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5">
                <span className="text-xs text-[var(--text-muted)]">Accuracy Rate</span>
                <span className="text-xs font-bold text-green-500">99.8%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5">
                <span className="text-xs text-[var(--text-muted)]">Data Analyzed</span>
                <span className="text-xs font-bold">{tasks.length + workers.length + dailyRevenue.length} points</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={14} className="text-blue-500" />
                  <span className="text-[10px] font-bold text-blue-500 uppercase">AI Insight</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed italic">
                  "Your team efficiency has grown by 12% since last week based on task completion speed."
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
