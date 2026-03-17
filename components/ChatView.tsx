
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, ChatMessage } from '../types';
import { Send, Trash2, MessageCircle, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatViewProps {
  user: User;
}

const ChatView: React.FC<ChatViewProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'chat'), 
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messagesData.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      // Reverse to show oldest at top
      setMessages(messagesData.reverse());
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'chat'), {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        text: newMessage.trim(),
        createdAt: new Date().toISOString()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'chat', messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-6 pb-24 animate-in fade-in duration-500">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-cinzel gold-text-gradient font-bold mb-1">GLOBAL CHAT</h1>
        <p className="text-gray-400 text-xs tracking-[0.2em] font-bold">CONNECT WITH OTHER WARRIORS</p>
      </header>

      {/* Chat Container */}
      <div className="flex-1 min-h-0 flex flex-col glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="mx-auto text-gray-700 mb-4" size={48} />
              <p className="text-gray-500 text-sm">The arena is silent. Start the conversation!</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex items-start gap-3 ${msg.userId === user.id ? 'flex-row-reverse' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full border border-[#d4af37]/20 overflow-hidden bg-slate-800 flex-shrink-0">
                    {msg.avatar ? (
                      <img src={msg.avatar} className="w-full h-full object-cover" alt={msg.username} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <UserIcon size={16} />
                      </div>
                    )}
                  </div>
                  
                  <div className={`max-w-[75%] group relative ${msg.userId === user.id ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] font-bold text-[#d4af37] truncate">{msg.username}</span>
                      <span className="text-[8px] text-gray-600">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.userId === user.id 
                        ? 'bg-[#d4af37] text-slate-900 rounded-tr-none' 
                        : 'bg-slate-800 text-white rounded-tl-none border border-slate-700'
                    }`}>
                      {msg.text}
                    </div>

                    {(msg.userId === user.id || user.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className={`absolute -top-1 ${msg.userId === user.id ? '-left-6' : '-right-6'} p-1 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100`}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#d4af37]/50"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newMessage.trim()}
              className="p-3 gold-gradient text-slate-900 rounded-xl shadow-lg hover:scale-105 transition-all transform active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
