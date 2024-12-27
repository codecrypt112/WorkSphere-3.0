import React, { useState, useEffect } from'react';

const MainApp = ({ 
  setIsAuthenticated, 
  setIsLandingPage, 
  setUserRole, 
  setUsername, 
  setEmail, 
  setAuthError, 
  setWalletConnected, 
  walletConnected, 
  userRole, 
  username, 
  email, 
  setJobs, 
  jobs 
}) => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobBudget, setJobBudget] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const fetchJobs = async () => {
    try {
      const response = await fetch('http://localhost:5000/jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: jobTitle, budget: jobBudget, description: jobDescription }),
      });

      const data = await response.json();
      if (response.ok) {
        setJobs([...jobs, data.job]);
        setJobTitle('');
        setJobBudget('');
        setJobDescription('');
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4"> 
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">WorkSphere 3.0</h1>
          <div className="flex items-center gap-4">
            {isAuthenticated? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{username}</span>
                    <span className="text-sm text-gray-600 capitalize">{userRole}</span>
                  </div>
                </div>
                <button
                  className="px-4 py-2 border-2 border-red-600 text-red-600 text-sm rounded-lg hover:bg-red-50"
                  onClick={() => {
                    setIsAuthenticated(false);
                    setUsername('');
                    setUserRole('');
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                className="px-4 py-2 border-2 border-gray-600 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                onClick={() => setIsLandingPage(true)}
              >
                Login
              </button>
            )}
            <button
              className={`px-4 py-2 border-2 ${
                walletConnected 
                ? 'border-green-600 text-green-600 hover:bg-green-50' 
                  : 'border-gray-600 text-gray-600 hover:bg-gray-50'
              } text-sm rounded-lg`}
              onClick={() => setWalletConnected(!walletConnected)}
            >
              {walletConnected? 'Wallet Connected' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>

      {/* Job Posting Form */}
      <div className="max-w-7xl mx-auto mb-8">
        <form onSubmit={handlePostJob} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Enter job title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Job Budget</label>
            <input
              type="number"
              value={jobBudget}
              onChange={(e) => setJobBudget(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Enter job budget"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Enter job description"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Post Job
          </button>
        </form>
      </div>

      {/* Job Listings */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white border rounded-lg shadow-md p-6">
              <div className="flex justify-between mb-4">
                <h3 className="text-xl font-semibold">{job.title}</h3>
                <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {job.budget}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{job.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Status: {job.status}
                </span>
                {job.status === 'Open'? (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Apply Now
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg">
                    Applied
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainApp;