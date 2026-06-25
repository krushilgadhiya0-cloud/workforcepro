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
    <div className="min-h-screen bg-[var(--bg)] selection:bg-[var(--primary)] selection:text-white">
      {/* Decorative Blur Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[var(--primary)]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[var(--accent)]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-4 mb-20 animate-in fade-in slide-in-from-top-10 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-semibold mb-2">
             <MessageCircle size={16} /> Get In Touch
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[var(--text)]">
            How can we <span className="gradient-text">help you?</span>
          </h1>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">
            Whether you have questions about our features, pricing, or need technical support, our dedicated team is here to assist you 24/7.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="lg:col-span-1 space-y-6 animate-in fade-in slide-in-from-left-10 duration-700 delay-200">
            {[
              { icon: Mail, label: 'Email Support', val: 'support@workforcepro.com', desc: 'Average response: 2 hours', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: Phone, label: 'Technical Helpline', val: '+91 98765 43210', desc: 'Mon - Fri, 9am to 6pm IST', color: 'text-green-500', bg: 'bg-green-500/10' },
              { icon: MapPin, label: 'Visit Our HQ', val: 'Digital Square, Silicon Valley', desc: 'Bangalore, Karnataka, India', color: 'text-purple-500', bg: 'bg-purple-500/10' },
            ].map((method) => (
              <Card key={method.label} hover className="border border-[var(--border)]/50 backdrop-blur-md overflow-hidden relative group">
                <div className={`absolute top-0 right-0 w-24 h-24 ${method.bg} rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-150 opacity-20`} />
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${method.bg} ${method.color}`}>
                    <method.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text)] mb-1">{method.label}</h3>
                    <p className="text-[var(--text)] font-medium mb-1">{method.val}</p>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <Clock size={12} /> {method.desc}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 animate-in fade-in slide-in-from-right-10 duration-700 delay-200">
            <Card className="p-8 md:p-10 border border-[var(--border)]/50 glass-card relative overflow-hidden">
              {submitted ? (
                <div className="py-20 text-center animate-in zoom-in-50 duration-500">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-3xl font-bold text-[var(--text)] mb-2">Message Sent!</h2>
                  <p className="text-[var(--text-muted)] mb-8 max-w-sm mx-auto">
                    Thank you for reaching out. We've received your inquiry and will get back to you shortly.
                  </p>
                  <Button onClick={() => setSubmitted(false)} variant="outline">
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Input label="Full Name" placeholder="John Doe" required className="bg-[var(--bg)]/50" />
                    </div>
                    <div className="space-y-2">
                       <Input label="Email Address" type="email" placeholder="john@example.com" required className="bg-[var(--bg)]/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <Input label="Subject" placeholder="How can we help?" required className="bg-[var(--bg)]/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-muted)] ml-1">Message</label>
                    <textarea 
                      required
                      placeholder="Write your message here..."
                      className="w-full h-32 rounded-2xl p-4 bg-[var(--bg)]/50 border border-[var(--border)] outline-none focus:border-[var(--primary)] transition-all resize-none text-sm"
                    />
                  </div>
                  <Button type="submit" className="w-full py-4 text-lg font-bold glow-primary" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 justify-center">
                        Send Message <Send size={18} />
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
  );
}
