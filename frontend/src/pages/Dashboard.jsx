import React, { useState } from 'react';

// Get base URL for backend static assets (stripping out the trailing '/api' if present)
const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

export default function Dashboard({ user, applications, handlePostJob, handleStatusChange }) {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [type, setType] = useState('Full-Time');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState(''); // FIX: new skills field
  
  const [openResumeId, setOpenResumeId] = useState(null);

  const onSubmitJob = (e) => {
    e.preventDefault();
    if (!jobTitle || !company || !description) {
      alert('Please fill out all required fields');
      return;
    }

    // FIX: convert "Python, SQL" into ["Python", "SQL"]
    const skillsArray = skills.split(',').map((s) => s.trim()).filter((s) => s !== '');

    handlePostJob({ title: jobTitle, company, location, salary, type, description, skillsRequired: skillsArray });
    setJobTitle('');
    setCompany('');
    setLocation('');
    setSalary('');
    setDescription('');
    setSkills('');
  };

  const toggleResumeText = (appId) => {
    setOpenResumeId(openResumeId === appId ? null : appId);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}</h2>
        <p className="text-slate-500 capitalize">Role: {user?.role}</p>
      </div>

      {/* ================= EMPLOYER / RECRUITER VIEW ================= */}
      {user?.role === 'employer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Post Job Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Post a New Job</h3>
            <form onSubmit={onSubmitJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Full Stack Developer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Cisco"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Bangalore"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salary</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="$1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Type</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              {/* FIX: new skills input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills (comma separated)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Python, TensorFlow, SQL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Job details..."
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm shadow-sm"
              >
                Post Job
              </button>
            </form>
          </div>

          {/* Received Applications List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xl font-semibold text-slate-800">Received Applications ({applications.length})</h3>
            
            {applications.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-slate-500 text-center">
                No applications received yet.
              </div>
            ) : (
              applications.map((app) => (
                <div key={app._id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  
                  {/* Header: Candidate Info, AI Match Badge & Status Select */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">{app.applicant?.name || 'Applicant'}</h4>
                      <p className="text-sm text-slate-500">{app.applicant?.email}</p>
                      <p className="text-xs font-semibold text-indigo-600 mt-1">Job: {app.job?.title || 'Position'}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* AI Match Score Badge */}
                      <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                        app.matchScore >= 70
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        🤖 {app.matchScore || 0}% Match
                      </span>

                      {/* Application Status Dropdown */}
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app._id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border focus:outline-none ${
                          app.status === 'Accepted'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : app.status === 'Shortlisted'
                            ? 'bg-purple-100 text-purple-700 border-purple-300'
                            : app.status === 'Rejected'
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : app.status === 'Reviewed'
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  {/* AI Evaluation Summary & Skills Breakdown */}
                  {app.aiSummary && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-3">
                      <div className="font-bold text-indigo-600 flex items-center gap-1 text-sm">
                        ✨ AI Fit Summary
                      </div>
                      <p className="leading-relaxed">{app.aiSummary}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {app.matchedSkills && app.matchedSkills.length > 0 && (
                          <div>
                            <span className="font-semibold text-green-700 block mb-1">✓ Matched Skills:</span>
                            <div className="flex flex-wrap gap-1">
                              {app.matchedSkills.map((skill, idx) => (
                                <span key={idx} className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[11px] border border-green-200">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {app.missingSkills && app.missingSkills.length > 0 && (
                          <div>
                            <span className="font-semibold text-amber-700 block mb-1">⚠ Missing Skills:</span>
                            <div className="flex flex-wrap gap-1">
                              {app.missingSkills.map((skill, idx) => (
                                <span key={idx} className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Candidate Resume Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
                    <span>Applied on: {new Date(app.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      {app.resumeUrl && (
                        <a
                          href={app.resumeUrl.startsWith('http') || app.resumeUrl.startsWith('data:') ? app.resumeUrl : `${BACKEND_URL}/${app.resumeUrl}`}
                          download={`${app.applicant?.name || 'resume'}.pdf`} // FIX: lets Chrome download the base64 PDF
                          target="_blank"
                          rel="noreferrer"
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-1.5 px-3 rounded-md transition border border-slate-300 flex items-center gap-1"
                        >
                          📄 Download Original PDF
                        </a>
                      )}

                      {app.resumeText && (
                        <button
                          onClick={() => toggleResumeText(app._id)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-1.5 px-3 rounded-md transition border border-indigo-200"
                        >
                          {openResumeId === app._id ? 'Hide Parsed Resume' : '🔍 View Extracted Text'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Extracted Resume Text Box */}
                  {openResumeId === app._id && app.resumeText && (
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono max-h-64 overflow-y-auto whitespace-pre-wrap border border-slate-800">
                      <p className="text-indigo-400 font-sans font-bold text-xs mb-2 uppercase tracking-wider">
                        Extracted Resume Text:
                      </p>
                      {app.resumeText}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= JOB SEEKER VIEW ================= */}
      {user?.role === 'jobseeker' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-800">My Applications</h3>
          {applications.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-slate-500 text-center">
              You haven't applied for any jobs yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {applications.map((app) => (
                <div key={app._id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900">{app.job?.title || 'Job Listing'}</h4>
                      <p className="text-sm text-slate-500">{app.job?.company}</p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        app.status === 'Accepted'
                          ? 'bg-green-100 text-green-800'
                          : app.status === 'Shortlisted'
                          ? 'bg-purple-100 text-purple-800'
                          : app.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : app.status === 'Reviewed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Applied on: {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}