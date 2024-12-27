import React, { useState } from'react';

const AuthModal = ({ 
  authMode, 
  setAuthMode, 
  setIsAuthenticated, 
  setShowAuthModal, 
  setIsLandingPage, 
  setUserRole, 
  setUsername, 
  setEmail, 
  setAuthError 
}) => {
  const [username, setUsernameModal] = useState('');
  const [email, setEmailModal] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const usernameModal = authMode ==='register'? e.target.username?.value : undefined;
    const role = authMode ==='register'? e.target.role?.value : undefined;

    try {
      const response = await fetch(`http://localhost:5000/${authMode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username: usernameModal, role }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setAuthError('');
        setIsLandingPage(false);
        setUserRole(data.role);
        setUsername(data.username);
        setEmail(email);
        console.log(data.message);
      } else {
        setAuthError(data.message);
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
                onChange={(e) => setUsernameModal(e.target.value)}
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
              onChange={(e) => setEmailModal(e.target.value)}
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

export default AuthModal;