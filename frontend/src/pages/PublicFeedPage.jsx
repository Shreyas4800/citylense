import { useState } from 'react';
import IssueMap from '../components/IssueMap';
import { MUNICIPALITIES } from '../data/seedIssues';

export default function PublicFeedPage({ issues = [], loading, onUpvote, onRefresh, user }) {
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedMunicipality, setSelectedMunicipality] = useState('All Jurisdictions');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [draftModalIssue, setDraftModalIssue] = useState(null);
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftTo, setDraftTo] = useState('');

  const categories = [
    'all',
    'Roads & Infra',
    'Water & Drainage',
    'Health & SWM',
    'Electricity',
    'Environment & Gardens',
    'Encroachment & Estate'
  ];

  // Dynamic filtered issues
  const filteredIssues = issues.filter((issue) => {
    const matchesCity =
      selectedMunicipality === 'All Jurisdictions' ||
      issue.jurisdiction === selectedMunicipality;
    const matchesCat =
      selectedCategory === 'all' ||
      issue.category === selectedCategory;
    return matchesCity && matchesCat;
  });

  // Dynamic Analytics Calculations from real DB issues
  const totalCount = issues.length;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;
  const inProgressCount = issues.filter((i) => i.status === 'in-progress').length;
  const verifiedOpenCount = totalCount - resolvedCount - inProgressCount;
  const avgConfidence =
    totalCount > 0
      ? Math.round(
          (issues.reduce((acc, i) => acc + (Number(i.confidence) || 0.92), 0) / totalCount) * 100
        )
      : 0;

  // Dynamic Municipality Breakdown
  const cityCountsMap = {};
  issues.forEach((i) => {
    const c = i.jurisdiction || 'Kolhapur (KMC)';
    if (!cityCountsMap[c]) cityCountsMap[c] = { city: c, total: 0, resolved: 0, pending: 0 };
    cityCountsMap[c].total += 1;
    if (i.status === 'resolved') cityCountsMap[c].resolved += 1;
    else cityCountsMap[c].pending += 1;
  });
  const municipalityBreakdown = Object.values(cityCountsMap).sort((a, b) => b.total - a.total);

  // Dynamic Category Wing Breakdown
  const categoryCountsMap = {};
  issues.forEach((i) => {
    const cat = i.category || 'Roads & Infra';
    if (!categoryCountsMap[cat]) categoryCountsMap[cat] = { category: cat, total: 0 };
    categoryCountsMap[cat].total += 1;
  });
  const categoryBreakdown = Object.values(categoryCountsMap).sort((a, b) => b.total - a.total);

  const openEmailModal = (issue) => {
    const lat = Number(issue.latitude).toFixed(6);
    const lng = Number(issue.longitude).toFixed(6);
    const targetEmail = issue.department_email || 'nodal@maharashtra.gov.in';

    const subject = `[OFFICIAL CIVIC DOCKET #${issue.reference_id}] Escalation Notice: ${issue.category} (${issue.jurisdiction})`;
    const body = `To,
The Nodal Officer (${issue.category} Wing),
${issue.jurisdiction} Municipal Corporation.

SUBJECT: Citizen Escalation for Verified Docket #${issue.reference_id}

Respected Sir / Madam,

Please find below the verified telemetry and AI inspection summary for an active civic defect in ${issue.jurisdiction}:

- Docket Reference : ${issue.reference_id}
- Category         : ${issue.category} (AI Confidence: ${Math.round((issue.confidence || 0.95) * 100)}%)
- Summary          : ${issue.ai_summary || issue.description}
- Coordinates      : ${lat}° N, ${lng}° E
- Google Maps Pin  : https://www.google.com/maps?q=${lat},${lng}
- Logged Timestamp : ${issue.date}
- Evidence Image   : ${issue.image_url}

We request immediate departmental inspection and resolution.

Sincerely,
${user?.name || 'Concerned Citizen'}
${user?.email || 'Dispatched via CityLense Public Registry'}`;

    setDraftTo(targetEmail);
    setDraftSubject(subject);
    setDraftBody(body);
    setDraftModalIssue(issue);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] py-8 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="bg-white border-2 border-[#121316] p-6 hard-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#D94E28]">
              // LIVE POSTGRESQL &amp; AZURE BLOB REGISTRY ({issues.length} DOCKETS)
            </span>
            <h1 className="font-display text-3xl font-bold text-[#121316] mt-1">
              Municipal Inspection Dockets
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onRefresh}
              className="bg-[#121316] hover:bg-[#D94E28] text-white font-mono text-xs uppercase font-bold px-3.5 py-2.5 border-2 border-[#121316] cursor-pointer"
            >
              ↻ Sync Live DB
            </button>
            <select
              value={selectedMunicipality}
              onChange={(e) => setSelectedMunicipality(e.target.value)}
              className="bg-[#F5F3EE] border-2 border-[#121316] text-[#121316] font-mono text-xs px-3 py-2.5 font-semibold focus:outline-none"
            >
              {MUNICIPALITIES.map((mun) => (
                <option key={mun} value={mun}>{mun}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Tabs */}
        <div className="flex flex-wrap border-2 border-[#121316] bg-white">
          {[
            { id: 'feed', label: `01 // Live Feed (${filteredIssues.length})` },
            { id: 'map', label: `02 // GIS Map (${filteredIssues.length})` },
            { id: 'analytics', label: '03 // Live Analytics' },
            { id: 'history', label: `04 // Audit History (${issues.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[150px] py-3.5 px-4 font-mono text-xs uppercase tracking-wider font-bold border-r border-[#121316] last:border-r-0 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#121316] text-white'
                  : 'bg-white text-[#121316] hover:bg-[#F5F3EE]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: LIVE FEED */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white p-4 border-2 border-[#121316] flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase text-[#4A4D55] mr-2">Wing:</span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 font-mono text-xs uppercase transition-colors border cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#D94E28] text-white border-[#121316] font-bold'
                        : 'bg-[#F5F3EE] text-[#121316] border-[#D8D4C8] hover:border-[#121316]'
                    }`}
                  >
                    {cat === 'all' ? 'All Wings' : cat}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="bg-white border-2 border-[#121316] p-12 text-center font-mono text-sm text-[#121316]">
                  SYNCING LIVE REPORTS FROM AZURE POSTGRESQL...
                </div>
              ) : filteredIssues.length === 0 ? (
                <div className="bg-white border-2 border-[#121316] p-12 text-center font-mono text-sm text-[#4A4D55]">
                  NO DOCKETS FOUND FOR THIS FILTER. SUBMIT A REPORT TO POPULATE THE LEDGER.
                </div>
              ) : (
                filteredIssues.map((issue) => (
                  <div
                    key={issue.id || issue.reference_id}
                    className="bg-white border-2 border-[#121316] hard-shadow flex flex-col sm:flex-row overflow-hidden"
                  >
                    <div className="w-full sm:w-60 h-52 sm:h-auto bg-[#E5E2D9] shrink-0 border-b-2 sm:border-b-0 sm:border-r-2 border-[#121316] relative">
                      <img
                        src={issue.image_url}
                        alt={issue.category}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-[#121316] text-white font-mono text-[10px] font-bold px-2 py-0.5">
                        {issue.reference_id}
                      </span>
                      <span className="absolute bottom-2 left-2 bg-[#121316]/90 text-white font-mono text-[10px] px-2 py-0.5">
                        {(issue.status || 'verified').toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] font-bold uppercase bg-[#F5F3EE] border border-[#121316] px-2 py-0.5">
                              {issue.category}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-[#1B4332] bg-[#D8F3DC] border border-[#1B4332] px-2 py-0.5">
                              AI CONF: {Math.round((issue.confidence || 0.95) * 100)}%
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-[#4A4D55]">{issue.date}</span>
                        </div>

                        <h3 className="font-display text-lg font-bold text-[#121316] mb-1.5">
                          {issue.title || `${issue.category} — ${issue.jurisdiction}`}
                        </h3>
                        <p className="text-sm text-[#4A4D55] leading-relaxed">
                          {issue.ai_summary || issue.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#D8D4C8] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                        <div>
                          <span className="font-bold text-[#121316]">{issue.jurisdiction}</span>
                          <span className="mx-2 text-[#D8D4C8]">|</span>
                          <span className="text-[#4A4D55]">
                            {Number(issue.latitude).toFixed(4)}°N, {Number(issue.longitude).toFixed(4)}°E
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEmailModal(issue)}
                            className="bg-[#D94E28] hover:bg-[#b83d1b] text-white border border-[#121316] px-3 py-1 font-mono text-xs font-bold transition-colors cursor-pointer"
                          >
                            ✉ DRAFT LEGAL EMAIL
                          </button>
                          <button
                            onClick={() => onUpvote(issue.reference_id)}
                            className="bg-[#F5F3EE] hover:bg-[#121316] hover:text-white text-[#121316] border border-[#121316] px-3 py-1 font-mono text-xs font-bold transition-colors cursor-pointer"
                          >
                            ▲ [{issue.upvotes || 1}]
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Dynamic Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white border-2 border-[#121316] p-5 hard-shadow">
                <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-[#121316] pb-3 mb-4 border-b-2 border-[#121316]">
                  // TOP ENDORSED DOCKETS (LIVE)
                </h3>
                <div className="space-y-3">
                  {issues
                    .slice()
                    .sort((a, b) => (b.upvotes || 1) - (a.upvotes || 1))
                    .slice(0, 5)
                    .map((item, idx) => (
                      <div key={item.reference_id} className="flex items-start gap-3 pb-3 border-b border-[#D8D4C8] last:border-b-0 last:pb-0">
                        <span className="w-6 h-6 bg-[#121316] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          0{idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-[#121316] truncate">
                            {item.reference_id} — {item.category}
                          </p>
                          <span className="font-mono text-[11px] text-[#D94E28] font-semibold">
                            {item.jurisdiction} // {item.upvotes || 1} ENDORSEMENTS
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-white border-2 border-[#121316] p-5 hard-shadow">
                <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-[#121316] pb-3 mb-4 border-b-2 border-[#121316]">
                  // LIVE CORPORATION SUMMARY
                </h3>
                <div className="space-y-3">
                  {municipalityBreakdown.map((m) => (
                    <div key={m.city} className="bg-[#F5F3EE] border border-[#121316] p-3 font-mono text-xs">
                      <div className="flex justify-between font-bold text-[#121316]">
                        <span>{m.city}</span>
                        <span>{m.total} DOCKETS</span>
                      </div>
                      <div className="mt-1 flex justify-between text-[11px] text-[#4A4D55]">
                        <span>Active: {m.pending}</span>
                        <span className="text-[#1B4332] font-bold">Resolved: {m.resolved}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* TAB 2: GIS MAP */}
        {activeTab === 'map' && (
          <div className="bg-white border-2 border-[#121316] hard-shadow overflow-hidden h-[540px]">
            <IssueMap issues={filteredIssues} />
          </div>
        )}

        {/* TAB 3: 100% DYNAMIC ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-2 border-[#121316] p-5 hard-shadow-sm">
                <span className="font-mono text-xs uppercase text-[#4A4D55]">Total Logged Issues</span>
                <p className="font-display text-3xl font-bold text-[#121316] mt-1">{totalCount}</p>
              </div>
              <div className="bg-white border-2 border-[#121316] p-5 hard-shadow-sm">
                <span className="font-mono text-xs uppercase text-[#4A4D55]">Verified &amp; Open</span>
                <p className="font-display text-3xl font-bold text-[#D94E28] mt-1">{verifiedOpenCount}</p>
              </div>
              <div className="bg-white border-2 border-[#121316] p-5 hard-shadow-sm">
                <span className="font-mono text-xs uppercase text-[#4A4D55]">Resolved Dockets</span>
                <p className="font-display text-3xl font-bold text-[#1B4332] mt-1">{resolvedCount}</p>
              </div>
              <div className="bg-white border-2 border-[#121316] p-5 hard-shadow-sm">
                <span className="font-mono text-xs uppercase text-[#4A4D55]">Mean AI Confidence</span>
                <p className="font-display text-3xl font-bold text-[#121316] mt-1">{avgConfidence}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border-2 border-[#121316] p-6 hard-shadow">
                <h3 className="font-display text-lg font-bold text-[#121316] mb-4 pb-2 border-b-2 border-[#121316]">
                  Live Dockets by Municipal Corporation
                </h3>
                <div className="space-y-4">
                  {municipalityBreakdown.map((item) => (
                    <div key={item.city} className="space-y-1.5">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="font-bold text-[#121316]">{item.city}</span>
                        <span>{item.total} REPORTS ({Math.round((item.total / (totalCount || 1)) * 100)}%)</span>
                      </div>
                      <div className="w-full h-3 bg-[#F5F3EE] border border-[#121316]">
                        <div
                          className="h-full bg-[#D94E28]"
                          style={{ width: `${Math.min(100, (item.total / (totalCount || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border-2 border-[#121316] p-6 hard-shadow">
                <h3 className="font-display text-lg font-bold text-[#121316] mb-4 pb-2 border-b-2 border-[#121316]">
                  Live Dockets by Departmental Wing
                </h3>
                <div className="space-y-4">
                  {categoryBreakdown.map((item) => (
                    <div key={item.category} className="space-y-1.5">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="font-bold text-[#121316]">{item.category}</span>
                        <span>{item.total} REPORTS ({Math.round((item.total / (totalCount || 1)) * 100)}%)</span>
                      </div>
                      <div className="w-full h-3 bg-[#F5F3EE] border border-[#121316]">
                        <div
                          className="h-full bg-[#121316]"
                          style={{ width: `${Math.min(100, (item.total / (totalCount || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: 100% DYNAMIC AUDIT HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white border-2 border-[#121316] p-6 hard-shadow">
            <h3 className="font-display text-lg font-bold text-[#121316] mb-4 pb-2 border-b-2 border-[#121316]">
              Chronological PostgreSQL Dispatch Ledger ({issues.length} Records)
            </h3>
            <div className="divide-y divide-[#D8D4C8] font-mono text-xs">
              {issues.map((item) => (
                <div key={item.id || item.reference_id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <img
                      src={item.image_url}
                      alt={item.reference_id}
                      className="w-12 h-12 object-cover border border-[#121316] shrink-0"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold bg-[#121316] text-white px-2 py-0.5">
                          {item.reference_id}
                        </span>
                        <span className="font-bold text-[#D94E28]">
                          [{item.category}]
                        </span>
                        <span className="text-[#121316] font-bold">
                          &rarr; {item.jurisdiction}
                        </span>
                        <span className="text-[#1B4332]">
                          ({item.department_email})
                        </span>
                      </div>
                      <p className="text-[#4A4D55] mt-1 line-clamp-1">
                        {item.ai_summary || item.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block bg-[#F5F3EE] border border-[#121316] px-2 py-1 font-bold">
                      {item.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legal Email Modal */}
      {draftModalIssue && (
        <div className="fixed inset-0 z-50 bg-[#121316]/80 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#121316] hard-shadow max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase text-[#D94E28]">
                  // STATUTORY ESCALATION DISPATCH
                </span>
                <h3 className="font-display text-xl font-bold text-[#121316]">
                  Official Notice — Docket #{draftModalIssue.reference_id}
                </h3>
              </div>
              <button
                onClick={() => setDraftModalIssue(null)}
                className="font-mono text-xs font-bold bg-[#121316] text-white px-3 py-1 cursor-pointer"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#4A4D55] mb-1">To Nodal Email:</label>
                <input
                  type="text"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F3EE] border border-[#121316] font-bold text-[#D94E28]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#4A4D55] mb-1">Subject:</label>
                <input
                  type="text"
                  value={draftSubject}
                  onChange={(e) => setDraftSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F3EE] border border-[#121316] font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#4A4D55] mb-1">Editable Legal Notice:</label>
                <textarea
                  rows={10}
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  className="w-full p-3 bg-[#F5F3EE] border border-[#121316] leading-relaxed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                    draftTo
                  )}&su=${encodeURIComponent(draftSubject)}&body=${encodeURIComponent(draftBody)}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="bg-[#D94E28] hover:bg-[#b83d1b] text-white font-mono text-xs uppercase font-bold py-3 border-2 border-[#121316] hard-shadow-sm cursor-pointer"
              >
                Open in Gmail Web &rarr;
              </button>
              <button
                onClick={() => {
                  window.location.href = `mailto:${encodeURIComponent(draftTo)}?subject=${encodeURIComponent(
                    draftSubject
                  )}&body=${encodeURIComponent(draftBody)}`;
                }}
                className="bg-[#121316] text-white font-mono text-xs uppercase font-bold py-3 border-2 border-[#121316] hard-shadow-sm cursor-pointer"
              >
                Open Default Mail App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}