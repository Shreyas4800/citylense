import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function LoginPage({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      const userObj = res.data;
      localStorage.setItem('citylense_active_user', JSON.stringify(userObj));
      onAuth(userObj);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or account not registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    const demoUser = {
      name: 'Ayush Jadhav',
      email: 'citizen.inspector@maharashtra.gov.in'
    };
    localStorage.setItem('citylense_active_user', JSON.stringify(demoUser));
    onAuth(demoUser);
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-2 bg-[#F5F3EE] pb-20 md:pb-0">
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white border-2 border-[#121316] p-8 hard-shadow">
          <div className="mb-6 border-b-2 border-[#121316] pb-4">
            <span className="font-mono text-xs font-bold uppercase text-[#D94E28]">// CITIZEN &amp; NODAL ACCESS</span>
            <h1 className="font-display text-2xl font-bold text-[#121316] mt-1">Sign in to CityLense</h1>
          </div>

          {error && (
            <div className="mb-4 bg-[#FFE8E0] border border-[#D94E28] text-[#121316] p-3 font-mono text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="citizen@maharashtra.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F5F3EE] border-2 border-[#121316] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-mono text-xs font-bold uppercase text-[#121316]">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="font-mono text-[10px] uppercase underline text-[#4A4D55] cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F5F3EE] border-2 border-[#121316] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D94E28] hover:bg-[#b83d1b] text-white font-mono text-xs uppercase font-bold py-3.5 border-2 border-[#121316] hard-shadow-sm transition-colors cursor-pointer"
            >
              {loading ? 'AUTHENTICATING AGAINST POSTGRESQL...' : 'Authenticate Session →'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#D8D4C8]" />
            <span className="font-mono text-[10px] uppercase text-[#4A4D55]">Or Instant Access</span>
            <div className="flex-1 h-px bg-[#D8D4C8]" />
          </div>

          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full bg-[#121316] hover:bg-[#2A2D34] text-white font-mono text-xs uppercase font-bold py-3 border-2 border-[#121316] cursor-pointer"
          >
            ⚡ 1-Click Verified Citizen Demo Login
          </button>

          <p className="font-mono text-xs text-[#4A4D55] text-center mt-6">
            New field reporter?{' '}
            <Link to="/signup" className="text-[#121316] font-bold underline">
              Register Citizen ID
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex bg-[#121316] text-white p-12 flex-col justify-center border-l-2 border-[#121316]">
        <div className="max-w-md space-y-6">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#D94E28]">
            // CLOUD POSTGRESQL AUTHENTICATION
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight">
            Unified Citizen Identity Across Mobile &amp; Web.
          </h2>
          <p className="text-[#D8D4C8] text-sm leading-relaxed">
            Citizen accounts are persisted in Azure PostgreSQL and automatically sign your statutory municipal notices.
          </p>
        </div>
      </div>
    </div>
  );
}

export function SignupPage({ onAuth }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_BASE}/api/auth/signup`, { name, email, password });
      const userObj = res.data;
      localStorage.setItem('citylense_active_user', JSON.stringify(userObj));
      onAuth(userObj);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-2 bg-[#F5F3EE] pb-20 md:pb-0">
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white border-2 border-[#121316] p-8 hard-shadow">
          <div className="mb-6 border-b-2 border-[#121316] pb-4">
            <span className="font-mono text-xs font-bold uppercase text-[#D94E28]">// CITIZEN REGISTRATION</span>
            <h1 className="font-display text-2xl font-bold text-[#121316] mt-1">Create Reporter Credentials</h1>
          </div>

          {error && (
            <div className="mb-4 bg-[#FFE8E0] border border-[#D94E28] text-[#121316] p-3 font-mono text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-1.5">Full Name</label>
              <input
                type="text"
                required
                placeholder="Aarav Deshmukh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F5F3EE] border-2 border-[#121316] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F5F3EE] border-2 border-[#121316] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F5F3EE] border-2 border-[#121316] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D94E28] hover:bg-[#b83d1b] text-white font-mono text-xs uppercase font-bold py-3.5 border-2 border-[#121316] hard-shadow-sm transition-colors cursor-pointer"
            >
              {loading ? 'SAVING TO AZURE POSTGRESQL...' : 'Register Citizen Account →'}
            </button>
          </form>

          <p className="font-mono text-xs text-[#4A4D55] text-center mt-6">
            Already registered?{' '}
            <Link to="/login" className="text-[#121316] font-bold underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex bg-[#121316] text-white p-12 flex-col justify-center border-l-2 border-[#121316]">
        <div className="max-w-md space-y-5">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#D94E28]">
            // DIRECT NODAL DISPATCH
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight">
            Built for Field Transparency
          </h2>
          <ul className="space-y-3 font-mono text-xs text-[#D8D4C8]">
            <li>[01] VISION GATEWAY REJECTS NON-CIVIC SPAM</li>
            <li>[02] POSTGIS MATCHES NEAREST MUNICIPAL CORPORATION</li>
            <li>[03] AUTO-GENERATES FORMAL LEGAL COMPLAINT EMAILS</li>
            <li>[04] PUBLIC AUDIT LEDGER WITH REFERENCE IDS</li>
          </ul>
        </div>
      </div>
    </div>
  );
}