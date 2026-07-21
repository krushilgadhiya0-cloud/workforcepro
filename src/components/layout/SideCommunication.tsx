import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, Sparkles, Brain, Users, CheckCircle2 } from 'lucide-react';
import { useData, useCurrentUser } from '../../contexts/DataContext';
import { Button } from '../ui/Button';
import { renderTextWithLinks } from '../../utils/text';

interface SideCommunicationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideCommunication({ isOpen, onClose }: SideCommunicationProps) {
  const { getCompanyMessages, sendMessage, companies, users, markAllCommunicationRead } = useData();
  const user = useCurrentUser();
  const [content, setContent] = useState('');
  const [showProfiles, setShowProfiles] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, readBy: string[] } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const targetCompanyId = user?.companyId || (user?.role === 'owner' ? companies.find(c => c.ownerId === user.id)?.id : null);
  const company = targetCompanyId ? companies.find(c => c.id === targetCompanyId) : null;
  const companyName = company?.name || 'Company Chat';
  const companyMessages = targetCompanyId ? getCompanyMessages(targetCompanyId) : [];
  
  const companyMembers = users.filter((u) => u.companyId === targetCompanyId || (user?.role === 'owner' && u.id === user.id));

  useEffect(() => {
    const closeContext = () => setContextMenu(null);
    window.addEventListener('click', closeContext);
    return () => window.removeEventListener('click', closeContext);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, readBy?: string[]) => {
    e.preventDefault();
    if (!readBy || readBy.length === 0) return;
    setContextMenu({ x: e.clientX, y: e.clientY, readBy });
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const lastMsg = companyMessages[companyMessages.length - 1];
      const IJustSentMessage = lastMsg && lastMsg.senderId === user?.id;
      
      if (isNearBottomRef.current || IJustSentMessage) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
    
    if (isOpen && user) {
      const hasUnread = companyMessages.some(m => !user.lastCommunicationReadAt || new Date(m.createdAt) > new Date(user.lastCommunicationReadAt));
      if (hasUnread) {
        markAllCommunicationRead(user.id);
      }
    }
  }, [companyMessages, isOpen, user, markAllCommunicationRead]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMessage(content);
    setContent('');
    isNearBottomRef.current = true;
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      <div 
        className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-white dark:bg-slate-900 shadow-2xl z-50 transition-transform duration-300 transform border-l border-[var(--border)] flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-[var(--primary)]/5 to-[var(--secondary)]/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center shadow-md">
            <MessageSquare size={16} />
          </div>
          <div>
          <div>
            <h3 className="font-bold text-sm text-[var(--text)] leading-tight">{companyName}</h3>
            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              Team Channel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 relative">
          <button onClick={() => setShowProfiles(!showProfiles)} className="p-2 hover:bg-[var(--border)]/50 rounded-lg transition-colors">
            <Users size={16} />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-[var(--border)]/50 rounded-lg transition-colors">
            <X size={18} />
          </button>
          
          {showProfiles && (
            <div className="absolute top-12 right-0 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-3 z-50 animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
              <h4 className="text-xs font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Members</h4>
              <div className="space-y-2">
                {companyMembers.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-[10px] font-bold">
                      {m.name.charAt(0)}
                    </div>
                    <div className="text-sm">
                      <p className="text-[var(--text)] leading-tight">{m.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)] capitalize">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-500/5"
      >
        {companyMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
            <MessageSquare size={40} className="mb-2" />
            <p className="text-xs">No company messages yet.</p>
          </div>
        ) : (
          companyMessages.map((m) => {
            const isMe = m.senderId === user?.id;
            const isAI = m.senderId === 'ai-assistant';
            
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div 
                  className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'} cursor-context-menu`}
                  onContextMenu={(e) => handleContextMenu(e, m.readBy)}
                >
                  {!isMe && (
                    <span className="text-[10px] font-bold text-[var(--text-muted)] mb-1 px-1 flex items-center gap-1">
                      {isAI && <Brain size={10} className="text-[var(--primary)]" />}
                      {m.senderName}
                    </span>
                  )}
                  <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                    isAI ? 'bg-indigo-500 text-white rounded-tl-none border border-white/20' :
                    isMe ? 'bg-[var(--primary)] text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-[var(--text)] rounded-tl-none border border-[var(--border)]'
                  }`}>
                    {renderTextWithLinks(m.content)}
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[9px] text-[var(--text-muted)] opacity-60">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && m.readBy && m.readBy.length > 0 && <CheckCircle2 size={10} className="text-blue-500" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Suggestion Chip */}
      <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {["@ai revenue", "@ai tasks", "@ai team"].map((tag) => (
            <button 
              key={tag}
              onClick={() => setContent(tag + " ")}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold hover:bg-[var(--primary)]/20 transition-colors border border-[var(--primary)]/20"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-[var(--border)] flex gap-2 bg-white dark:bg-slate-900">
        <input 
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type or tag @ai..."
          className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--primary)] transition-all"
        />
        <Button type="submit" size="sm" className="glow-primary shrink-0">
          <Send size={16} />
        </Button>
      </form>

      {contextMenu && (
        <div 
          className="fixed z-[100] bg-[var(--card)] border border-[var(--border)] shadow-xl rounded-lg p-2 min-w-[150px] animate-fade-in"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 100), left: Math.min(contextMenu.x, window.innerWidth - 180) }}
        >
          <div className="text-xs font-bold text-[var(--text-muted)] mb-2 px-1">Read by:</div>
          {contextMenu.readBy.map((userId) => {
            const u = users.find(x => x.id === userId);
            return u ? (
              <div key={userId} className="text-sm px-2 py-1 flex items-center gap-2">
                <CheckCircle2 size={12} className="text-blue-500" /> {u.name}
              </div>
            ) : null;
          })}
        </div>
      )}

    </div>
    </>
  );
}
