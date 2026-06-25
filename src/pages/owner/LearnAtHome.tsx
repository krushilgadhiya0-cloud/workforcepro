import { Lightbulb, BookOpen, Search, PlayCircle, Layers, MousePointer2 } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';

export function LearnAtHome() {
  const guides = [
    {
      title: 'Getting Started',
      desc: 'Learn the basics of managing your workforce and business profile.',
      icon: Lightbulb,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      title: 'Task Management',
      desc: 'How to assign tasks to workers and track their real-time progress.',
      icon: Layers,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Payment Tracking',
      desc: 'Simplify worker payments and manage subscription billing seamlessly.',
      icon: PlayCircle,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Advanced Analytics',
      desc: 'Understand your monthly revenue trends and worker performance.',
      icon: BookOpen,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Learn at Home" 
        subtitle="Master the platform features at your own pace"
        showBack={false}
      />

      <div className="grid md:grid-cols-2 gap-6">
        {guides.map((guide) => (
          <Card key={guide.title} hover className="group cursor-pointer">
            <div className="flex gap-4">
              <div className={`p-4 rounded-2xl ${guide.bg} ${guide.color} shrink-0 h-fit transition-transform group-hover:scale-110`}>
                <guide.icon size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">{guide.title}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{guide.desc}</p>
                <div className="flex items-center gap-1.5 text-xs text-[var(--primary)] font-semibold pt-2">
                  <MousePointer2 size={12} /> Click to start lesson
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="p-8 rounded-3xl gradient-bg text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12 transition-transform group-hover:scale-110">
           <Search size={140} />
        </div>
        <div className="relative max-w-lg space-y-4">
          <h2 className="text-3xl font-black">Need custom training?</h2>
          <p className="text-white/80">Our experts can provide 1-on-1 walkthroughs for your specific business case. Schedule a call with us today.</p>
          <button className="px-6 py-2.5 rounded-xl bg-white text-[var(--primary)] font-bold text-sm shadow-xl hover:shadow-2xl transition-all active:scale-95">
            Book a Demo
          </button>
        </div>
      </div>
    </div>
  );
}
