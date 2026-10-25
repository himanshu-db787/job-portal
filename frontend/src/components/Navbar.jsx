import React from 'react';
import { Briefcase } from 'lucide-react';

export default function Navbar({ user, setTab, handleLogout }) {
  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setTab('jobs')}>
          <Briefcase className="w-8 h-8 text-indigo-600" />
          <span className="text-xl font-bold text-slate-900">CareerPulse</span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setTab('jobs')} className="text-slate-600 hover:text-indigo-600 font-medium">Jobs</button>
          {user ? (
            <>
              <button onClick={() => setTab('dashboard')} className="text-slate-600 hover:text-indigo-600 font-medium">Dashboard</button>
              <button onClick={handleLogout} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => setTab('login')} className="text-slate-600 hover:text-indigo-600 font-medium">Login</button>
              <button onClick={() => setTab('register')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium">Register</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}