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

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const [createdJobsResponse, appliedJobsResponse, ongoingProjectsResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/jobs/created/${account}`),
        axios.get(`http://localhost:5000/api/jobs/applied/${account}`),
        axios.get(`http://localhost:5000/api/projects/ongoing/${account}`)
      ]);

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

  useEffect(() => {
    if (account) {
      fetchMyJobs();
    }
  }, [account]);

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

 const ApplicationModal = ({ job, onClose, fetchMyJobs }) => {
  const [applications, setApplications] = useState([]);
  const [modalLoading, setModalLoading] = useState(true);
  const [milestones, setMilestones] = useState([{ 
    title: '', 
    description: '', 
    deadline: new Date().toISOString().split('T')[0] // Initialize with today's date
  }]);
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [rejectConfirmation, setRejectConfirmation] = useState(false); // State for rejection confirmation

const fetchApplications = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/jobs/${job._id}/applications`);
    
    // Filter out rejected applications
    const activeApplications = response.data.filter(
      application => application.status !== 'rejected'
    );
    
    setApplications(activeApplications);
    setModalLoading(false);
  } catch (err) {
    console.error('Error fetching applications:', err);
    setModalLoading(false);
  }
};

  useEffect(() => {
    fetchApplications();
  }, [job._id]);

  const handleApplicationAction = async (applicationId, action) => {
    try {
      if (action === 'approve') {
        setSelectedApplication(applicationId);
        setConfirmationRequired(true);
      } else if (action === 'reject') {
        setSelectedApplication(applicationId);
        setRejectConfirmation(true); // Show rejection confirmation
      }
    } catch (err) {
      console.error(`Error ${action}ing application:`, err);
    }
  };

 const confirmRejection = async () => {
  if (!selectedApplication) return;

  try {
    const response = await axios.post(`http://localhost:5000/api/jobs/applications/${selectedApplication}/reject`);
    
    // Update the local state to remove the rejected application
    const updatedApplications = applications.filter(app => 
      app._id !== selectedApplication && app.status !== 'rejected'
    );
    
    setApplications(updatedApplications);
    setRejectConfirmation(false);
    setSelectedApplication(null);

    // Refetch applications to ensure consistency
    await fetchApplications();

    // If no more applications, close the modal
    if (updatedApplications.length === 0) {
      onClose();
    }
  } catch (err) {
    console.error('Error rejecting application:', err);
  }
};

  const cancelRejection = () => {
    setRejectConfirmation(false); // Close rejection confirmation dialog
  };

  const confirmMilestones = async () => {
    if (!selectedApplication) return;
    
    try {
      await axios.post(`http://localhost:5000/api/jobs/applications/${selectedApplication}/confirm`, {
        milestones: milestones
      });
      
      await fetchMyJobs(); // Now this will work because fetchMyJobs is passed as a prop
      await fetchApplications();
      setConfirmationRequired(false);
      onClose();
    } catch (err) {
      console.error('Error confirming milestones:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8 relative max-h-[80vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-gray-900">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-6">Applications for {job.title}</h2>

        {modalLoading ? (
          <div className="text-center">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="text-center text-gray-500">No applications yet</div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className=" font-semibold">{application.applicantWallet}</h3>
                    <p className="text-sm mt-1">{application.coverLetter}</p>
                    {application.expectedBudget && (
                      <p className="text-sm mt-1">Expected Budget: ${application.expectedBudget}</p>
                    )}
                    {application.estimatedTime && (
                      <p className="text-sm">Estimated Time: {application.estimatedTime}</p>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => handleApplicationAction(application._id, 'approve')}
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApplicationAction(application._id, 'reject')}
                      className="bg-red-500 text-white px-4 py-2 rounded ml-2"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {confirmationRequired && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Confirm Milestones</h3>
            {milestones.map((milestone, index) => (
              <div key={index} className="flex flex-col mb-4">
                <input
                  type="text"
                  placeholder="Milestone Title"
                  value={milestone.title}
                  onChange={(e) => {
                    const newMilestones = [...milestones];
                    newMilestones[index].title = e.target.value;
                    setMilestones(newMilestones);
                  }}
                  className="border rounded p-2 mb-2"
                />
                <textarea
                  placeholder="Milestone Description"
                  value={milestone.description}
                  onChange={(e) => {
                    const newMilestones = [...milestones];
                    newMilestones[index].description = e.target.value;
                    setMilestones(newMilestones);
                  }}
                  className="border rounded p-2 mb-2"
                />
                <input
                  type="date"
                  value={milestone.deadline}
                  onChange={(e) => {
                    const newMilestones = [...milestones];
                    newMilestones[index].deadline = e.target.value;
                    setMilestones(newMilestones);
                  }}
                  className="border rounded p-2"
                />
              </div>
            ))}
            <button
              onClick={() => setMilestones([...milestones, { 
                title: '', 
                description: '', 
                deadline: new Date().toISOString().split('T')[0]
              }])}
              className="bg-green-200 text-green-800 px-4 py-2 rounded mb-4"
            >
              Add Another Milestone
            </button>
            {milestones.length > 1 && (
              <div className="mb-4">
                {milestones.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const newMilestones = milestones.filter((_, i) => i !== index);
                      setMilestones(newMilestones);
                    }}
                    className="bg-red-200 text-red-800 px-4 py-2 rounded mr-2"
                  >
                    Remove Milestone {index + 1}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={confirmMilestones}
              className="bg-green-500 text-white px-4 py-2 rounded mt-4"
            >
              Confirm Milestones
            </button>
          </div>
        )}

        {rejectConfirmation && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Confirm Rejection</h3>
            <p>Are you sure you want to reject this application?</p>
            <div className="mt-4">
              <button
                onClick={confirmRejection}
                className="bg-red-500 text-white px-4 py-2 rounded mr-2"
              >
                Yes, Reject
              </button>
              <button
                onClick={cancelRejection}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
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
        <button 
          onClick={() => setActiveTab('ongoing')}
          className={`flex-1 py-2 text-center ${activeTab === 'ongoing' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Ongoing Projects
        </button>
      </div>

      {loading ? (
        <div className="text-center">Loading jobs...</div>
      ) : (
        <div>
          {activeTab === 'created' && myJobs.created.length > 0 ? (
            myJobs.created.map((job) => (
              <div key={job._id} className="border rounded-lg p-4 mb-4">
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-sm">{job.description}</p>
                <button 
                  onClick={() => setSelectedJob(job)}
                  className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                >
                  View Applications
                </button>
              </div>
            ))
          ) : activeTab === 'applied' && myJobs.applied.length > 0 ? (
            myJobs.applied.map((job) => (
              <div key={job._id} className="border rounded-lg p-4 mb-4">
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-sm">Application Status: {renderApplicationStatus(job.applicationStatus)}</p>
              </div>
            ))
          ) : activeTab === 'ongoing' && myJobs.ongoingProjects.length > 0 ? (
            myJobs.ongoingProjects.map((project) => (
              <div key={project._id} className="border rounded-lg p-4 mb-4">
                <h3 className="font-semibold">{project.title}</h3>
                <p className="text-sm">{project.description}</p>
                <div className="mt-2">
                  <p className="text-sm font-medium">Client: {project.creatorWallet}</p>
                  <p className="text-sm">Started: {new Date(project.applicationDetails.appliedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">
              No {activeTab === 'ongoing' ? 'ongoing projects' : `${activeTab} jobs`} yet
            </div>
          )}
        </div>
      )}

      {selectedJob && (
        <ApplicationModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
          fetchMyJobs={fetchMyJobs} 
        />
      )}
    </div>
  );
};

export default MyJobs;