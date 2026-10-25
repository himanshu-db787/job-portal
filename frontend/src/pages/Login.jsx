import React, { useState } from 'react';

export default function Login({ handleAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    handleAuth(e, 'login', { email, password });
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow border">
      <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border p-3 rounded-lg" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border p-3 rounded-lg" />
        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700">Login</button>
      </form>
    </div>
  );
}