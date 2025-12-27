
import React from 'react';

interface ApiKeyGuardProps {
  onKeySelected: () => void;
}

const ApiKeyGuard: React.FC<ApiKeyGuardProps> = ({ onKeySelected }) => {
  const handleOpenKeySelector = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Per instructions, assume success after triggering the dialog to avoid race conditions
      onKeySelected();
    } catch (error) {
      console.error("Failed to open key selector", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-slate-100">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">API Key Required</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Gemini 3 Pro Image Preview requires a paid API key from a Google Cloud project. 
          Please select your key to continue.
        </p>
        <div className="space-y-4">
          <button
            onClick={handleOpenKeySelector}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-blue-500/30"
          >
            Select API Key
          </button>
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-slate-500 hover:text-blue-600 transition-colors"
          >
            Learn more about billing & requirements
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyGuard;
