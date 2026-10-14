import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import PublicFeedPage from './pages/PublicFeedPage';
import ReportIssuePage from './pages/ReportIssuePage';
import AdminPage from './pages/AdminPage';
import { LoginPage, SignupPage } from './pages/AuthPages';

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://citylense.onrender.com');

export default function App() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('citylense_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const fetchLiveReports = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/reports`);
      if (Array.isArray(res.data)) {
        setIssues(res.data);
      }
    } catch (err) {
      // Fallback to Render cloud URL if local server is stopped
      if (API_BASE.includes('localhost')) {
        try {
          const cloudRes = await axios.get('https://citylense.onrender.com/api/reports');
          if (Array.isArray(cloudRes.data)) {
            setIssues(cloudRes.data);
          }
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveReports();
    const interval = setInterval(fetchLiveReports, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveReports]);

  const handleReportCreated = (newIssue) => {
    setIssues((prev) => [newIssue, ...prev.filter((i) => i.reference_id !== newIssue.reference_id)]);
    setTimeout(fetchLiveReports, 1000);
  };

  const handleUpvote = async (refId) => {
    setIssues((prev) =>
      prev.map((item) =>
        item.reference_id === refId ? { ...item, upvotes: (item.upvotes || 1) + 1 } : item
      )
    );
    try {
      await axios.post(`${API_BASE}/api/reports/${refId}/upvote`);
    } catch {}
  };

  const handleStatusChange = (refId, newStatus) => {
    setIssues((prev) =>
      prev.map((item) =>
        item.reference_id === refId ? { ...item, status: newStatus } : item
      )
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('citylense_active_user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F5F3EE] text-[#121316]">
        <Navbar user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<HomePage issues={issues} loading={loading} />} />
          <Route
            path="/feed"
            element={
              <PublicFeedPage
                issues={issues}
                loading={loading}
                onUpvote={handleUpvote}
                onRefresh={fetchLiveReports}
                user={user}
              />
            }
          />
          <Route
            path="/report"
            element={<ReportIssuePage onReportCreated={handleReportCreated} user={user} />}
          />
          <Route
            path="/admin"
            element={
              <AdminPage
                issues={issues}
                onStatusChange={handleStatusChange}
                onRefresh={fetchLiveReports}
              />
            }
          />
          <Route path="/login" element={<LoginPage onAuth={setUser} />} />
          <Route path="/signup" element={<SignupPage onAuth={setUser} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}