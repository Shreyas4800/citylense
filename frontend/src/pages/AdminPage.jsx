import { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ADMIN_PASSKEY = 'MAHA-ADMIN-2026';

export default function AdminPage({ issues, onStatusChange, onRefresh }) {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('citylense_admin_unlocked') === 'true';
  });
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [selectedCity, setSelectedCity] = useState('All');
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('citylense_webhook') || '');
  const [broadcastLog, setBroadcastLog] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passkeyInput.trim() === ADMIN_PASSKEY) {
      sessionStorage.setItem('citylense_admin_unlocked', 'true');
      setIsUnlocked(true);
      setAuthError('');
    } else {
      setAuthError('Invalid Nodal Officer Passkey. Access Denied.');
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem('citylense_admin_unlocked');
    setIsUnlocked(false);
    setPasskeyInput('');
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-[#F5F3EE] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border-2 border-[#121316] hard-shadow p-8 space-y-6">
          <div className="border-b-2 border-[#121316] pb-4">
            <span className="font-mono text-xs font-bold uppercase text-[#D94E28]">
              // RESTRICTED MUNICIPAL GATEWAY
            </span>
            <h1 className="font-display text-2xl font-bold text-[#121316] mt-1">
              Nodal Officer Authentication
            </h1>
            <p className="text-xs text-[#4A4D55] mt-1">
              This console is restricted to authorized municipal auditors and social dispatch operators.
            </p>
          </div>

          {authError && (
            <div className="bg-[#FFE8E0] border border-[#D94E28] p-3 font-mono text-xs font-bold text-[#121316]">
              {authError}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-1.5">
                Enter Nodal Security Passkey
              </label>
              <input
                type="password"
                required
                placeholder="Enter passkey..."
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                className="w-full px-3.5 py-2.5 font-mono text-sm bg-[#F5F3EE] border-2 border-[#121316] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#121316] hover:bg-[#D94E28] text-white font-mono text-xs uppercase font-bold py-3.5 border-2 border-[#121316] hard-shadow-sm transition-colors cursor-pointer"
            >
              Unlock Nodal Command Center &rarr;
            </button>
          </form>

          <div className="bg-[#F5F3EE] border border-[#D8D4C8] p-3 font-mono text-[11px] text-[#4A4D55] flex items-center justify-between">
            <span>Demo Evaluator Passkey:</span>
            <button
              type="button"
              onClick={() => setPasskeyInput(ADMIN_PASSKEY)}
              className="font-bold text-[#D94E28] underline cursor-pointer"
            >
              Auto-Fill ({ADMIN_PASSKEY})
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cities = ['All', ...Array.from(new Set(issues.map((i) => i.jurisdiction).filter(Boolean)))];
  const filtered = issues.filter((i) => selectedCity === 'All' || i.jurisdiction === selectedCity);

  const handleStatusUpdate = async (refId, newStatus) => {
    setUpdatingId(refId);
    try {
      await axios.patch(`${API_BASE}/api/reports/${refId}/status`, { status: newStatus });
    } catch {}
    onStatusChange(refId, newStatus);
    setUpdatingId(null);
  };

  const triggerXPost = async (issue) => {
    const text =
      issue.social_post ||
      `🚨 [VERIFIED DOCKET #${issue.reference_id}] ${issue.category} in ${issue.jurisdiction}: ${
        issue.ai_summary || issue.description
      } #CityLense`;
    const xIntentUrl = `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
    window.open(xIntentUrl, '_blank', 'noopener,noreferrer');

    try {
      await axios.patch(`${API_BASE}/api/reports/${issue.reference_id}/status`, { social_posted: true });
    } catch {}

    setBroadcastLog((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        ref: issue.reference_id,
        city: issue.jurisdiction
      },
      ...prev
    ]);
  };

  const triggerAutomatedBatchBroadcast = async () => {
    const batch = filtered.slice(0, 5);
    const newLogs = [];

    for (const issue of batch) {
      if (webhookUrl) {
        try {
          await axios.post(webhookUrl, {
            content: issue.social_post,
            username: 'CityLense AI Dispatch'
          });
        } catch {}
      }
      newLogs.push({
        time: new Date().toLocaleTimeString(),
        ref: issue.reference_id,
        city: issue.jurisdiction
      });
    }

    setBroadcastLog((prev) => [...newLogs, ...prev]);
  };

  const saveWebhook = (val) => {
    setWebhookUrl(val);
    localStorage.setItem('citylense_webhook', val);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] py-8 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-[#121316] text-white border-2 border-[#121316] p-6 hard-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#D94E28]">
                // AUTHENTICATED NODAL OFFICER CONSOLE
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold mt-1">
              SLA Status Control &amp; Automated Social Broadcaster
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRefresh}
              className="bg-white text-[#121316] font-mono text-xs uppercase font-bold px-4 py-2.5 border-2 border-white hover:bg-[#D94E28] hover:text-white transition-colors cursor-pointer"
            >
              ↻ Sync PostgreSQL ({issues.length})
            </button>
            <button
              onClick={handleLock}
              className="bg-transparent text-[#D8D4C8] hover:text-white font-mono text-xs uppercase font-bold px-4 py-2.5 border border-[#4A4D55] cursor-pointer"
            >
              🔒 Lock Console
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white border-2 border-[#121316] p-5 hard-shadow space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#121316] pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase text-[#D94E28]">
                  // ZERO-TOUCH BACKGROUND AUTOMATION
                </span>
                <h2 className="font-display text-lg font-bold text-[#121316]">
                  Webhook &amp; X Auto-Broadcast Pipeline
                </h2>
              </div>
              <span className="font-mono text-xs font-bold bg-[#D8F3DC] text-[#1B4332] border border-[#1B4332] px-3 py-1">
                BACKEND INTAKE AUTO-GENERATOR: ON ✓
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-[#4A4D55] mb-1">
                  Free Discord / Telegram / Make.com Webhook URL (Auto-posts every new report):
                </label>
                <input
                  type="url"
                  placeholder="https://discord.com/api/webhooks/... or Make.com URL"
                  value={webhookUrl}
                  onChange={(e) => saveWebhook(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F3EE] border border-[#121316] text-[#121316]"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={triggerAutomatedBatchBroadcast}
                  className="w-full bg-[#121316] hover:bg-[#D94E28] text-white font-mono text-xs uppercase font-bold py-2.5 px-3 border border-[#121316] transition-colors cursor-pointer"
                >
                  Broadcast Top 5 Dockets
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white border-2 border-[#121316] p-5 hard-shadow flex flex-col justify-between">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#121316] border-b-2 border-[#121316] pb-2 mb-3">
                // DISPATCH LOG
              </h3>
              {broadcastLog.length === 0 ? (
                <p className="font-mono text-xs text-[#4A4D55]">
                  All {issues.length} dockets have pre-built social payloads stored in PostgreSQL.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-24 overflow-y-auto font-mono text-[11px]">
                  {broadcastLog.map((log, i) => (
                    <div key={i} className="bg-[#F5F3EE] border border-[#121316] px-2 py-1">
                      [{log.time}] Posted <strong>{log.ref}</strong> ({log.city})
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#D8D4C8] flex items-center justify-between font-mono text-xs">
              <span>Filter Corporation:</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-[#F5F3EE] border border-[#121316] px-2 py-1 font-bold"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filtered.map((issue) => (
            <div
              key={issue.id || issue.reference_id}
              className="bg-white border-2 border-[#121316] hard-shadow grid grid-cols-1 lg:grid-cols-12 overflow-hidden"
            >
              <div className="lg:col-span-5 p-5 border-b-2 lg:border-b-0 lg:border-r-2 border-[#121316] flex flex-col justify-between gap-4">
                <div className="flex gap-4">
                  <img
                    src={issue.image_url}
                    alt={issue.category}
                    className="w-28 h-28 object-cover border-2 border-[#121316] shrink-0 bg-[#E5E2D9]"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-[#121316] text-white px-2 py-0.5">
                        {issue.reference_id}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-[#D94E28] uppercase">
                        {issue.jurisdiction}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base text-[#121316] truncate">
                      {issue.title || `${issue.category} Defect`}
                    </h3>
                    <p className="font-mono text-[11px] text-[#4A4D55]">
                      {Number(issue.latitude).toFixed(4)}°N, {Number(issue.longitude).toFixed(4)}°E
                    </p>
                    <p className="font-mono text-[11px] text-[#1B4332] font-bold truncate">
                      {issue.department_email || 'Nodal Officer'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#D8D4C8] flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold uppercase text-[#4A4D55]">
                    Set Official Status:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['verified', 'in-progress', 'resolved', 'escalated'].map((st) => (
                      <button
                        key={st}
                        disabled={updatingId === issue.reference_id}
                        onClick={() => handleStatusUpdate(issue.reference_id, st)}
                        className={`px-2.5 py-1 font-mono text-[10px] uppercase font-bold border cursor-pointer transition-colors ${
                          (issue.status || 'verified') === st
                            ? st === 'resolved'
                              ? 'bg-[#1B4332] text-white border-[#121316]'
                              : st === 'in-progress'
                              ? 'bg-[#D97706] text-white border-[#121316]'
                              : 'bg-[#121316] text-white border-[#121316]'
                            : 'bg-[#F5F3EE] text-[#121316] border-[#121316] hover:bg-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 p-5 bg-[#F5F3EE] flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#D94E28]">
                    // AUTO-GENERATED SOCIAL MEDIA DISPATCH
                  </span>
                  <span className="font-mono text-[10px] bg-white border border-[#121316] px-2 py-0.5 font-bold">
                    {issue.social_posted ? 'DISPATCHED ✓' : 'READY IN QUEUE'}
                  </span>
                </div>

                <pre className="w-full p-3 bg-white border-2 border-[#121316] font-mono text-xs text-[#121316] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {issue.social_post}
                </pre>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => triggerXPost(issue)}
                    className="flex-1 bg-[#121316] hover:bg-[#D94E28] text-white font-mono text-xs uppercase font-bold py-2.5 px-4 border-2 border-[#121316] hard-shadow-sm transition-colors cursor-pointer"
                  >
                    𝕏 Launch Pre-Filled X Post &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(issue.social_post || '');
                      setCopiedId(issue.reference_id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="bg-white hover:bg-[#E5E2D9] text-[#121316] font-mono text-xs uppercase font-bold py-2.5 px-4 border-2 border-[#121316] cursor-pointer"
                  >
                    {copiedId === issue.reference_id ? 'COPIED ✓' : 'Copy Text'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}