import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] selection:bg-[var(--primary)] selection:text-white overflow-x-hidden">
      {/* Premium Mesh Gradient Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--primary)]/15 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--accent)]/15 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Animated Grid Lines */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.1 }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center space-y-6 mb-24 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-bold border border-[var(--primary)]/20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
             <MessageCircle size={16} /> 3D Connect
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[var(--text)] leading-[1.1] animate-in fade-in slide-in-from-top-10 duration-1000">
            Let's Talk <br /> <span className="gradient-text drop-shadow-2xl">Excellence.</span>
          </h1>
          <p className="text-[var(--text-muted)] text-xl max-w-2xl mx-auto leading-relaxed animate-in fade-in delay-500 duration-1000">
            Premium support for a premium workflow. Reach out and experience the next generation of business management assistance.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* 3D Interactive Contact Cards */}
          <div className="lg:col-span-1 space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000 delay-300">
            {[
              { icon: Mail, label: 'Email Support', val: 'support@workforcepro.com', desc: 'Avg response: 2 hrs', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: Phone, label: 'Technical Helpline', val: '+91 98765 43210', desc: 'Mon - Fri, 9am - 6pm', color: 'text-green-500', bg: 'bg-green-500/10' },
              { icon: MapPin, label: 'Global Headquarters', val: 'Silicon Square, Block 7', desc: 'Bangalore, KA, India', color: 'text-purple-500', bg: 'bg-purple-500/10' },
            ].map((method) => (
              <div 
                key={method.label}
                className="group relative transition-all duration-500" 
                style={{ perspective: '1000px' }}
              >
                <div className="relative p-6 rounded-3xl border border-[var(--border)]/50 bg-[var(--card)]/40 backdrop-blur-2xl shadow-2xl transition-all duration-700 hover:shadow-[var(--primary)]/20 hover:border-[var(--primary)]/30 hover:rotate-y-6 hover:rotate-x-2">
                  <div className={`absolute top-0 right-0 w-32 h-32 ${method.bg} rounded-full -mr-16 -mt-16 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                  <div className="flex items-start gap-5 relative z-10">
                    <div className={`p-4 rounded-2xl ${method.bg} ${method.color} shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`}>
                      <method.icon size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[var(--text)] mb-1 group-hover:text-[var(--primary)] transition-colors">{method.label}</h3>
                      <p className="text-[var(--text)] font-semibold mb-2">{method.val}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
                        <Clock size={14} className="animate-spin-slow" /> {method.desc}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Premium Glass Form with 3D Float */}
          <div className="lg:col-span-2 animate-in fade-in slide-in-from-right-10 duration-1000 delay-300">
            <div className="relative group p-[2px] rounded-[32px] overflow-hidden">
               {/* Animated Gradient Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] opacity-20 group-hover:opacity-100 animate-gradient-x transition-opacity duration-1000" />
              
              <Card className="p-10 md:p-14 bg-[var(--card)]/90 backdrop-blur-3xl rounded-[30px] border-none shadow-2xl relative">
                {submitted ? (
                  <div className="py-24 text-center animate-in zoom-in-75 duration-700">
                    <div className="w-24 h-24 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_-12px_rgba(34,197,94,0.5)]">
                      <CheckCircle2 size={48} className="animate-bounce" />
                    </div>
                    <h2 className="text-4xl font-black text-[var(--text)] mb-3">Transmission Successful!</h2>
                    <p className="text-[var(--text-muted)] text-lg mb-10 max-w-sm mx-auto font-medium leading-relaxed">
                      Your request has been beamed to our support fleet. Expect synchronization within 2 cycles.
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="outline" className="px-10 py-6 rounded-2xl hover:bg-[var(--primary)] hover:text-white transition-all shadow-xl font-bold">
                      Launch Another Request
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-sm font-bold text-[var(--text)] ml-1 uppercase tracking-widest opacity-60">Full Name</label>
                         <Input placeholder="Johnathan Doe" required className="bg-[var(--bg)]/80 py-4 px-6 rounded-2xl border-[var(--border)] focus:shadow-[0_0_20px_-5px_var(--primary)] transition-all" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-sm font-bold text-[var(--text)] ml-1 uppercase tracking-widest opacity-60">Fleet Email</label>
                         <Input type="email" placeholder="john@interstellar.com" required className="bg-[var(--bg)]/80 py-4 px-6 rounded-2xl border-[var(--border)] focus:shadow-[0_0_20px_-5px_var(--primary)] transition-all" />
                      </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-sm font-bold text-[var(--text)] ml-1 uppercase tracking-widest opacity-60">Mission Subject</label>
                       <Input placeholder="Support / Integration / Features" required className="bg-[var(--bg)]/80 py-4 px-6 rounded-2xl border-[var(--border)] focus:shadow-[0_0_20px_-5px_var(--primary)] transition-all" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-[var(--text)] ml-1 uppercase tracking-widest opacity-60">Transmission Content</label>
                      <textarea 
                        required
                        placeholder="How can we assist your workflow today?"
                        className="w-full h-40 rounded-2xl p-6 bg-[var(--bg)]/80 border border-[var(--border)] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_20px_-5px_var(--primary)] transition-all resize-none text-sm font-medium"
                      />
                    </div>
                    <Button type="submit" className="w-full py-6 text-xl font-black glow-primary rounded-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center gap-3">
                          <span className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                          Broadcasting...
                        </span>
                      ) : (
                        <span className="flex items-center gap-3 justify-center tracking-tight">
                          ENGAGE TRANSMISSION <Send size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </form>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
