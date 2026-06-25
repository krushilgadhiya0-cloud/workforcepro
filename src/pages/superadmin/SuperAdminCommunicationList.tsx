import { useState } from 'react';
import { MessageSquare, Search, ArrowRight, Building2, Clock } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { useData } from '../../contexts/DataContext';
import { useNavigate } from 'react-router-dom';

export function SuperAdminCommunicationList() {
  const { companies, messages } = useData();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = companies.filter((c) => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.industry.toLowerCase().includes(search.toLowerCase())
  );

  const getCompanyLastMessage = (companyId: string) => {
    const companyMessages = messages.filter(m => m.companyId === companyId);
    if (companyMessages.length === 0) return null;
    return companyMessages[companyMessages.length - 1];
  };

  return (
    <div>
      <PageHeader 
        title="Company Communications" 
        subtitle="Monitor internal communications across all companies" 
        showBack={false}
      />

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search company or industry..." 
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm outline-none focus:border-[var(--primary)] transition-all" 
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const lastMsg = getCompanyLastMessage(c.id);
          return (
            <Card key={c.id} hover onClick={() => navigate(`/superadmin/communication/${c.id}`)} className="cursor-pointer group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shrink-0">
                  <Building2 size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[var(--text)] truncate">{c.name}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{c.industry}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--border)]/10 text-sm mb-4">
                {lastMsg ? (
                  <div className="space-y-1">
                    <p className="font-medium text-[var(--text)] line-clamp-1">{lastMsg.senderName}</p>
                    <p className="text-[var(--text-muted)] text-xs line-clamp-2 italic">"{lastMsg.content}"</p>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] mt-2">
                       <Clock size={10} /> {new Date(lastMsg.createdAt).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <p className="text-[var(--text-muted)] text-xs italic">No messages sent yet</p>
                )}
              </div>

              <div className="flex items-center justify-between text-[var(--primary)] font-medium text-sm">
                <span>View Chat Logs</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-[var(--card)] rounded-3xl border border-[var(--border)] glass-card">
           <MessageSquare size={64} className="mx-auto mb-4 opacity-10" />
           <p className="text-[var(--text-muted)]">No matching companies found.</p>
        </div>
      )}
    </div>
  );
}
