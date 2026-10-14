import { Link } from 'react-router-dom';
import IssueMap from '../components/IssueMap';

export default function HomePage({ issues = [], loading }) {
  const verifiedCount = issues.length;
  const recentIssues = issues.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F3EE] text-[#121316]">
      <main className="flex-1">
        <section className="border-b-2 border-[#121316] bg-grid-pattern">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-between bg-white border-2 border-[#121316] p-6 sm:p-8 hard-shadow">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-[#D8D4C8] pb-3">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#D94E28]">
                      // MUNICIPAL E-GOVERNANCE INFRASTRUCTURE
                    </span>
                    <span className="font-mono text-[11px] bg-[#121316] text-white px-2 py-0.5">
                      LIVE DB
                    </span>
                  </div>

                  <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#121316] leading-[1.06]">
                    Geo-Verified Civic Accountability.
                  </h1>

                  <p className="text-base text-[#4A4D55] leading-relaxed">
                    Field photographs are authenticated by computer vision, stored in Azure Blob Storage (`citylense-evidence`), and spatially routed via <span className="font-mono text-xs bg-[#F5F3EE] px-1.5 py-0.5 border border-[#D8D4C8] text-[#121316]">ST_DistanceSphere</span> to the nearest Maharashtra municipal corporation.
                  </p>

                  <div className="pt-2">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#4A4D55] mb-2">
                      Active Spatial Routing Nodes:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Kolhapur (KMC)', 'Ichalkaranji (IMC)', 'Pune (PMC)', 'Brihanmumbai (BMC)', 'Nagpur (NMC)', 'Nashik', 'Thane', 'PCMC'].map((corp) => (
                        <span
                          key={corp}
                          className="font-mono text-[11px] px-2.5 py-1 bg-[#F5F3EE] border border-[#121316] text-[#121316] font-medium"
                        >
                          {corp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t-2 border-[#121316] flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/report"
                    className="flex-1 bg-[#D94E28] hover:bg-[#b83d1b] text-white text-center font-mono text-xs uppercase tracking-wider font-bold py-3.5 px-6 border-2 border-[#121316] hard-shadow-sm transition-all"
                  >
                    Initialize Field Report &rarr;
                  </Link>
                  <Link
                    to="/feed"
                    className="flex-1 bg-white hover:bg-[#F5F3EE] text-[#121316] text-center font-mono text-xs uppercase tracking-wider font-bold py-3.5 px-6 border-2 border-[#121316] transition-colors"
                  >
                    Inspect Public Ledger ({issues.length})
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 flex flex-col bg-white border-2 border-[#121316] hard-shadow overflow-hidden">
                <div className="bg-[#121316] text-white px-4 py-2.5 flex items-center justify-between font-mono text-xs">
                  <span>LIVE SPATIAL TELEMETRY // MAHARASHTRA GRID</span>
                  <span className="text-[#10B981]">{issues.length} DB PINS</span>
                </div>
                <div className="flex-1 min-h-[360px]">
                  <IssueMap issues={issues} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-[#121316] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-[#121316]">
              <div className="py-6 px-4 sm:px-6">
                <div className="font-mono text-[11px] uppercase tracking-widest text-[#4A4D55]">01 // Total Logged Dockets</div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-display text-4xl font-bold text-[#121316] tabular-nums">{issues.length}</span>
                  <span className="font-mono text-[11px] text-[#1B4332] bg-[#D8F3DC] border border-[#1B4332] px-2 py-0.5 font-semibold">
                    POSTGRESQL
                  </span>
                </div>
              </div>

              <div className="py-6 px-4 sm:px-6">
                <div className="font-mono text-[11px] uppercase tracking-widest text-[#4A4D55]">02 // Vision Authenticated</div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-display text-4xl font-bold text-[#121316] tabular-nums">{verifiedCount}</span>
                  <span className="font-mono text-[11px] text-[#D94E28] bg-[#FFE8E0] border border-[#D94E28] px-2 py-0.5 font-semibold">
                    LIVE BLOB
                  </span>
                </div>
              </div>

              <div className="py-6 px-4 sm:px-6">
                <div className="font-mono text-[11px] uppercase tracking-widest text-[#4A4D55]">03 // Indexed Municipalities</div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-display text-4xl font-bold text-[#121316] tabular-nums">10</span>
                  <span className="font-mono text-[11px] text-[#121316] bg-[#F5F3EE] border border-[#121316] px-2 py-0.5">
                    POSTGIS
                  </span>
                </div>
              </div>

              <div className="py-6 px-4 sm:px-6">
                <div className="font-mono text-[11px] uppercase tracking-widest text-[#4A4D55]">04 // Nodal Department Lines</div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-display text-4xl font-bold text-[#121316] tabular-nums">80</span>
                  <span className="font-mono text-[11px] text-[#121316] bg-[#F5F3EE] border border-[#121316] px-2 py-0.5">
                    DIRECT EMAIL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b-2 border-[#121316] gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#D94E28] font-bold">
                // LIVE DATABASE ARCHIVE (NEWEST FIRST)
              </span>
              <h2 className="font-display text-3xl font-bold text-[#121316] mt-1">
                Recent Verified Dispatches
              </h2>
            </div>
            <Link
              to="/feed"
              className="font-mono text-xs uppercase tracking-wider font-bold bg-white border-2 border-[#121316] px-4 py-2.5 hard-shadow-sm hover:bg-[#121316] hover:text-white transition-colors self-start sm:self-auto"
            >
              Open Full Registry ({issues.length}) &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="bg-white border-2 border-[#121316] p-12 text-center font-mono text-sm">
              LOADING RECENT DISPATCHES FROM AZURE POSTGRESQL...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentIssues.map((issue) => (
                <article
                  key={issue.id || issue.reference_id}
                  className="bg-white border-2 border-[#121316] hard-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="bg-[#121316] text-white px-4 py-2 flex items-center justify-between font-mono text-xs">
                      <span className="font-bold text-[#F5F3EE]">{issue.reference_id}</span>
                      <span className="text-[#10B981] uppercase">{issue.category}</span>
                    </div>

                    <div className="h-48 bg-[#E5E2D9] border-b-2 border-[#121316] relative overflow-hidden">
                      <img
                        src={issue.image_url}
                        alt={issue.title || issue.category}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-[#121316]/90 text-white font-mono text-[10px] px-2 py-1 border border-white/20">
                        {Number(issue.latitude).toFixed(4)}°N, {Number(issue.longitude).toFixed(4)}°E
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#D94E28] mb-1">
                        JURISDICTION // {issue.jurisdiction}
                      </div>
                      <h3 className="font-display font-bold text-lg text-[#121316] leading-snug mb-2">
                        {issue.title || `${issue.category} Defect`}
                      </h3>
                      <p className="text-sm text-[#4A4D55] line-clamp-3 leading-relaxed">
                        {issue.ai_summary || issue.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-[#F5F3EE] border-t-2 border-[#121316] flex items-center justify-between font-mono text-[11px] text-[#121316]">
                    <span>CONF: {Math.round((issue.confidence || 0.95) * 100)}%</span>
                    <span className="font-bold">{issue.date}</span>
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