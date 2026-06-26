import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Shield, Briefcase, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useData, useCurrentUser } from '../contexts/DataContext';


interface CommunicationProps {
  companyId?: string;
  isSuperAdmin?: boolean;
}

export function Communication({ companyId, isSuperAdmin = false }: CommunicationProps) {
  const { getCompanyMessages, sendMessage, companies, markAllCommunicationRead, editMessage, deleteMessage } = useData();
  const user = useCurrentUser();
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
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

  const handleEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditingContent(content);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editingContent.trim()) {
      editMessage(editingId, editingContent);
      setEditingId(null);
    }
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
                    {editingId === m.id ? (
                      <form onSubmit={saveEdit} className="bg-[var(--card)] border border-[var(--primary)] rounded-2xl p-2 w-full min-w-[200px]">
                        <input
                          autoFocus
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full bg-transparent text-sm outline-none p-1 text-[var(--text)]"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button type="button" onClick={() => setEditingId(null)} className="text-[10px] text-[var(--text-muted)] hover:text-red-500">Cancel</button>
                          <button type="submit" className="text-[10px] text-[var(--primary)] font-bold">Save Changes</button>
                        </div>
                      </form>
                    ) : (
                      <div className="group relative">
                        <div className={`p-3 rounded-2xl text-sm ${
                          m.isDeleted ? 'bg-slate-500/5 text-slate-400 italic border border-slate-200/50' :
                          isMe ? 'bg-[var(--primary)] text-white rounded-tr-none shadow-sm' : 'bg-[var(--border)]/30 text-[var(--text)] rounded-tl-none'
                        }`}>
                          {m.content}
                        </div>
                        
                        {!isSuperAdmin && !m.isDeleted && (
                          <div className={`absolute -top-6 ${isMe ? 'right-0' : 'left-0'} hidden group-hover:flex items-center gap-1.5 p-1 px-2 rounded-lg bg-white dark:bg-slate-800 shadow-xl border border-[var(--border)] animate-fade-in z-10`}>
                            {(isMe && !m.isDeleted) && (
                              <button onClick={() => handleEdit(m.id, m.content)} className="p-1 text-slate-500 hover:text-[var(--primary)] transition-colors"><Pencil size={12} /></button>
                            )}
                            {(isMe || user?.role === 'owner') && (
                              <button onClick={() => deleteMessage(m.id)} className="p-1 text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1 px-1">
                      {m.updatedAt && !m.isDeleted && <span className="text-[9px] text-[var(--text-muted)] italic opacity-60">edited</span>}
                      <span className="text-[10px] text-[var(--text-muted)] opacity-60">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
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
