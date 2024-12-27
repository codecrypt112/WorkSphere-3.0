import React from 'react';
import { Briefcase, Plus, User, Clock } from 'lucide-react';

const ClientDashboard = ({ onPostJob }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <button 
          className="flex items-center justify-center gap-2 px-6 py-3 border-2 rounded-lg hover:bg-blue-50 transition-colors"
          onClick={() => console.log('Browse Jobs')}
        >
          <Briefcase className="w-5 h-5" />
          Browse Jobs
        </button>
        <button 
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={onPostJob}
        >
          <Plus className="w-5 h-5" />
          Post a Job
        </button>
        <button 
          className="flex items-center justify-center gap-2 px-6 py-3 border-2 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <User className="w-5 h-5" />
          Profile
        </button>
        <button 
          className="flex items-center justify-center gap-2 px-6 py-3 border-2 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Clock className="w-5 h-5" />
          My Projects
        </button>
      </div>
    </div>
  );
};

export default ClientDashboard;