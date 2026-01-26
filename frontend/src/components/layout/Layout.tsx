import { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
  hideNavbar?: boolean;
}

const Layout = ({ children, hideNavbar = false }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        <div className="grid-pattern absolute inset-0 opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {!hideNavbar && <Navbar />}
        <main className={hideNavbar ? '' : 'pt-16'}>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
