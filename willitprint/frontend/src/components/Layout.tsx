import { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800 bg-gray-950">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-green-500">💎</span>
            <h1 className="text-2xl font-bold">WillItPrint.ai</h1>
            <span className="text-2xl font-bold text-green-500">💥</span>
          </div>
          <div className="text-gray-400 text-sm">
            Your degenerate options whisperer
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="border-t border-gray-800 bg-gray-950 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>This is not financial advice. This is for apes, by apes. 🦍</p>
          <p>Consult a real human if you're betting your house on YOLO calls.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 