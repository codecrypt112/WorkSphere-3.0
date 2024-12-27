import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyJobs = ({ account }) => {
  const [myJobs, setMyJobs] = useState({
    created: [],
    applied: [],
    ongoingProjects: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState('created');

  useEffect(() => {
    fetchMyJobs();
  }, [account]);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      // Fetch created jobs
      const createdJobsResponse = await axios.get(`http://localhost:5000/api/jobs/created/${account}`);
      // Fetch applied jobs
      const appliedJobsResponse = await axios.get(`http://localhost:5000/api/jobs/applied/${account}`);
      // Fetch ongoing projects
      const ongoingProjectsResponse = await axios.get(`http://localhost:5000/api/projects/ongoing/${account}`);

      setMyJobs({
        created: createdJobsResponse.data,
        applied: appliedJobsResponse.data,
        ongoingProjects: ongoingProjectsResponse.data
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to fetch jobs');
      setLoading(false);
    }
  };

  const handleViewApplications = (job) => {
    setSelectedJob(job);
  };

  const renderApplicationStatus = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const ApplicationModal = ({ job, onClose }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchApplications = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/jobs/${job._id}/applications`);
          setApplications(response.data);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching applications:', err);
          setLoading(false);
        }
      };

      fetchApplications();
    }, [job._id]);

    const handleApplicationAction = async (applicationId, action) => {
      try {
        await axios.post(`http://localhost:5000/api/jobs/applications/${applicationId}/${action}`);
        // Refresh applications
        fetchApplications();
      } catch (err) {
        console.error(`Error ${action} application:`, err);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8 relative max-h-[80vh] overflow-y-auto">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>

          <h2 className="text-2xl font-bold mb-6">Applications for {job.title}</h2>

          {loading ? (
            <div className="text-center">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="text-center text-gray-500">No applications yet</div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div 
                  key={application._id} 
                  className="border rounded-lg p-4 flex justify-between items-center"
                >
 <div>
                    <h3 className="font-semibold">{application.applicantWallet}</h3>
                    <p className="text-sm">{application.coverLetter}</p>
                    {renderApplicationStatus(application.status)}
                  </div>
                  <div>
                    <button 
                      onClick={() => handleApplicationAction(application._id, 'approve')}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleApplicationAction(application._id, 'reject')}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">My Jobs</h2>
      <div className="flex mb-4">
        <button 
          onClick={() => setActiveTab('created')}
          className={`flex-1 py-2 text-center ${activeTab === 'created' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Created Jobs
        </button>
        <button 
          onClick={() => setActiveTab('applied')}
          className={`flex-1 py-2 text-center ${activeTab === 'applied' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Applied Jobs
        </button>
      </div>

      {loading ? (
        <div className="text-center">Loading my jobs...</div>
      ) : (
        <div>
          {activeTab === 'created' && myJobs.created.length > 0 ? (
            myJobs.created.map((job) => (
              <div key={job._id} className="border rounded-lg p-4 mb-4">
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-sm">{job.description}</p>
                <button 
                  onClick={() => handleViewApplications(job)}
                  className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                >
                  View Applications
                </button>
              </div>
            ))
          ) : activeTab === 'created' ? (
            <div className="text-center text-gray-500">No created jobs yet</div>
          ) : myJobs.applied.length > 0 ? (
            myJobs.applied.map((job) => (
              <div key={job._id} className="border rounded-lg p-4 mb-4">
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-sm">Application Status: {renderApplicationStatus(job.applicationStatus)}</p>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">No applied jobs yet</div>
          )}
        </div>
      )}

      {selectedJob && (
        <ApplicationModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  );
};

export default MyJobs;