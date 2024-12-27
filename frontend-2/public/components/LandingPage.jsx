import React from 'react';
import { ArrowRight } from 'lucide-react';

const LandingPage = ({ setIsLandingPage, setShowAuthModal }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            WorkSphere 3.0
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Revolutionary Web3-powered freelancing platform for the future of work
          </p>
          <div className="flex justify-center gap-4">
            <button 
              className="px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700"
              onClick={() => setIsLandingPage(false)}
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
            <button 
              className="px-6 py-3 border-2 border-blue-600 text-blue-600 text-lg font-semibold rounded-lg hover:bg-blue-50"
              onClick={() => setShowAuthModal(true)}
            >
              Login
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Features will be passed as props */}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2"></div>
              <div className="text-blue-200">Active Freelancers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2"></div>
              <div className="text-blue-200">Completed Projects</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2"></div>
              <div className="text-blue-200">Value Exchanged</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;