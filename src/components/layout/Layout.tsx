import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from '../navbar/Navbar';
import { ExpertModeProvider, useExpertMode } from './ExpertModeContext';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

function LayoutInner({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { expertMode } = useExpertMode();

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white">
      <Navbar
        expertMode={expertMode}
        isMobileMenuOpen={isMobileMenuOpen}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      <div className="relative flex min-h-0 flex-1">
        {isMobileMenuOpen && (
          <button
            type="button"
            aria-label="Chiudi menu principale"
            className="absolute inset-0 z-40 bg-slate-900/50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div className={clsx(
          'absolute inset-y-0 left-0 z-50 transform bg-[#f5f5f5] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}>
          <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
        </div>

        <main className="min-w-0 flex-1 overflow-auto bg-gray-50">
          <div className="p-4 sm:p-8">{children}</div>
        </main>
      </div>
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
