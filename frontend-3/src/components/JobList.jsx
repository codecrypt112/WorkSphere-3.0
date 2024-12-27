import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JobDetailsModal from './JobDetailsModal';

const JobList = ({ account }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null); // State to manage selected job for details
  
    useEffect(() => {
    fetchJobs();
    }, [account, filter]);
    
    const handleViewDetails = (job) => {
    setSelectedJob(job);
    };
    
    const handleJobApplication = (applicationResponse) => {
    // You can update the UI or show a success message
    console.log('Application submitted:', applicationResponse);
    };
    
    const handleCloseDetails = () => {
    setSelectedJob(null);
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = 'http://localhost:5000/api/jobs';
      
      // Add filter if needed
      if (filter !== 'all') {
        url += `?filter=${filter}`;
      }

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Detailed logging
      console.log('Jobs Fetch Response:', response.data);

      // Validate response data
      if (Array.isArray(response.data)) {
        setJobs(response.data);
      } else {
        throw new Error('Invalid response format');
      }

      setLoading(false);
    } catch (err) {
      // Comprehensive error logging
      console.error('Job Fetch Error:', err);

      // Detailed error handling
      if (err.response) {
        // Server responded with an error status
        console.error('Server Response Error:', err.response.data);
        setError(`Server Error: ${err.response.status} - ${err.response.data.error || 'Unknown error'}`);
      } else if (err.request) {
        // Request made but no response received
        console.error('No Response Received:', err.request);
        setError('No response from server. Check your network connection.');
      } else {
        // Error in setting up the request
        console.error('Request Setup Error:', err.message);
        setError(`Error: ${err.message}`);
      }

      setLoading(false);
    }
  };

  // Render methods
  const renderLoadingState = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
    </div>
  );

  const renderErrorState = () => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{error}</span>
    </div>
  );

  const renderJobCard = (job) => (
    <div 
      key={job._id} 
      className="bg-white shadow-md rounded-lg p-6 mb-4 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
          <p className="text-gray-600 mt-2">
            {job.description ? job.description.slice(0, 150) + '...' : 'No description'}
          </p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
          {job.category || 'Uncategorized'}
        </span>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 text-sm">
            {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'No date'} </span>
        </div>
        <button 
          onClick={() => handleViewDetails(job)} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          View Details
        </button>
      </div>
    </div>
  );

    return (
    <div className="container mx-auto p-4">
      {loading && renderLoadingState()}
      {error && renderErrorState()}
      {!loading && !error && (
        <div>
          {jobs.length > 0 ? (
            jobs.map(renderJobCard)
          ) : (
            <div className="text-center text-gray-500">No jobs available.</div>
          )}
        </div>
      )}
      {selectedJob && (
                <JobDetailsModal 
          accountAddress={account}
          job={selectedJob} 
          onClose={handleCloseDetails} 
          onApply={handleJobApplication} 
        />
      )}
    </div>
  );
};

export default JobList;