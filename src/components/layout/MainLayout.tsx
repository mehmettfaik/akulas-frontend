import React, { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center h-14 bg-white border-b border-gray-200 px-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-3 text-lg font-bold text-gray-900">Akulas</span>
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-4 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
