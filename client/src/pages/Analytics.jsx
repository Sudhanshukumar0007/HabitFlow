import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { Flame, Trophy, TrendingDown, Star, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { analyticsApi } from '../api/analyticsApi';
import { habitApi } from '../api/habitApi';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const HEATMAP_COLORS = ['#1f2937', '#1e3a5f', '#1e4d8c', '#1d5fa3', '#1e6fba', '#3b82f6', '#60a5fa'];
const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#f43f5e', '#6b7280'];

function HeatmapGrid({ data }) {
  if (!data || data.length === 0) return null;
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap gap-0.5 min-w-max">
        {data.map((day) => {
          const intensity = day.count / maxCount;
          const opacity = day.count === 0 ? 0.1 : 0.2 + intensity * 0.8;
          return (
            <div
              key={day.date}
              className="w-3 h-3 rounded-sm cursor-pointer transition-transform hover:scale-125"
              style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})` }}
              title={`${day.date}: ${day.count} habit${day.count !== 1 ? 's' : ''} completed`}
            />
          );
        })}
      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
    <div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl">
      <div className="text-sm font-medium text-white mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="text-sm" style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [monthly, setMonthly] = useState(null);
  const [habits, setHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState('');
  const [habitTrend, setHabitTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, h, m, habitsData] = await Promise.all([
          analyticsApi.getSummary(),
          analyticsApi.getHeatmap(),
          analyticsApi.getMonthly(),
          habitApi.getAll(),
        ]);
        setSummary(s);
        setHeatmap(h);
        setMonthly(m);
        setHabits(habitsData.filter((h) => !h.isDeleted && !h.isArchived));
        if (habitsData.length > 0) setSelectedHabit(habitsData[0]._id);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedHabit) return;
    analyticsApi.getHabitTrend(selectedHabit).then(setHabitTrend).catch(() => {});
  }, [selectedHabit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Your habit performance at a glance</p>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="🔥" label="Best Streak" value={`${summary.bestStreak}d`} sub={summary.bestStreakHabitName} color="bg-orange-500/20" />
            <StatCard icon="🏆" label="Best Habit This Month" value={summary.bestHabitThisMonth || '—'} color="bg-yellow-500/20" />
            <StatCard icon="📉" label="Needs Attention" value={summary.needsAttention || '—'} color="bg-red-500/20" />
            <StatCard icon="⭐" label="XP This Month" value={`+${summary.totalXPThisMonth}`} sub={`Total: ${summary.userXP} XP`} color="bg-brand-500/20" />
          </div>
        )}

        {/* Heatmap */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">Year Activity Heatmap</h2>
          <HeatmapGrid data={heatmap} />
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
            <span>Less</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((o) => (
              <div key={o} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(99, 102, 241, ${o})` }} />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Monthly Bar Chart */}
        {monthly && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-lg font-bold text-white mb-4">6-Month Trend</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthly.months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="totalCompletions" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completions" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Donut Chart */}
            <div className="card">
              <h2 className="text-lg font-bold text-white mb-4">Category Breakdown</h2>
              {monthly.categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={monthly.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      nameKey="name"
                    >
                      {monthly.categoryBreakdown.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(v) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-600">No data yet this month</div>
              )}
            </div>
          </div>
        )}

        {/* Per-Habit Trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Habit Trend (6 months)</h2>
            <select
              className="input-field w-auto text-sm py-1.5"
              value={selectedHabit}
              onChange={(e) => setSelectedHabit(e.target.value)}
            >
              {habits.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
          </div>

          {habitTrend && (
            <>
              <div className="flex flex-wrap gap-4 mb-4">
                {[
                  { label: 'Current Streak', value: `🔥 ${habitTrend.currentStreak}d` },
                  { label: 'Longest Streak', value: `🏆 ${habitTrend.longestStreak}d` },
                  { label: 'Total Completions', value: `✅ ${habitTrend.totalCompletions}` },
                ].map((stat) => (
                  <div key={stat.label} className="glass rounded-xl px-4 py-2">
                    <div className="text-sm font-semibold text-white">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={habitTrend.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="completions"
                    stroke={habits.find((h) => h._id === selectedHabit)?.color || '#6366f1'}
                    strokeWidth={2.5}
                    dot={{ fill: '#1f2937', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Completions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Per-Habit Stats Cards */}
        {habits.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Habit Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {habits.map((habit) => {
                const monthCompletions = habit.completedDates?.filter(
                  (d) => format(new Date(d), 'yyyy-MM') === format(new Date(), 'yyyy-MM')
                ).length || 0;
                const rate = habit.goal > 0 ? Math.round((monthCompletions / habit.goal) * 100) : 0;
                return (
                  <div key={habit._id} className="card hover:border-gray-700 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }} />
                      <span className="font-semibold text-white text-sm">{habit.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="glass rounded-lg p-2 text-center">
                        <div className="font-bold text-white">{rate}%</div>
                        <div className="text-xs text-gray-500">This Month</div>
                      </div>
                      <div className="glass rounded-lg p-2 text-center">
                        <div className="font-bold text-orange-400">🔥 {habit.currentStreak}</div>
                        <div className="text-xs text-gray-500">Current</div>
                      </div>
                      <div className="glass rounded-lg p-2 text-center">
                        <div className="font-bold text-yellow-400">🏆 {habit.longestStreak}</div>
                        <div className="text-xs text-gray-500">Best Ever</div>
                      </div>
                      <div className="glass rounded-lg p-2 text-center">
                        <div className="font-bold text-brand-400">{habit.completedDates?.length || 0}</div>
                        <div className="text-xs text-gray-500">All Time</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Monthly Goal</span>
                        <span>{monthCompletions}/{habit.goal}</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: habit.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
