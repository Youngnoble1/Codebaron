
import React, { useState } from 'react';
import { ICONS, GOLD_COLOR, ACADEMIC_SUBJECTS, JSSCE_SUBJECTS } from '../constants';

const TEXTBOOKS = [
  { id: 'math-jss', title: 'Mathematics for Junior Secondary', subject: 'Mathematics', level: 'JSS', url: 'https://www.oercommons.org/courses/mathematics-for-junior-secondary-school/view' },
  { id: 'eng-jss', title: 'English Studies for JSS', subject: 'English Studies', level: 'JSS', url: 'https://www.oercommons.org/courses/english-studies-for-junior-secondary-school/view' },
  { id: 'sci-jss', title: 'Intermediate Science JSS', subject: 'Intermediate Science', level: 'JSS', url: 'https://www.oercommons.org/courses/basic-science-for-junior-secondary-school/view' },
  { id: 'math-ss', title: 'Senior Secondary Mathematics', subject: 'Mathematics', level: 'SS', url: 'https://www.oercommons.org/courses/mathematics-for-senior-secondary-school/view' },
  { id: 'phy-ss', title: 'Physics for Senior Secondary', subject: 'Physics', level: 'SS', url: 'https://www.oercommons.org/courses/physics-for-senior-secondary-school/view' },
  { id: 'chem-ss', title: 'Chemistry for Senior Secondary', subject: 'Chemistry', level: 'SS', url: 'https://www.oercommons.org/courses/chemistry-for-senior-secondary-school/view' },
  { id: 'bio-ss', title: 'Biology for Senior Secondary', subject: 'Biology', level: 'SS', url: 'https://www.oercommons.org/courses/biology-for-senior-secondary-school/view' },
  { id: 'hist-nig', title: 'Nigerian History & Culture', subject: 'Nigerian History', level: 'General', url: 'https://www.oercommons.org/courses/nigerian-history-and-culture/view' },
];

const LibraryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'JSS' | 'SS'>('All');

  const filteredBooks = TEXTBOOKS.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         book.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || book.level === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#050b18] text-white p-6 pb-24 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-cinzel font-bold gold-text-gradient mb-2">Academic Library</h1>
        <p className="text-gray-400 text-sm">Download official textbooks and study materials.</p>
      </header>

      <div className="flex flex-col gap-4 mb-8">
        <div className="relative">
          <ICONS.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search textbooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-4 pl-12 pr-4 focus:border-[#d4af37] focus:outline-none transition-all"
          />
        </div>

        <div className="flex gap-2">
          {['All', 'JSS', 'SS'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all border ${
                filter === f 
                  ? 'bg-[#d4af37] text-slate-900 border-[#d4af37]' 
                  : 'bg-slate-900 text-gray-400 border-slate-800 hover:border-gray-600'
              }`}
            >
              {f === 'All' ? 'All Levels' : f + ' Level'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBooks.map((book) => (
          <div key={book.id} className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-[#d4af37]/30 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 group-hover:scale-110 transition-transform">
                <ICONS.Library className="w-6 h-6 text-[#d4af37]" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${
                book.level === 'JSS' ? 'border-rose-500/30 text-rose-400' : 'border-blue-500/30 text-blue-400'
              }`}>
                {book.level}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-1 group-hover:text-[#d4af37] transition-colors">{book.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{book.subject}</p>
            
            <a 
              href={book.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-[#d4af37] hover:text-slate-900 text-[#d4af37] font-bold rounded-xl transition-all border border-[#d4af37]/20"
            >
              <ICONS.Download className="w-4 h-4" />
              DOWNLOAD PDF
            </a>
          </div>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-20">
          <ICONS.AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No textbooks found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default LibraryView;
