import React from 'react';

interface LoginButtonProps {
  onClick: () => void;
  isLoading: boolean;
  text: string;
  loadingText: string;
}

const LoginButton: React.FC<LoginButtonProps> = ({
  onClick,
  isLoading,
  text,
  loadingText
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl
               shadow-lg hover:shadow-xl transform transition-all duration-300 ease-in-out
               hover:scale-105 hover:from-purple-600 hover:to-purple-700
               focus:outline-none focus:ring-4 focus:ring-purple-400/50
               disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
               ${isLoading ? 'animate-pulse' : ''}`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          {loadingText}
        </div>
      ) : (
        text
      )}
    </button>
  );
};

export default LoginButton;