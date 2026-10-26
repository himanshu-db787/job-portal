import React, { useState } from 'react';

const JOB_TYPES = ['All', 'Full-Time', 'Part-Time', 'Contract', 'Internship'];

export default function Jobs({ jobs, user, handleApply, handleDeleteJob }) {
  // Store selected resume files mapped by jobId
  const [selectedFiles, setSelectedFiles] = useState({});

  // NEW: filter values typed by the user
  const [searchText, setSearchText] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

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

  // ask for confirmation, then delete
  const onDeleteJob = (jobId) => {
    const confirmed = window.confirm('Are you sure you want to delete this job?');
    if (confirmed) {
      handleDeleteJob(jobId);
    }
  };

  // NEW: keep only the jobs that match every filter
  const searchWord = searchText.trim().toLowerCase();
  const locationWord = locationFilter.trim().toLowerCase();

  const filteredJobs = jobs.filter((job) => {
    const skillsText = (job.skillsRequired || []).join(' ');
    const searchableText = `${job.title} ${job.company} ${job.description} ${skillsText}`.toLowerCase();
    const jobLocation = (job.location || 'Remote').toLowerCase();
    const jobType = job.type || 'Full-Time';

    const matchesSearch = searchWord === '' || searchableText.includes(searchWord);
    const matchesLocation = locationWord === '' || jobLocation.includes(locationWord);
    const matchesType = typeFilter === 'All' || jobType === typeFilter;

    return matchesSearch && matchesLocation && matchesType;
  });

  const filtersActive = searchWord !== '' || locationWord !== '' || typeFilter !== 'All';

  // NEW: reset all filters
  const clearFilters = () => {
    setSearchText('');
    setLocationFilter('');
    setTypeFilter('All');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Available Job Openings</h2>
        <span className="text-sm text-slate-500">
          {filtersActive ? `${filteredJobs.length} of ${jobs.length} jobs` : `${jobs.length} jobs available`}
        </span>
      </div>

      {/* NEW: Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="🔍 Search title, company or skill"
          className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <input
          type="text"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          placeholder="📍 Location"
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          {JOB_TYPES.map((jobType) => (
            <option key={jobType} value={jobType}>
              {jobType === 'All' ? 'All job types' : jobType}
            </option>
          ))}
        </select>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
          No jobs found. Check back later or post a new job from the employer dashboard!
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 space-y-3">
          <p>No jobs match your filters.</p>
          <button
            onClick={clearFilters}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm py-1.5 px-4 rounded-md transition border border-indigo-200"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => {
            // true only when the logged-in employer posted this job
            const isOwner = user?.role === 'employer' && job.postedBy?._id === user?.id;

            return (
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

                  {/* NEW: show required skills as small tags */}
                  {job.skillsRequired && job.skillsRequired.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {job.skillsRequired.map((skill, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
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

                {/* Employer section: delete button only for the owner */}
                {user?.role === 'employer' && (
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 italic">
                      {isOwner ? 'You posted this job' : 'Posted by another employer'}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => onDeleteJob(job._id)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs py-1.5 px-3 rounded-md transition border border-red-200"
                      >
                        🗑 Delete Job
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}