import React, { useState } from 'react';
import CreateJobPosting from './CreateJobPosting';
import JobList from './JobList';
import MyJobs from './MyJobs';

const Dashboard = ({ account }) => {
  const [activeView, setActiveView] = useState('jobs');

  const renderContent = () => {
    switch(activeView) {
      case 'create':
        return (
          <div>
            <button 
              onClick={() => setActiveView('jobs')}
              className="mb-4 text-blue-500 hover:text-blue-700 flex items-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" 
                  clipRule="evenodd" 
                />
              </svg>
              Back to Jobs
            </button>
            <CreateJobPosting account={account} />
          </div>
        );
      case 'myJobs':
        return (
          <div>
            <button 
              onClick={() => setActiveView('jobs')}
              className="mb-4 text-blue-500 hover:text-blue-700 flex items-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" 
                  clipRule="evenodd" 
                />
              </svg>
              Back to Jobs
            </button>
            <MyJobs account={account} />
          </div>
        );
      case 'jobs':
      default:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold">Dashboard</h2>
            </div>
            <div className="mb-4">
              <p className="mb-4">Welcome!</p>
              <p className="text-sm text-gray-600 break-all">
                Connected Account: {account}
              </p>
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={() => setActiveView('create')}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Create New Job
              </button>
              <button 
                onClick={() => setActiveView('myJobs')}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                My Jobs
              </button>
            </div>

            <JobList account={account} />
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-20">
      {renderContent()}
    </div>
  );
};

export default Dashboard;