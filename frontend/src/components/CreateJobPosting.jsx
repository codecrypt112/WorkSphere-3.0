import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Web3 } from 'web3';

const CreateJobPosting = ({ account }) => {
  const [jobDetails, setJobDetails] = useState({
    title: '',
    description: '',
    skills: [],
    budget: '',
    deadline: '',
    category: ''
  });

  const [currentSkill, setCurrentSkill] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    'Web Development',
    'Graphic Design',
    'Writing',
    'Marketing',
    'Video Editing',
    'Data Entry',
    'Translation',
    'Other'
  ];

  // Validate account prop
  useEffect(() => {
    if (!account) {
      setError('Please connect your wallet first');
    }
  }, [account]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSkill = () => {
    if (currentSkill.trim() && !jobDetails.skills.includes(currentSkill.trim())) {
      setJobDetails(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setJobDetails(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Check if account is available
  if (!account) {
    setError('Please connect your wallet first');
    return;
  }

  setIsLoading(true);
  setError(null);

  // Validation
  if (!jobDetails.title || !jobDetails.description || !jobDetails.category) {
    setError('Please fill in all required fields');
    setIsLoading(false);
    return;
  }

  try {
    // Prepare job details for submission
    const submissionData = {
      ...jobDetails,
      creatorWallet: account  // Explicitly add creatorWallet
    };

    // Log the submission data for debugging
    console.log('Submission Data:', submissionData);

    // Submit to backend with full error logging
    const backendResponse = await axios.post(
      'http://localhost:5000/api/jobs/create', 
      submissionData, 
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Success handling
    alert('Job Posted Successfully!');
    
    // Reset form
    setJobDetails({
      title: '',
      description: '',
      skills: [],
      budget: '',
      deadline: '',
      category: ''
    });

  } catch (error) {
    // Detailed error logging
    console.error('Full error object:', error);
    
    // More specific error handling
    if (error.response) {
      console.error('Backend error response:', error.response.data);
      setError(error.response.data.error || 'Failed to post job');
    } else if (error.request) {
      console.error('No response received:', error.request);
      setError('No response from server. Check your network connection.');
    } else {
      console.error('Error setting up request:', error.message);
      setError(error.message);
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="w-full max-w-xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-md">
      {!account && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
          Please connect your wallet to create a job posting
        </div>
      )}
      <h2 className="text-2xl font-bold mb-6 text-center">Create Job Posting</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
        <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={jobDetails.title}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="e.g. React Developer Needed"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={jobDetails.description}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="4"
            placeholder="Describe the job requirements and expectations"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={jobDetails.category}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Required Skills
          </label>
          <div className="flex">
            <input
              type="text"
              value={currentSkill}
              onChange={(e) => setCurrentSkill(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Add skills (e.g. React, Node.js)"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap mt-2">
            {jobDetails.skills.map((skill, index) => (
              <span 
                key={index} 
                className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 mt-2 px-2.5 py-0.5 rounded flex items-center"
              >
                {skill}
                <button 
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-2 text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex mb-4">
          <div className="w-1/2 mr-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Budget ($)
            </label>
            <input
              type="number"
              name="budget"
              value={jobDetails.budget}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Budget"
            />
          </div>
          <div className="w-1/2 ml-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Deadline
            </label>
            <input
              type="date"
              name="deadline"
              value={jobDetails.deadline}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        
<div className="text-center">
          <button
            type="submit"
            disabled={isLoading}
            className={`
              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-700'}
              text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline
            `}
          >
            {isLoading ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateJobPosting;