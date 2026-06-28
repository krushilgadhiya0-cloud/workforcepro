import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, Sparkles, Brain } from 'lucide-react';
import { useData, useCurrentUser } from '../../contexts/DataContext';
import { Button } from '../ui/Button';
import { renderTextWithLinks } from '../../utils/text';

interface SideCommunicationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideCommunication({ isOpen, onClose }: SideCommunicationProps) {
  const { getCompanyMessages, sendMessage, companies, markAllCommunicationRead } = useData();
  const user = useCurrentUser();
  const [content, setContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const targetCompanyId = user?.companyId || (user?.role === 'owner' ? companies.find(c => c.ownerId === user.id)?.id : null);
  const companyMessages = targetCompanyId ? getCompanyMessages(targetCompanyId) : [];

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
            <h3 className="font-bold text-sm text-[var(--text)] leading-tight">Team Chat</h3>
            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles size={10} className="text-amber-500" /> AI Enabled
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-[var(--border)]/50 rounded-lg transition-colors">
          <X size={18} />
        </button>
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
                <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
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
                  <span className="text-[9px] text-[var(--text-muted)] mt-1 px-1 opacity-60">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
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
    </div>
  );
}
