import React, { useState, useEffect } from'react';
import { AlertCircle, Briefcase, User, Clock, CheckCircle, Lock, Mail, ArrowRight, Star, Shield, Zap } from 'lucide-react';

const WorkSphereFrontend = () => {
  const [isLandingPage, setIsLandingPage] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [walletConnected, setWalletConnected] = useState(false);
  const [authError, setAuthError] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobBudget, setJobBudget] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [userRole, setUserRole] = useState('');

  const features = [
    {
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      title: "Secure Escrow System",
      description: "Smart contract-based escrow ensures safe payments and milestone tracking"
    },
    {
      icon: <Star className="h-8 w-8 text-blue-500" />,
      title: "Blockchain Reputation",
      description: "Immutable reputation system built on blockchain technology"
    },
    {
      icon: <Zap className="h-8 w-8 text-blue-500" />,
      title: "Real-Time Updates",
      description: "Track project progress and communicate in real-time"
    }
  ];

  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: 'Frontend Developer Needed',
      budget: '0.5 ETH',
      description: 'Looking for a React developer to build a responsive dashboard',
      status: 'Open',
      milestones: ['Design', 'Development', 'Testing'],
    },
    {
      id: 2,
      title: 'Smart Contract Developer',
      budget: '1.2 ETH',
      description: 'Need help developing and auditing smart contracts for DeFi project',
      status: 'In Progress',
      milestones: ['Contract Development', 'Testing', 'Deployment'],
    }
  ]);

  const LandingPage = () => (
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
          {features.map((feature, index) => (
            <div key={index} className="border-none shadow-lg p-6 bg-white rounded-lg">
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-200">Active Freelancers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-blue-200">Completed Projects</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">$2M+</div>
              <div className="text-blue-200">Value Exchanged</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleAuth = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const username = authMode ==='register'? e.target.username?.value : undefined;
    const role = authMode ==='register'? e.target.role?.value : undefined;

    try {
      const response = await fetch(`http://localhost:5000/${authMode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username, role }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setAuthError('');
        setIsLandingPage(false);
        setUserRole(data.role);
        console.log(data.message); // Success message
      } else {
        setAuthError(data.message); // Error message from backend
      }
    } catch (error) {
      setAuthError('An error occurred. Please try again.');
    }
  };

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

  const AuthModal = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');

    const handleAuth = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(`http://localhost:5000/${authMode}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, username, role }),
        });

        const data = await response.json();

        if (response.ok) {
          setIsAuthenticated(true);
          setShowAuthModal(false);
          setAuthError('');
          setIsLandingPage(false);
          setUserRole(data.role);
          console.log(data.message); // Success message
        } else {
          setAuthError(data.message); // Error message from backend
        }
      } catch (error) {
        setAuthError('An error occurred. Please try again.');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-4">{authMode === 'login'? 'Login' : 'Register'}</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode ==='register' && (
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input 
                  type="text"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Enter username" 
                  required 
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                type="email" 
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Enter email" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input 
                type="password" 
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Enter password" 
                required 
              />
            </div>
            {authMode ==='register' && (
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select 
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required 
                >
                  <option value="">Select Role</option>
                  <option value="client">Client</option>
                  <option value="freelancer">Freelancer</option>
                </select>
              </div>
            )}
            {authError && (
              <div className="bg-red-100 text-red-800 p-4 rounded-lg">
                <p>{authError}</p>
              </div>
            )}
            <button 
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {authMode === 'login'? 'Login' : 'Register'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login'?'register' : 'login')}
                className="text-sm text-blue-600 hover:underline"
              >
                {authMode === 'login' 
              ? "Don't have an account? Register" 
                  : "Already have an account? Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

 const MainApp = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobBudget, setJobBudget] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('http://localhost:5000/jobs');
        const data = await response.json();
        setJobs(data);
      } catch (error) {
        console.error(error);
      }
    };
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
          <div className="flex gap-2">
            {isAuthenticated? (
              <button
                className="px-4 py-2 border-2 border-gray-600 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                onClick={() => setIsAuthenticated(false)}
              >
                Logout
              </button>
            ) : (
              <button
                className="px-4 py-2 border-2 border-gray-600 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                onClick={() => setShowAuthModal(true)}
              >
                Login
              </button>
            )}
            <button
              className="px-4 py-2 border-2 border-gray-600 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
              onClick={() => setWalletConnected(!walletConnected)}
            >
              {walletConnected? 'Wallet Connected' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {isAuthenticated? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <button className="flex items-center gap-2 px-6 py-3 border-2 rounded-lg hover:bg-gray-50">
                Browse Jobs
              </button>
              <button className="flex items-center gap-2 px-6 py-3 border-2 rounded-lg hover:bg-gray-50">
                Post a Job
              </button>
              <button className="flex items-center gap-2 px-6 py-3 border-2 rounded-lg hover:bg-gray-50">
                Profile
              </button>
              <button className="flex items-center gap-2 px-6 py-3 border-2 rounded-lg hover:bg-gray-50">
                Milestones
              </button>
            </div>

            <form onSubmit={handlePostJob} className="space-y-4">
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
                  type="text"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
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
        ) : (
          <div className="bg-white p-8 text-center rounded-lg shadow-lg">
            <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">
              Please login or register to access WorkSphere 3.0
            </p>
            <button
              className="px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700"
              onClick={() => setShowAuthModal(true)}
            >
              Login / Register
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

  return (
    <>
      {showAuthModal && <AuthModal />}
      {isLandingPage? <LandingPage /> : <MainApp />}
    </>
  );
};

export default WorkSphereFrontend;