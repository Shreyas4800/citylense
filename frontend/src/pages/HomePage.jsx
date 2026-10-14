import { Link } from 'react-router-dom';
import IssueMap from '../components/IssueMap';

export default function HomePage({ issues = [], loading }) {
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;
  const recentIssues = issues.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F3EE] text-[#121316] pb-16 md:pb-0">
      <main className="flex-1">
        {/* Clean Split Hero */}
        <section className="border-b-2 border-[#121316] bg-grid-pattern">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              <div className="lg:col-span-5 flex flex-col justify-between bg-white border-2 border-[#121316] p-6 sm:p-8 hard-shadow">
                <div className="space-y-4">
                  <span className="inline-block font-mono text-[11px] font-bold uppercase tracking-wider text-[#D94E28] bg-[#FFE8E0] border border-[#D94E28] px-2.5 py-0.5">
                    AI Civic Triage
                  </span>

                  <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#121316] leading-[1.08]">
                    Report. Verify. Transform.
                  </h1>

                  <p className="text-sm sm:text-base text-[#4A4D55] leading-relaxed">
                    Capture civic defects with geo-tagged photos. AI verifies the issue and routes it directly to the nearest municipal department.
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t-2 border-[#121316] flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/report"
                    className="flex-1 bg-[#D94E28] hover:bg-[#b83d1b] text-white text-center font-mono text-xs uppercase tracking-wider font-bold py-3.5 px-5 border-2 border-[#121316] hard-shadow-sm transition-all"
                  >
                    Report an Issue &rarr;
                  </Link>
                  <Link
                    to="/feed"
                    className="flex-1 bg-white hover:bg-[#F5F3EE] text-[#121316] text-center font-mono text-xs uppercase tracking-wider font-bold py-3.5 px-5 border-2 border-[#121316] transition-colors"
                  >
                    Public Feed ({issues.length})
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col bg-white border-2 border-[#121316] hard-shadow overflow-hidden">
                <div className="bg-[#121316] text-white px-4 py-2 flex items-center justify-between font-mono text-xs">
                  <span>LIVE ISSUE MAP</span>
                  <span className="text-[#10B981]">{issues.length} PINS</span>
                </div>
                <div className="flex-1 min-h-[320px]">
                  <IssueMap issues={issues} />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Compact 4-Stat Strip */}
        <section className="border-b-2 border-[#121316] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-[#121316]">
              <div className="py-4 sm:py-5 px-4">
                <div className="font-mono text-[11px] uppercase text-[#4A4D55]">Total Reports</div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-[#121316] mt-1">{issues.length}</div>
              </div>
              <div className="py-4 sm:py-5 px-4">
                <div className="font-mono text-[11px] uppercase text-[#4A4D55]">AI Verified</div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-[#D94E28] mt-1">{issues.length}</div>
              </div>
              <div className="py-4 sm:py-5 px-4">
                <div className="font-mono text-[11px] uppercase text-[#4A4D55]">Resolved</div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-[#1B4332] mt-1">{resolvedCount}</div>
              </div>
              <div className="py-4 sm:py-5 px-4">
                <div className="font-mono text-[11px] uppercase text-[#4A4D55]">Corporations</div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-[#121316] mt-1">10</div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Reports */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-[#121316]">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#121316]">
              Recent Reports
            </h2>
            <Link
              to="/feed"
              className="font-mono text-xs uppercase font-bold bg-white border-2 border-[#121316] px-3.5 py-2 hard-shadow-sm hover:bg-[#121316] hover:text-white transition-colors"
            >
              View All &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="bg-white border-2 border-[#121316] p-8 text-center font-mono text-xs">
              Loading recent reports...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recentIssues.map((issue) => (
                <article
                  key={issue.id || issue.reference_id}
                  className="bg-white border-2 border-[#121316] hard-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="bg-[#121316] text-white px-3.5 py-1.5 flex items-center justify-between font-mono text-[11px]">
                      <span>{issue.reference_id}</span>
                      <span className="text-[#10B981]">{issue.category}</span>
                    </div>

                    <div className="h-44 bg-[#E5E2D9] border-b-2 border-[#121316] overflow-hidden">
                      <img
                        src={issue.image_url}
                        alt={issue.category}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-4">
                      <div className="font-mono text-[11px] font-bold text-[#D94E28] mb-1">
                        {issue.jurisdiction}
                      </div>
                      <p className="text-sm text-[#121316] line-clamp-2 leading-snug">
                        {issue.ai_summary || issue.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 bg-[#F5F3EE] border-t-2 border-[#121316] flex items-center justify-between font-mono text-[11px] text-[#4A4D55]">
                    <span>{issue.status || 'verified'}</span>
                    <span>{issue.date}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}