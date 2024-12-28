import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import FundProject from './FundProject';

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
  const [fundingProject, setFundingProject] = useState(null); // State to manage funding project

const fetchMyJobs = async () => {
    try {
        setLoading(true);
        
        // Ensure the account is a valid Ethereum address
        if (!account || !account.startsWith('0x')) {
            console.error('Invalid account address');
            setError('Invalid wallet address');
            setLoading(false);
            return;
        }

        // Use Promise.all to fetch data concurrently
        const [createdJobsResponse, appliedJobsResponse, ongoingProjectsResponse] = await Promise.all([
            axios.get(`http://localhost:5000/api/jobs/created/${account}`),
            axios.get(`http://localhost:5000/api/jobs/applied/${account}`),
            axios.get(`http://localhost:5000/api/projects/ongoing/${account}`)
        ]);

        // Normalize project IDs and fetch milestones
        const ongoingProjects = await Promise.all(ongoingProjectsResponse.data.map(async (project) => {
            // Ensure we have a consistent ID format
            const projectId = project._id.$oid || project._id;
            
            console.log("Fetching milestones for project:", {
                originalProject: project,
                projectId: projectId
            });

            try {
                const milestonesResponse = await axios.get(
                    `http://localhost:5000/api/projects/${projectId}/milestones`
                );

                return {
                    ...project,
                    milestones: milestonesResponse.data,
                    _id: projectId
                };
            } catch (error) {
                console.error(`Error fetching milestones for project ${projectId}:`, error);
                
                // Return the project without milestones
                return {
                    ...project,
                    milestones: [],
                    _id: projectId
                };
            }
        }));

        setMyJobs({
            created: createdJobsResponse.data,
            applied: appliedJobsResponse.data,
            ongoingProjects: ongoingProjects
        });
        
        setError(null); // Clear any previous errors
    } catch (error) {
        console.error("Error fetching jobs:", error);
        
        // More detailed error handling
        if (error.response) {
            console.error('Error response:', error.response.data);
            console.error('Error status:', error.response.status);
            setError(`Failed to fetch jobs: ${error.response.data.message || 'Server error'}`);
        } else if (error.request) {
            console.error('No response received:', error.request);
            setError('No response from server. Please check your network connection.');
        } else {
            console.error('Error setting up request:', error.message);
            setError(`Error: ${error.message}`);
        }
    } finally {
        setLoading(false);
    }
};
  
useEffect(() => {
    // Only fetch if account is a valid Ethereum address
    if (account && account.startsWith('0x')) {
        fetchMyJobs();
    } else {
        // Reset state or show an error
        setMyJobs({
            created: [],
            applied: [],
            ongoingProjects: []
        });
        setError('Invalid wallet address');
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

 const toggleMilestoneStatus = async (projectId, milestoneIndex) => {
    try {
        // Normalize the project ID
        const normalizedProjectId = 
            (typeof projectId === 'object' && projectId.$oid) ? 
            projectId.$oid : 
            projectId;

        console.log("Normalizing project ID:", {
            originalId: projectId,
            normalizedId: normalizedProjectId
        });

        // Find the project in the local state
        const projectToUpdate = myJobs.ongoingProjects.find(p => 
            p._id === normalizedProjectId || 
            (p._id.$oid && p._id.$oid === normalizedProjectId)
        );
        
        if (!projectToUpdate) {
            console.error("Project not found in local state:", normalizedProjectId);
            return;
        }

        // Create a deep copy of the milestones
        const updatedMilestones = projectToUpdate.milestones.map((milestone, index) => {
            if (index === milestoneIndex) {
                return { 
                    ...milestone, 
                    status: milestone.status === "done" ? "not done" : "done" 
                }; 
            }
            return milestone;
        });

        // Send update to backend
        const response = await axios.patch(
            `http://localhost:5000/api/projects/${normalizedProjectId}/milestones`, 
            { milestones: updatedMilestones },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        // Update local state
        const updatedProjects = myJobs.ongoingProjects.map(project => 
            (project._id === normalizedProjectId || 
             (project._id.$oid && project._id.$oid === normalizedProjectId))
                ? { ...project, milestones: updatedMilestones }
                : project
        );

        setMyJobs(prevState => ({ 
            ...prevState, 
            ongoingProjects: updatedProjects 
        }));

        console.log('Update response:', response.data);

    } catch (error) {
        console.error("Error updating milestone status:", error);
        
        // More detailed error logging
        if (error.response) {
            console.error('Detailed Error:', {
                data: error.response.data,
                status: error.response.status,
                headers: error.response.headers
            });
        }

        // Optionally show user-friendly error message
        alert(
            error.response?.data?.error || 
            error.response?.data?.details || 
            "Failed to update milestone"
        );

        // Revert local state and refresh data
        await fetchMyJobs();
    }
};

const MilestoneRenderer = ({ project, account, toggleMilestoneStatus, fetchMyJobs }) => {
  // Move the useState hooks here, inside a proper React component
  const [submissionLink, setSubmissionLink] = useState(project.submissionLink || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize the milestones check
  const allMilestonesCompleted = useMemo(() => 
    Array.isArray(project.milestones) && 
    project.milestones.every(milestone => milestone.status === 'done'),
    [project.milestones]
  );

  // Memoize the project creator check
  const isProjectCreator = useMemo(() => 
    project.creatorWallet === account, 
    [project.creatorWallet, account]
  );

  const handleSubmitLink = useCallback(async () => {
    if (!submissionLink.trim()) {
      alert('Please enter a valid submission link');
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.patch(`http://localhost:5000/api/projects/${project._id}/submit`, {
        submissionLink: submissionLink
      });

      await fetchMyJobs();
      
      alert('Submission link uploaded successfully');
    } catch (error) {
      console.error('Error submitting link:', error);
      alert('Failed to submit link');
    } finally {
      setIsSubmitting(false);
    }
  }, [submissionLink, project._id, fetchMyJobs]);

  const handleFinishProject = useCallback(async () => {
    try {
      await axios.patch(`http://localhost:5000/api/projects/${project._id}/finish`);
      
      await fetchMyJobs();
      
      alert('Project marked as completed');
    } catch (error) {
      console.error('Error finishing project:', error);
      alert('Failed to finish project');
    }
  }, [project._id, fetchMyJobs]);

  return (
    <div>
      <h4 className="font-medium">Milestones</h4>
      {Array.isArray(project.milestones) && project.milestones.map((milestone, index) => (
        <div key={`milestone-${project._id}-${index}`} className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={milestone.status === 'done'}
            onChange={() => toggleMilestoneStatus(project._id, index)}
            className="mr-2"
          />
          <div>
            <p className="font-semibold">{milestone.title || 'Unnamed Milestone'}</p>
            <p className="text-sm text-gray-600">{milestone.description || 'No description'}</p>
            {milestone.deadline && (
              <p className="text-xs text-gray-400">
                Deadline: {new Date(milestone.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Submission Link Section for Applicant */}
      {allMilestonesCompleted && project.applicantWallet === account && (
        <div className="mt-4 border-t pt-4">
          <h4 className="font-medium mb-2">Project Submission</h4>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={submissionLink}
              onChange={(e) => setSubmissionLink(e.target.value)}
              placeholder="Enter Skynet/IPFS link for project files"
              className="flex-grow border rounded p-2"
            />
            <button
              onClick={handleSubmitLink}
              disabled={isSubmitting}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Finish Project Button for Creator */}
      {allMilestonesCompleted && isProjectCreator && project.submissionLink && (
        <div className="mt-4 border-t pt-4">
          <h4 className="font-medium mb-2">Project Completion</h4>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-600">
              Submission Link: 
              <a 
                href={project.submissionLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ml-2 text-blue-500 underline"
              >
                View Submission
              </a>
            </p>
            <button
              onClick={handleFinishProject}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Finish Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
  
const renderMilestones = (project, account) => {
  // Ensure milestones exist and is an array
  const projectMilestones = Array.isArray(project.milestones) ? project.milestones : [];
  
  // Check if all milestones are completed
  const allMilestonesCompleted = projectMilestones.every(milestone => milestone.status === 'done');
  
  // Determine if the current user is the project creator
  const isProjectCreator = project.creatorWallet === account;

  // State for submission link
  const [submissionLink, setSubmissionLink] = useState(project.submissionLink || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitLink = async () => {
    if (!submissionLink.trim()) {
      alert('Please enter a valid submission link');
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.patch(`http://localhost:5000/api/projects/${project._id}/submit`, {
        submissionLink: submissionLink
      });

      // Optionally refresh the project data
      await fetchMyJobs();
      
      alert('Submission link uploaded successfully');
    } catch (error) {
      console.error('Error submitting link:', error);
      alert('Failed to submit link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishProject = async () => {
    try {
      await axios.patch(`http://localhost:5000/api/projects/${project._id}/finish`);
      
      // Refresh jobs to update project status
      await fetchMyJobs();
      
      alert('Project marked as completed');
    } catch (error) {
      console.error('Error finishing project:', error);
      alert('Failed to finish project');
    }
  };

  return (
    <div>
      <h4 className="font-medium">Milestones</h4>
      {projectMilestones.map((milestone, index) => (
        <div key={`milestone-${project._id}-${index}`} className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={milestone.status === 'done'}
            onChange={() => toggleMilestoneStatus(project._id, index)}
            className="mr-2"
          />
          <div>
            <p className="font-semibold">{milestone.title || 'Unnamed Milestone'}</p>
            <p className="text-sm text-gray-600">{milestone.description || 'No description'}</p>
            {milestone.deadline && (
              <p className="text-xs text-gray-400">
                Deadline: {new Date(milestone.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Submission Link Section for Applicant */}
      {allMilestonesCompleted && project.applicantWallet === account && (
        <div className="mt-4 border-t pt-4">
          <h4 className="font-medium mb-2">Project Submission</h4>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={submissionLink}
              onChange={(e) => setSubmissionLink(e.target.value)}
              placeholder="Enter Skynet/IPFS link for project files"
              className="flex-grow border rounded p-2"
            />
            <button
              onClick={handleSubmitLink}
              disabled={isSubmitting}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Finish Project Button for Creator */}
      {allMilestonesCompleted && isProjectCreator && project.submissionLink && (
        <div className="mt-4 border-t pt-4">
          <h4 className="font-medium mb-2">Project Completion</h4>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-600">
              Submission Link: 
              <a 
                href={project.submissionLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ml-2 text-blue-500 underline"
              >
                View Submission
              </a>
            </p>
            <button
              onClick={handleFinishProject}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Finish Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

  const ApplicationModal = ({ job, onClose, fetchMyJobs }) => {
    const [applications, setApplications] = useState([]);
    const [modalLoading, setModalLoading] = useState(true);
    const [milestones, setMilestones] = useState([{ 
      title: '', 
      description: '', 
      deadline: new Date().toISOString().split('T')[0], // Initialize with today's date
      status: 'not set'
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
        await axios.post(`http://localhost:5000/api/jobs/applications/${selectedApplication}/reject`);
        
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

        // Set the funding project to the ongoing project created
        const ongoingProjectResponse = await axios.get(`http://localhost:5000/api/projects/ongoing/${account}`);
        const ongoingProject = ongoingProjectResponse.data.find(project => project.jobId === job._id);
        setFundingProject(ongoingProject); // Set the project to fund

        await fetchMyJobs(); // Now this will work because fetchMyJobs is passed as a prop
        await fetchApplications();
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
                      <h3 className="font-semibold">{application.applicantWallet}</h3>
                      <p className="text-sm mt-1">{application.coverLetter}</p>
                      {application.expectedBudget && (
                        <p className="text-sm mt -1">Expected Budget: ${application.expectedBudget}</p>
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

              {fundingProject && (
                <FundProject 
                  project={fundingProject}
                  account={account}
                  onFundingComplete={(amount) => {
                    console.log(`Funded ${amount} ETH`);
                    setFundingProject(null); // Reset funding project after funding
                  }}
                />
              )}
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
        <button onClick={() => setActiveTab('created')}
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
              myJobs.ongoingProjects.map((project, index) => (
          <div 
            key={`${project._id}-${index}`}  
            className="border rounded-lg p-4 mb-4"
          >
            <h3 className="font-semibold">{project.title}</h3>
            <p className="text-sm">{project.description}</p>
            <div className="mt-2">
              <p className="text-sm font-medium">Client: {project.creatorWallet}</p>
              <p className="text-sm">
                Started: {project.applicationDetails?.appliedAt 
                  ? new Date(project.applicationDetails.appliedAt).toLocaleDateString() 
                  : 'N/A'}
              </p>
              <MilestoneRenderer 
                project={project} 
                account={account} 
                toggleMilestoneStatus={toggleMilestoneStatus}
                fetchMyJobs={fetchMyJobs}
              />
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