import React, { useState } from 'react';
import { X } from 'lucide-react';

const PostJobModal = ({ onClose, token, onJobPosted }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    walletAddress: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onJobPosted();
      } else {
        setError(data.error || 'Failed to post job');
      }
    } catch (error) {
      setError('An error occurred while posting the job');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-4">Post a New Job</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Job Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
              rows="4"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Budget (ETH)</label>
            <input
              type="text"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="0.5 ETH"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Wallet Address</label>
            <input
              type="text"
              name="walletAddress"
              value={formData.walletAddress}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 text-red-800 p-4 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Post Job
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostJobModal;