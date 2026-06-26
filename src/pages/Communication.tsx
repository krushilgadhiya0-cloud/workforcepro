import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Shield, Briefcase, MessageSquare } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useData, useCurrentUser } from '../contexts/DataContext';


interface CommunicationProps {
  companyId?: string;
  isSuperAdmin?: boolean;
}

export function Communication({ companyId, isSuperAdmin = false }: CommunicationProps) {
  const { getCompanyMessages, sendMessage, companies, markAllCommunicationRead } = useData();
  const user = useCurrentUser();
  const [content, setContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // If companyId is provided (Super Admin view), use it. Otherwise use current user's company.
  const targetCompanyId = companyId || user?.companyId || (user?.role === 'owner' ? companies.find(c => c.ownerId === user.id)?.id : null);
  const companyMessages = targetCompanyId ? getCompanyMessages(targetCompanyId) : [];
  const targetCompany = companies.find(c => c.id === targetCompanyId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Mark as read
    if (user && targetCompanyId && !isSuperAdmin) {
      markAllCommunicationRead(user.id);
    }
  }, [companyMessages, user, targetCompanyId, markAllCommunicationRead, isSuperAdmin]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMessage(content);
    setContent('');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Briefcase size={12} />;
      case 'admin': return <Shield size={12} />;
      default: return <UserIcon size={12} />;
    }
  };

  if (!targetCompanyId && !isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
        <MessageSquare size={48} className="mb-4 opacity-20" />
        <p>You must belong to a company to use communication.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <PageHeader 
        title={isSuperAdmin ? `Communication — ${targetCompany?.name}` : "Business Communication"} 
        subtitle={isSuperAdmin ? "Viewing company records" : "Discuss and share updates with your team"} 
        showBack={isSuperAdmin}
      />

      <Card className="flex-1 flex flex-col p-0 overflow-hidden mb-4 glass-card">
        {/* Messages List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {companyMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            companyMessages.map((m) => {
              const isMe = m.senderId === user?.id;
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      {!isMe && <span className="text-xs font-semibold text-[var(--text)]">{m.senderName}</span>}
                      {user?.lastCommunicationReadAt && new Date(m.createdAt) > new Date(user.lastCommunicationReadAt) && !isMe && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="New Message" />
                      )}
                      <span className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${
                        m.senderRole === 'owner' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' :
                        m.senderRole === 'admin' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' :
                        'bg-slate-500/10 border-slate-500/30 text-slate-600'
                      }`}>
                        {getRoleIcon(m.senderRole)}
                        {m.senderRole.toUpperCase()}
                      </span>
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${
                      isMe ? 'bg-[var(--primary)] text-white rounded-tr-none' : 'bg-[var(--border)]/30 text-[var(--text)] rounded-tl-none'
                    }`}>
                      {m.content}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area (Disabled for Super Admin) */}
        {!isSuperAdmin && (
          <form onSubmit={handleSend} className="p-4 border-t border-[var(--border)] bg-[var(--border)]/5 flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--primary)] transition-all"
            />
            <Button type="submit" className="glow-primary shrink-0">
              <Send size={18} />
            </Button>
          </form>
        )}
      </Card>
      
      {/* Help Note */}
      <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
           <MessageSquare size={16} />
        </div>
        <div>
          <h4 className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Communication Guidelines</h4>
          <p className="text-xs text-indigo-600/70 dark:text-indigo-400/60 mt-0.5">
            Use this space for professional updates, asking questions to your admin, or sharing task-related concerns. 
            All messages are visible to your company admins and super-administrators.
          </p>
        </div>
      </div>
    </div>
  );
}
