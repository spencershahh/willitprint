import { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-dark-700 text-white flex flex-col">
      <header className="border-b border-gray-800/30 bg-dark-800/80 backdrop-blur-xl sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-500">💎</span>
            <h1 className="text-2xl font-bold gradient-text">WillItPrint.ai</h1>
          </div>
          <div className="text-gray-400 text-sm hidden md:flex items-center space-x-6">
            <a href="#" className="hover:text-primary-400 transition-colors duration-200">Features</a>
            <a href="#" className="hover:text-primary-400 transition-colors duration-200">Reviews</a>
            <a href="#" className="hover:text-primary-400 transition-colors duration-200">FAQ</a>
            <button className="bg-primary-600 hover:bg-primary-500 px-5 py-2.5 rounded-full text-white transition-all duration-200 shadow-lg shadow-primary-900/20 font-medium text-sm">
              Download App
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 flex-1 flex flex-col">
        {children}
      </main>
      
      <footer className="border-t border-gray-800/30 bg-dark-800/90 backdrop-blur-lg mt-auto">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <span className="text-2xl font-bold text-primary-500">💎</span>
              <h1 className="text-2xl font-bold gradient-text">WillItPrint.ai</h1>
            </div>
            <div className="text-gray-400 text-sm flex flex-wrap justify-center space-x-8">
              <a href="#" className="hover:text-primary-400 transition-colors duration-200 mb-2">Terms</a>
              <a href="#" className="hover:text-primary-400 transition-colors duration-200 mb-2">Privacy</a>
              <a href="#" className="hover:text-primary-400 transition-colors duration-200 mb-2">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>This is not financial advice. This is for apes, by apes. 🦍</p>
            <p>Consult a real human if you're betting your house on YOLO calls.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 