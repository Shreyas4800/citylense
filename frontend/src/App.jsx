import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import PublicFeedPage from './pages/PublicFeedPage';
import ReportIssuePage from './pages/ReportIssuePage';
import AdminPage from './pages/AdminPage';
import { LoginPage, SignupPage } from './pages/AuthPages';
import { FALLBACK_ISSUES } from './data/seedIssues';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [issues, setIssues] = useState(FALLBACK_ISSUES);
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
        const dbIssues = res.data.map((row) => ({
          ...row,
          title: row.title || `${row.category} Defect — ${row.jurisdiction || 'Municipal Zone'}`,
          description: row.ai_summary,
          status: row.status || 'verified',
          date: row.created_at ? new Date(row.created_at).toLocaleString() : 'Logged in DB',
          upvotes: row.upvotes || 1
        }));

        const dbRefIds = new Set(dbIssues.map((d) => d.reference_id));
        const remainingSeeds = FALLBACK_ISSUES.filter((s) => !dbRefIds.has(s.reference_id));
        setIssues([...dbIssues, ...remainingSeeds]);
      }
    } catch {
      // Keeps current state if backend is momentarily unreachable
    }
  }, []);

  useEffect(() => {
    fetchLiveReports();
    const interval = setInterval(fetchLiveReports, 8000);
    return () => clearInterval(interval);
  }, [fetchLiveReports]);

  const handleReportCreated = (newIssue) => {
    setIssues((prev) => {
      const filtered = prev.filter((i) => i.reference_id !== newIssue.reference_id);
      return [newIssue, ...filtered];
    });
    fetchLiveReports();
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
          <Route path="/" element={<HomePage issues={issues} />} />
          <Route
            path="/feed"
            element={<PublicFeedPage issues={issues} onUpvote={handleUpvote} user={user} />}
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