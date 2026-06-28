import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Shield, Briefcase, MessageSquare, Search, ChevronLeft, Pencil, Trash2, Video, Phone } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useData, useCurrentUser } from '../contexts/DataContext';
import type { User, PrivateMessage } from '../types';
import { renderTextWithLinks } from '../utils/text';

function generateJitsiLink(user1: string, user2: string) {
  return `https://meet.jit.si/workforcepro-private-${user1.substring(0,8)}-${user2.substring(0,8)}`;
}

export function PrivateMessages() {
  const { privateMessages, getPrivateMessages, sendPrivateMessage, getPrivateContacts, markPrivateMessageRead, editPrivateMessage, deletePrivateMessage } = useData();
  const user = useCurrentUser();
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const contacts = user ? getPrivateContacts(user.id) : [];
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const messages = (user && selectedContact) ? getPrivateMessages(user.id, selectedContact.id) : [];

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const lastMsg = messages[messages.length - 1];
      const IJustSentMessage = lastMsg && lastMsg.senderId === user?.id;
      
      if (isNearBottomRef.current || IJustSentMessage) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
    // Mark unread as read
    if (user && selectedContact) {
      messages.forEach((m: PrivateMessage) => {
        if (!m.read && m.receiverId === user.id) {
          markPrivateMessageRead(m.id);
        }
      });
    }
  }, [messages, user, selectedContact, markPrivateMessageRead]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedContact) return;
    sendPrivateMessage(selectedContact.id, content);
    setContent('');
    isNearBottomRef.current = true;
  };

  const startPrivateCall = (isVideo: boolean) => {
    if (!user || !selectedContact) return;
    const link = generateJitsiLink(user.id, selectedContact.id) + (isVideo ? '' : '#config.startWithVideoMuted=true');
    const msg = `I've started a ${isVideo ? 'Video' : 'Voice'} Call. Click here to join: ${link}`;
    sendPrivateMessage(selectedContact.id, msg);
    window.open(link, '_blank');
  };

  const handleEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditingContent(content);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editingContent.trim()) {
      editPrivateMessage(editingId, editingContent);
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

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <PageHeader 
        title="Private Messages" 
        subtitle="Direct conversation with your team admins and owners" 
        showBack={false}
      />

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Contact List */}
        <Card className={`w-80 flex flex-col p-4 glass-card ${selectedContact ? 'max-md:hidden' : 'max-md:w-full'}`}>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-9 pr-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)] transition-all"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {filteredContacts.map((c) => {
              const unread = privateMessages.filter(m => m.senderId === c.id && m.receiverId === user?.id && !m.read).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedContact(c)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedContact?.id === c.id 
                      ? 'bg-[var(--primary)] text-white shadow-lg' 
                      : 'hover:bg-[var(--border)]/30 text-[var(--text)]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    selectedContact?.id === c.id ? 'bg-white/20' : 'bg-[var(--border)]'
                  }`}>
                    <UserIcon size={20} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      {unread > 0 && (
                        <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] uppercase tracking-wider font-bold opacity-70`}>{c.role}</p>
                  </div>
                </button>
              );
            })}
            {filteredContacts.length === 0 && (
              <p className="text-center py-10 text-[var(--text-muted)] text-xs italic">No contacts found</p>
            )}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className={`flex-1 flex flex-col p-0 overflow-hidden glass-card ${!selectedContact ? 'max-md:hidden' : ''}`}>
          {selectedContact ? (
            <>
              <div className="p-4 border-b border-[var(--border)] bg-[var(--border)]/5 flex items-center gap-3">
                <button 
                  onClick={() => setSelectedContact(null)}
                  className="md:hidden p-2 -ml-2 hover:bg-[var(--border)]/50 rounded-lg"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                  <UserIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[var(--text)] leading-tight truncate">{selectedContact.name}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-0.5">
                    {getRoleIcon(selectedContact.role)} {selectedContact.role}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startPrivateCall(false)} className="p-2 md:px-3 text-slate-500 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-xl transition-all" title="Start Voice Call">
                    <Phone size={18} />
                  </button>
                  <button onClick={() => startPrivateCall(true)} className="p-2 md:px-3 text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 rounded-xl transition-all font-bold md:flex items-center gap-2" title="Start Video Call">
                    <Video size={18} />
                    <span className="hidden md:inline text-xs">Video</span>
                  </button>
                </div>
              </div>

              <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
                    <MessageSquare size={48} className="mb-4 opacity-20" />
                    <p>No messages yet. Send a private message!</p>
                  </div>
                ) : (
                  messages.map((m: PrivateMessage) => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {editingId === m.id ? (
                      <form onSubmit={saveEdit} className="bg-[var(--card)] border border-[var(--primary)] rounded-xl p-2 w-full min-w-[150px]">
                        <input
                          autoFocus
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full bg-transparent text-sm outline-none p-1 text-[var(--text)]"
                        />
                        <div className="flex justify-end gap-2 mt-1">
                          <button type="button" onClick={() => setEditingId(null)} className="text-[10px] text-[var(--text-muted)] hover:text-red-500">Cancel</button>
                          <button type="submit" className="text-[10px] text-[var(--primary)] font-bold">Save</button>
                        </div>
                      </form>
                    ) : (
                      <div className="group relative">
                        <div className={`p-3 rounded-2xl text-sm ${
                          m.isDeleted ? 'bg-slate-500/5 text-slate-400 italic border border-slate-200/50' :
                          isMe ? 'bg-[var(--primary)] text-white rounded-tr-none shadow-sm' : 'bg-[var(--border)]/40 text-[var(--text)] rounded-tl-none'
                        }`}>
                          {renderTextWithLinks(m.content)}
                        </div>
                        
                        {isMe && !m.isDeleted && (
                          <div className={`absolute -top-6 ${isMe ? 'right-0' : 'left-0'} hidden group-hover:flex items-center gap-1 p-1 px-2 rounded-lg bg-white dark:bg-slate-800 shadow-xl border border-[var(--border)] animate-fade-in z-10`}>
                            <button onClick={() => handleEdit(m.id, m.content)} className="p-1 text-slate-500 hover:text-[var(--primary)] transition-colors"><Pencil size={12} /></button>
                            <button onClick={() => deletePrivateMessage(m.id)} className="p-1 text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1 px-1">
                      {m.read && isMe && !m.isDeleted && <span className="text-[9px] text-green-500 font-bold uppercase">Seen</span>}
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

              <form onSubmit={handleSend} className="p-4 border-t border-[var(--border)] bg-[var(--border)]/5 flex gap-2">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Message ${selectedContact.name}...`}
                  className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] transition-all shadow-inner"
                />
                <Button type="submit" className="glow-primary shrink-0 px-6">
                  <Send size={18} />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-[var(--border)]/20 flex items-center justify-center mb-6">
                <MessageSquare size={40} className="opacity-20" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-2">Select a Conversation</h3>
              <p className="max-w-xs text-sm">Choose an admin or owner from the list to start a private, one-on-one discussion.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
