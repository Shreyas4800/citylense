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
    'Environment & Gardens'
  ];

  const filteredIssues = issues.filter((issue) => {
    const matchesCity =
      selectedMunicipality === 'All Jurisdictions' ||
      issue.jurisdiction === selectedMunicipality;
    const matchesCat =
      selectedCategory === 'all' ||
      issue.category === selectedCategory;
    return matchesCity && matchesCat;
  });

  const totalCount = issues.length;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;
  const inProgressCount = issues.filter((i) => i.status === 'in-progress').length;
  const verifiedOpenCount = totalCount - resolvedCount - inProgressCount;

  const cityCountsMap = {};
  issues.forEach((i) => {
    const c = i.jurisdiction || 'Kolhapur (KMC)';
    if (!cityCountsMap[c]) cityCountsMap[c] = { city: c, total: 0 };
    cityCountsMap[c].total += 1;
  });
  const municipalityBreakdown = Object.values(cityCountsMap).sort((a, b) => b.total - a.total);

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

    const subject = `[Docket #${issue.reference_id}] ${issue.category} Issue — ${issue.jurisdiction}`;
    const body = `To,
The Nodal Officer (${issue.category}),
${issue.jurisdiction} Municipal Corporation.

Subject: Urgent Action Requested for Verified Docket #${issue.reference_id}

Respected Sir / Madam,

Please find the details of a verified civic defect in ${issue.jurisdiction}:

- Reference ID : ${issue.reference_id}
- Category     : ${issue.category}
- Assessment   : ${issue.ai_summary || issue.description}
- Coordinates  : ${lat}° N, ${lng}° E
- Google Maps  : https://www.google.com/maps?q=${lat},${lng}
- Photo URL    : ${issue.image_url}

Kindly initiate field inspection and resolution.

Sincerely,
${user?.name || 'Citizen Reporter'}
${user?.email || ''}`;

    setDraftTo(targetEmail);
    setDraftSubject(subject);
    setDraftBody(body);
    setDraftModalIssue(issue);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] py-6 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
        {/* Compact Header */}
        <div className="bg-white border-2 border-[#121316] p-4 sm:p-5 hard-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-[#121316]">
            Public Feed ({filteredIssues.length})
          </h1>

          <div className="flex items-center gap-2">
            <select
              value={selectedMunicipality}
              onChange={(e) => setSelectedMunicipality(e.target.value)}
              className="flex-1 sm:flex-initial bg-[#F5F3EE] border-2 border-[#121316] text-[#121316] font-mono text-xs px-3 py-2 font-semibold focus:outline-none"
            >
              {MUNICIPALITIES.map((mun) => (
                <option key={mun} value={mun}>{mun}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={onRefresh}
              className="bg-[#121316] hover:bg-[#D94E28] text-white font-mono text-xs uppercase font-bold px-3 py-2 border-2 border-[#121316] cursor-pointer"
            >
              ↻ Sync
            </button>
          </div>
        </div>

        {/* Clean 4-Tab Bar */}
        <div className="grid grid-cols-4 border-2 border-[#121316] bg-white">
          {[
            { id: 'feed', label: 'Feed' },
            { id: 'map', label: 'Map' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'history', label: 'History' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-2 font-mono text-xs uppercase font-bold border-r border-[#121316] last:border-r-0 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#121316] text-white'
                  : 'bg-white text-[#121316] hover:bg-[#F5F3EE]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: FEED */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 font-mono text-xs uppercase shrink-0 border cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#D94E28] text-white border-[#121316] font-bold'
                      : 'bg-white text-[#121316] border-[#121316]'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="bg-white border-2 border-[#121316] p-10 text-center font-mono text-xs">
                Loading reports...
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="bg-white border-2 border-[#121316] p-10 text-center font-mono text-xs text-[#4A4D55]">
                No reports match this filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id || issue.reference_id}
                    className="bg-white border-2 border-[#121316] hard-shadow flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      <div className="h-48 bg-[#E5E2D9] border-b-2 border-[#121316] relative">
                        <img
                          src={issue.image_url}
                          alt={issue.category}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-[#121316] text-white font-mono text-[10px] font-bold px-2 py-0.5">
                          {issue.reference_id}
                        </span>
                        <span className="absolute top-2 right-2 bg-white text-[#121316] border border-[#121316] font-mono text-[10px] font-bold px-2 py-0.5">
                          {issue.category}
                        </span>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                          <span className="font-bold text-[#D94E28]">{issue.jurisdiction}</span>
                          <span className="text-[#4A4D55] text-[11px]">{issue.date}</span>
                        </div>
                        <p className="text-sm text-[#121316] leading-relaxed line-clamp-3">
                          {issue.ai_summary || issue.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-[#F5F3EE] border-t-2 border-[#121316] flex items-center justify-between gap-2 font-mono text-xs">
                      <button
                        onClick={() => openEmailModal(issue)}
                        className="bg-[#D94E28] hover:bg-[#b83d1b] text-white border border-[#121316] px-3 py-1.5 font-bold cursor-pointer"
                      >
                        ✉ Legal Email
                      </button>
                      <button
                        onClick={() => onUpvote(issue.reference_id)}
                        className="bg-white hover:bg-[#121316] hover:text-white text-[#121316] border border-[#121316] px-3 py-1.5 font-bold cursor-pointer"
                      >
                        ▲ Upvote ({issue.upvotes || 1})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MAP */}
        {activeTab === 'map' && (
          <div className="bg-white border-2 border-[#121316] hard-shadow overflow-hidden h-[500px]">
            <IssueMap issues={filteredIssues} />
          </div>
        )}

        {/* TAB 3: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white border-2 border-[#121316] p-4 hard-shadow-sm">
                <span className="font-mono text-[11px] uppercase text-[#4A4D55]">Total</span>
                <p className="font-display text-2xl sm:text-3xl font-bold text-[#121316] mt-1">{totalCount}</p>
              </div>
              <div className="bg-white border-2 border-[#121316] p-4 hard-shadow-sm">
                <span className="font-mono text-[11px] uppercase text-[#4A4D55]">Open</span>
                <p className="font-display text-2xl sm:text-3xl font-bold text-[#D94E28] mt-1">{verifiedOpenCount}</p>
              </div>
              <div className="bg-white border-2 border-[#121316] p-4 hard-shadow-sm">
                <span className="font-mono text-[11px] uppercase text-[#4A4D55]">Resolved</span>
                <p className="font-display text-2xl sm:text-3xl font-bold text-[#1B4332] mt-1">{resolvedCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border-2 border-[#121316] p-5 hard-shadow">
                <h3 className="font-display text-base font-bold text-[#121316] mb-4 pb-2 border-b-2 border-[#121316]">
                  By Municipality
                </h3>
                <div className="space-y-3">
                  {municipalityBreakdown.map((item) => (
                    <div key={item.city} className="space-y-1">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="font-bold">{item.city}</span>
                        <span>{item.total}</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#F5F3EE] border border-[#121316]">
                        <div
                          className="h-full bg-[#D94E28]"
                          style={{ width: `${Math.min(100, (item.total / (totalCount || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border-2 border-[#121316] p-5 hard-shadow">
                <h3 className="font-display text-base font-bold text-[#121316] mb-4 pb-2 border-b-2 border-[#121316]">
                  By Department
                </h3>
                <div className="space-y-3">
                  {categoryBreakdown.map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="font-bold">{item.category}</span>
                        <span>{item.total}</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#F5F3EE] border border-[#121316]">
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

        {/* TAB 4: HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white border-2 border-[#121316] p-4 sm:p-6 hard-shadow">
            <div className="divide-y divide-[#D8D4C8] font-mono text-xs">
              {issues.map((item) => (
                <div key={item.id || item.reference_id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image_url}
                      alt={item.reference_id}
                      className="w-10 h-10 object-cover border border-[#121316] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold bg-[#121316] text-white px-1.5 py-0.5 text-[10px]">
                          {item.reference_id}
                        </span>
                        <span className="font-bold text-[#D94E28] truncate">
                          {item.jurisdiction}
                        </span>
                      </div>
                      <p className="text-[#4A4D55] truncate mt-0.5">{item.category}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#4A4D55] shrink-0">{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legal Email Modal */}
      {draftModalIssue && (
        <div className="fixed inset-0 z-50 bg-[#121316]/80 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#121316] hard-shadow max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
              <h3 className="font-display text-lg font-bold text-[#121316]">
                Legal Notice — #{draftModalIssue.reference_id}
              </h3>
              <button
                onClick={() => setDraftModalIssue(null)}
                className="font-mono text-xs font-bold bg-[#121316] text-white px-2.5 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#4A4D55] mb-1">To:</label>
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
                <label className="block text-[10px] uppercase font-bold text-[#4A4D55] mb-1">Notice:</label>
                <textarea
                  rows={8}
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  className="w-full p-3 bg-[#F5F3EE] border border-[#121316] leading-relaxed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => {
                  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                    draftTo
                  )}&su=${encodeURIComponent(draftSubject)}&body=${encodeURIComponent(draftBody)}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="bg-[#D94E28] text-white font-mono text-xs uppercase font-bold py-3 border-2 border-[#121316] hard-shadow-sm cursor-pointer"
              >
                Open in Gmail &rarr;
              </button>
              <button
                onClick={() => {
                  window.location.href = `mailto:${encodeURIComponent(draftTo)}?subject=${encodeURIComponent(
                    draftSubject
                  )}&body=${encodeURIComponent(draftBody)}`;
                }}
                className="bg-[#121316] text-white font-mono text-xs uppercase font-bold py-3 border-2 border-[#121316] hard-shadow-sm cursor-pointer"
              >
                Open Mail App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}