import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Waves, Moon, Sun, ChevronLeft, ChevronRight, Settings, LogOut, User, BarChart2 } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getLevelProgress, LEVEL_TITLES } from '../utils/dateUtils';

export default function Navbar({ currentMonth, setCurrentMonth }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const levelData = user ? getLevelProgress(user.xp) : null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-full px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">HabitFlow</span>
        </Link>

        {/* Month Navigator (only on dashboard) */}
        {currentMonth && setCurrentMonth && location.pathname === '/' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="w-8 h-8 rounded-lg glass glass-hover flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-900 dark:text-white font-semibold text-sm min-w-[110px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="w-8 h-8 rounded-lg glass glass-hover flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Nav links */}
          <Link
            to="/"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/' ? 'bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 dark:text-brand-400' : 'text-gray-500 hover:text-gray-900 hover:bg-black/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'}`}
          >
            Dashboard
          </Link>
          <Link
            to="/analytics"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/analytics' ? 'bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 dark:text-brand-400' : 'text-gray-500 hover:text-gray-900 hover:bg-black/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'}`}
          >
            <BarChart2 className="w-4 h-4" />
            Analytics
          </Link>

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg glass glass-hover flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* XP Badge */}
          {user && levelData && (
            <div className="hidden md:flex items-center gap-2 glass rounded-xl px-3 py-1.5">
              <span className="text-yellow-400 text-sm">⭐</span>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Lvl {user.level} · {LEVEL_TITLES[user.level]}</div>
                <div className="xp-bar w-20 mt-0.5">
                  <div className="xp-bar-fill" style={{ width: `${levelData.percent}%` }} />
                </div>
              </div>
              <span className="text-xs text-gray-500">{user.xp} XP</span>
            </div>
          )}

          {/* User Avatar + Dropdown */}
          {user && (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center hover:ring-2 hover:ring-brand-500 transition-all"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-bold">{user.username?.[0]?.toUpperCase()}</span>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl py-1 animate-fade-in z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.username}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
