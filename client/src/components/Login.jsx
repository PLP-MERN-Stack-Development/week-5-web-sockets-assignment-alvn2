import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-xl shadow-lg flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6">Enter your username</h2>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Username"
          className="px-4 py-2 w-56 mb-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button type="submit" className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">Join Chat</button>
      </form>
    </div>
  );
};

export default Login; 