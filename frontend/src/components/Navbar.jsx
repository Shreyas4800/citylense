import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#F5F3EE] border-b-2 border-[#121316]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#D94E28] border-2 border-[#121316] hard-shadow-sm flex items-center justify-center text-white font-display font-bold text-sm sm:text-base">
                CL
              </div>
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-[#121316]">
                CITYLENSE
              </span>
            </Link>

            <nav className="hidden md:flex items-center border-l-2 border-[#D8D4C8] pl-5 gap-1.5">
              {[
                { path: '/', label: 'Overview' },
                { path: '/feed', label: 'Public Feed' },
                { path: '/report', label: 'Report Issue' }
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-all border ${
                    isActive(item.path)
                      ? 'bg-[#121316] text-white border-[#121316] font-semibold'
                      : 'text-[#121316] border-transparent hover:border-[#121316] hover:bg-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/admin"
              className="font-mono text-[11px] text-[#4A4D55] hover:text-[#121316] px-2 py-1 border border-transparent hover:border-[#121316]"
              title="Nodal Admin Console"
            >
              Admin
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block font-mono text-xs bg-white border border-[#121316] px-2.5 py-1 font-semibold truncate max-w-[120px]">
                  {user.name}
                </span>
                <button
                  onClick={onLogout}
                  className="text-xs font-mono uppercase text-[#121316] hover:bg-[#121316] hover:text-white border border-[#121316] px-2.5 py-1 transition-colors cursor-pointer"
                >
                  Exit
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="font-mono text-xs uppercase font-semibold text-[#121316] hover:underline px-2 py-1"
              >
                Sign In
              </Link>
            )}

            <Link
              to="/report"
              className="bg-[#D94E28] hover:bg-[#b83d1b] text-white font-mono text-xs uppercase font-bold px-3 sm:px-4 py-2 border-2 border-[#121316] hard-shadow-sm"
            >
              + Report
            </Link>
          </div>
        </div>
      </header>

      {/* Clean Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[#121316] grid grid-cols-4 font-mono text-[11px] uppercase font-bold">
        {[
          { path: '/', label: 'Home' },
          { path: '/feed', label: 'Feed' },
          { path: '/report', label: 'Report' },
          { path: user ? '/admin' : '/login', label: user ? 'Admin' : 'Sign In' }
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