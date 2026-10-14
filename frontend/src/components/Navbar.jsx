import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#F5F3EE] border-b-2 border-[#121316]">
        <div className="bg-[#121316] text-[#D8D4C8] text-[10px] sm:text-[11px] font-mono py-1.5 px-4 sm:px-6 lg:px-8 border-b border-[#2A2D34]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                AZURE POSTGRESQL + BLOB: CONNECTED
              </span>
              <span className="hidden sm:inline text-[#6E727D]">|</span>
              <span className="hidden sm:inline">MAHARASHTRA CORPORATIONS (10/10)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-[#10B981]">AUTO-SOCIAL PIPELINE: ACTIVE</span>
              <Link
                to="/admin"
                className="text-[#D8D4C8] hover:text-white bg-[#2A2D34] px-2 py-0.5 border border-[#4A4D55] font-bold"
              >
                🔒 NODAL ADMIN
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#D94E28] border-2 border-[#121316] hard-shadow-sm flex items-center justify-center text-white font-display font-bold text-base sm:text-lg tracking-tighter">
                CL
              </div>
              <div>
                <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-[#121316] block leading-none">
                  CITYLENSE
                </span>
                <span className="font-mono text-[9px] sm:text-[10px] tracking-widest uppercase text-[#4A4D55] block mt-1">
                  Civic Triage &amp; GIS Registry
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center border-l-2 border-[#D8D4C8] pl-5 gap-1.5">
              {[
                { path: '/', label: '01 / Overview' },
                { path: '/feed', label: '02 / Public Dockets' },
                { path: '/report', label: '03 / File Inspection' }
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition-all border ${
                    isActive(item.path)
                      ? 'bg-[#121316] text-white border-[#121316] font-semibold'
                      : 'bg-transparent text-[#121316] border-transparent hover:border-[#121316] hover:bg-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] bg-white border border-[#121316] px-2.5 py-1.5 font-semibold truncate max-w-[130px]">
                  {user.name.toUpperCase()}
                </span>
                <button
                  onClick={onLogout}
                  className="text-[11px] font-mono uppercase tracking-wider text-[#121316] hover:bg-[#121316] hover:text-white border border-[#121316] px-2.5 py-1.5 transition-colors cursor-pointer"
                >
                  Exit
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-mono text-xs uppercase tracking-wider font-semibold text-[#121316] hover:underline px-2 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/report"
                  className="bg-[#D94E28] hover:bg-[#b83d1b] text-white font-mono text-[11px] sm:text-xs uppercase tracking-wider font-bold px-3 sm:px-4 py-2 border-2 border-[#121316] hard-shadow-sm"
                >
                  + File Report
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[#121316] grid grid-cols-4 font-mono text-[10px] uppercase font-bold">
        {[
          { path: '/', label: '01 Home' },
          { path: '/feed', label: '02 Registry' },
          { path: '/report', label: '03 Report' },
          { path: user ? '/' : '/login', label: user ? user.name.slice(0, 7) : '04 Sign In' }
        ].map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`py-3 text-center border-r border-[#D8D4C8] last:border-r-0 ${
              isActive(item.path)
                ? 'bg-[#121316] text-white'
                : 'text-[#121316] hover:bg-[#F5F3EE]'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}