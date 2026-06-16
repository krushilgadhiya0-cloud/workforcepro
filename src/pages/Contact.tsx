import { useState } from 'react';
import { MapPin, Phone, Mail, Send, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useTheme } from '../contexts/ThemeContext';

export function Contact() {
  const { theme } = useTheme();
  const [form, setForm] = useState({ name: '', email: '', date: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      
      setSuccess(true);
      setForm({ name: '', email: '', date: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen pt-24 pb-12 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">
            GET IN <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 animate-pulse drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">TOUCH</span>
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto font-medium">
            Schedule a bespoke viewing, request a test drive, or simply ask us a question.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Contact Information */}
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Contact Information</h2>
              <p className="text-[var(--text-muted)] max-w-md leading-relaxed">
                Our dedicated team of automotive specialists are available to assist you with any inquiries regarding our collection.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0 group-hover:bg-[var(--primary)]/20 transition-all duration-300">
                  <MapPin className="text-[var(--primary)]" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Location</h3>
                  <p className="text-[var(--text-muted)] font-medium">Gujarat, India</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0 group-hover:bg-[var(--primary)]/20 transition-all duration-300">
                  <Phone className="text-[var(--primary)]" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Phone</h3>
                  <p className="text-[var(--text-muted)] font-medium">+91-9327387851</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0 group-hover:bg-[var(--primary)]/20 transition-all duration-300">
                  <Mail className="text-[var(--primary)]" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Email</h3>
                  <p className="text-[var(--text-muted)] font-medium">krushilgadhiya0@gmail.com</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-[var(--border)]/50">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={20} className="text-[var(--primary)]" />
                <h3 className="font-bold uppercase tracking-widest text-sm">Business Hours</h3>
              </div>
              <div className="space-y-2 text-sm text-[var(--text-muted)] font-medium">
                <p>Monday — Friday: 9:00 AM - 8:00 PM</p>
                <p>Saturday: 10:00 AM - 6:00 PM</p>
                <p>Sunday: By Appointment Only</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="glass-card p-1 border border-white/10 rounded-[2rem]">
            <div className="bg-[#111]/80 backdrop-blur-xl p-8 sm:p-10 rounded-[1.8rem] space-y-6 shadow-2xl">
              {success ? (
                <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-500" size={48} />
                  </div>
                  <h2 className="text-3xl font-bold italic">THANK YOU</h2>
                  <p className="text-[var(--text-muted)] font-medium">
                    Your message has been received. Our team will contact you shortly.
                  </p>
                  <Button variant="outline" className="mt-8" onClick={() => setSuccess(false)}>Send Another Message</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                    <Input 
                      placeholder="Your Name" 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="bg-white/5 border-white/10 h-14"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                    <Input 
                      type="email"
                      placeholder="your.email@example.com" 
                      value={form.email} 
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="bg-white/5 border-white/10 h-14"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-widest text-gray-400">Preferred Date (Optional)</label>
                    <Input 
                      type="date"
                      value={form.date} 
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="bg-white/5 border-white/10 h-14"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-widest text-gray-400">Your Message</label>
                    <textarea 
                      placeholder="Special requirements, questions, or comments..." 
                      value={form.message} 
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all font-medium"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full h-16 text-lg font-black italic uppercase tracking-tighter shadow-[0_10px_20px_rgba(220,38,38,0.3)] group" disabled={submitting}>
                    {submitting ? 'Sending...' : (
                      <>
                        Submit Inquiry <Send className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={20} />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
