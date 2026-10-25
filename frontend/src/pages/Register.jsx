import React, { useState } from 'react';

export default function Register({ handleAuth }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('jobseeker');

  const onSubmit = (e) => {
    e.preventDefault();
    handleAuth(e, 'register', { name, email, password, role });
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow border">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="w-full border p-3 rounded-lg" />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border p-3 rounded-lg" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border p-3 rounded-lg" />
        <select value={role} onChange={e => setRole(e.target.value)} className="w-full border p-3 rounded-lg">
          <option value="jobseeker">Job Seeker</option>
          <option value="employer">Employer / Recruiter</option>
        </select>
        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700">Register</button>
      </form>
    </div>
  );
}