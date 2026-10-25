import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Jobs from './pages/Jobs';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Use environment variable for production, fallback to localhost for development
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchJobs();
    if (token) fetchApplications();
  }, [token, user]);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/jobs`);
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    try {
      const endpoint = user?.role === 'employer' ? '/applications/employer' : '/applications/jobseeker';
      const res = await axios.get(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e, type, formData) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/${type}`, formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      setTab('jobs');
    } catch (err) {
      alert(err.response?.data?.message || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setToken('');
    setTab('jobs');
  };

  const handlePostJob = async (jobData) => {
    try {
      await axios.post(`${API_BASE}/jobs`, jobData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Job Posted Successfully!');
      fetchJobs();
      setTab('jobs');
    } catch (err) {
      alert('Failed to post job');
    }
  };

  const handleApply = async (jobId, resumeFile) => {
    const formData = new FormData();
    formData.append('jobId', jobId);

    if (resumeFile) {
      formData.append('resume', resumeFile);
    }

    try {
      await axios.post(`${API_BASE}/applications`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Application Submitted Successfully!');
      fetchApplications();
    } catch (err) {
      console.error('Apply Error Details:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      alert(`Failed to apply: ${errorMsg}`);
    }
  };

  const handleStatusChange = async (appId, status) => {
    try {
      await axios.patch(`${API_BASE}/applications/${appId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchApplications();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // NEW: downloads the resume PDF on demand (sends the login token, then saves the file)
  const handleDownloadResume = async (appId, applicantName) => {
    try {
      const res = await axios.get(`${API_BASE}/applications/${appId}/resume`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${applicantName || 'resume'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('Failed to download resume');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Navbar user={user} setTab={setTab} handleLogout={handleLogout} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {tab === 'login' && <Login handleAuth={handleAuth} />}
        {tab === 'register' && <Register handleAuth={handleAuth} />}
        {tab === 'jobs' && <Jobs jobs={jobs} user={user} handleApply={handleApply} />}
        {tab === 'dashboard' && user && (
          <Dashboard 
            user={user} 
            applications={applications} 
            handlePostJob={handlePostJob} 
            handleStatusChange={handleStatusChange} 
            handleDownloadResume={handleDownloadResume}
          />
        )}
      </div>
    </div>
  );
}