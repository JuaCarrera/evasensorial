import React from 'react';

interface BackgroundLayoutProps {
  children: React.ReactNode;
}

const BackgroundLayout: React.FC<BackgroundLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Pattern 
      
      <div className="absolute inset-0 bg-black/20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)`
        }}></div>
      </div>
*/}
      {children}
    </div>
  );
};

export default BackgroundLayout;