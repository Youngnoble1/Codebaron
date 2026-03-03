
import React from 'react';
import { NAV_ITEMS, GOLD_COLOR } from '../constants';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 nav-blur border-t border-yellow-500/10 px-6 py-4 flex justify-around items-center z-50">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            activeTab === item.id 
              ? 'text-[#d4af37] scale-110' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {item.icon}
          <span className="text-[10px] uppercase font-bold tracking-widest">{item.label}</span>
          {activeTab === item.id && (
            <div className="w-1 h-1 rounded-full bg-[#d4af37] mt-1" />
          )}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
