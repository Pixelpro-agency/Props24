import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from '../navbar/Navbar';
import { ExpertModeProvider, useExpertMode } from './ExpertModeContext';
import { Menu } from 'lucide-react';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

function LayoutInner({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { expertMode } = useExpertMode();

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden relative">

      {/* Mobile Dark Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/50 z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Desktop and Mobile Slide-In */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 transform lg:transform-none lg:relative bg-[#f5f5f5] transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 lg:border-l lg:border-gray-200 w-full">
        {/* Topbar mobile con hamburger */}
        <header className="lg:hidden flex h-16 shrink-0 items-center justify-between px-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-500 hover:text-gray-700 p-2 -ml-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="font-bold text-lg text-brand-blue tracking-tight">Props24</div>
          <div className="w-6" />
        </header>

        {/* Navbar desktop (visibile solo su lg+) */}
        <Navbar expertMode={expertMode} />

        {/* Content Viewport */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  return (
    <ExpertModeProvider>
      <LayoutInner>{children}</LayoutInner>
    </ExpertModeProvider>
  );
}
