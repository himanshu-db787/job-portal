import React, { useState } from 'react';

export default function Jobs({ jobs, user, handleApply }) {
  // Store selected resume files mapped by jobId
  const [selectedFiles, setSelectedFiles] = useState({});

  const handleFileChange = (jobId, e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFiles({
        ...selectedFiles,
        [jobId]: e.target.files[0]
      });
    }
  };

  const onSubmitApplication = (jobId) => {
    const file = selectedFiles[jobId];
    if (!file) {
      alert('Please select a PDF resume file before applying.');
      return;
    }
    // Pass both jobId and the actual File object to handleApply in App.jsx
    handleApply(jobId, file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Available Job Openings</h2>
        <span className="text-sm text-slate-500">{jobs.length} jobs available</span>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
          No jobs found. Check back later or post a new job from the employer dashboard!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div key={job._id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                    <p className="text-slate-600 font-medium">{job.company}</p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {job.type || 'Full-Time'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500 mt-3">
                  <span>📍 {job.location || 'Remote'}</span>
                  <span>💰 {job.salary || 'Competitive'}</span>
                </div>

                <p className="text-slate-600 text-sm mt-3 line-clamp-3">{job.description}</p>
              </div>

              {/* Job Seeker Apply Section */}
              {user?.role === 'jobseeker' && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Upload Resume (PDF):
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(job._id, e)}
                      className="block w-full text-xs text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-xs file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => onSubmitApplication(job._id)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm shadow-sm"
                  >
                    Apply Now
                  </button>
                </div>
              )}

              {user?.role === 'employer' && (
                <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 italic">
                  Employer view (Switch to a Job Seeker account to apply)
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}