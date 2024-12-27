import React, { useState } from 'react';
import axios from 'axios';

const JobDetailsModal = ({ job, onClose, onApply, accountAddress }) => {
  const [applicationDetails, setApplicationDetails] = useState({
    coverLetter: '',
    expectedBudget: '',
    estimatedTime: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();

    if (!accountAddress) {
      alert('Please connect your wallet first');
      return;
    }

    if (!applicationDetails.coverLetter.trim()) {
      alert('Please provide a cover letter');
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const applicationData = {
        jobId: job._id,
        ...applicationDetails,
        applicantWallet: accountAddress
      };

      const response = await axios.post(`http://localhost:5000/api/jobs/apply`, applicationData);
      alert('Application submitted successfully!');
      onApply(response.data);
      onClose();
    } catch (error) {
      console.error('Application submission error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to submit application';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8 relative">
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

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{job.title}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="font-semibold">{job.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Budget</p>
              <p className="font-semibold">${job.budget || 'Not specified'}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Description</p>
            <p className="text-gray-800">{job.description}</p>
          </div>

          {job.skills?.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitApplication} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Letter
            </label>
            <textarea
              name="coverLetter"
              value={applicationDetails.coverLetter}
              onChange={handleInputChange}
              rows="4"
              className="w-full border rounded-md p-2"
              placeholder="Write a brief introduction and why you're a good fit for this job"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Budget
              </label>
              <input
                type="number"
                name="expectedBudget"
                value={applicationDetails.expectedBudget}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2"
                placeholder="Your expected budget"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Time (days)
              </label>
              <input
                type="number"
                name="estimatedTime"
                value={applicationDetails.estimatedTime}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2"
                placeholder="Estimated completion time"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-md text-white ${
                isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobDetailsModal;