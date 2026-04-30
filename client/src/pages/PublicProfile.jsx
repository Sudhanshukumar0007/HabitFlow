import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Waves, Flame, Lock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { userApi } from '../api/habitApi';
import toast from 'react-hot-toast';

function MiniHeatmap({ completedDates }) {
  const counts = {};
  completedDates?.forEach((d) => {
    const key = format(new Date(d), 'yyyy-MM-dd');
    counts[key] = (counts[key] || 0) + 1;
  });

  const last90 = Array.from({ length: 90 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (89 - i));
    const key = format(d, 'yyyy-MM-dd');
    return { key, count: counts[key] || 0 };
  });

  return (
    <div className="flex flex-wrap gap-0.5">
      {last90.map((day) => (
        <div
          key={day.key}
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: day.count > 0 ? `rgba(99,102,241,0.8)` : 'rgba(156, 163, 175, 0.2)' }}
          title={`${day.key}: ${day.count}`}
        />
      ))}
    </div>
  );
}

export default function PublicProfile() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    userApi.getPublicProfile(username)
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center text-center p-8">
        <Lock className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h1>
        <p className="text-gray-500 dark:text-gray-500">This profile is private or doesn't exist.</p>
      </div>
    );
  }

  const { user, habits } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">HabitFlow</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
        <div className="card flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
            {user.avatar ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" /> : user.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.username}</h1>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Level {user.level} · {user.xp} XP</div>
            {user.badges?.length > 0 && (
              <div className="flex gap-1 mt-2">
                {user.badges.map((b) => <span key={b.id} title={b.name} className="text-lg">{b.name?.split(' ')[0]}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* Habits */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Current Habits</h2>
          <div className="space-y-3">
            {habits.map((habit) => (
              <div key={habit._id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }} />
                    <span className="font-medium text-gray-900 dark:text-white">{habit.name}</span>
                    <span className="text-xs text-gray-500">{habit.category}</span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-400 text-sm font-medium">
                    <Flame className="w-4 h-4" />
                    {habit.currentStreak}d streak
                  </div>
                </div>
                <MiniHeatmap completedDates={habit.completedDates} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
