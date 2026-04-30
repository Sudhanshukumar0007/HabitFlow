import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, User, Bell, Shield, Archive, Download, Loader2, LogOut, ExternalLink, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi, habitApi } from '../api/habitApi';
import { BADGES } from '../utils/badgeUtils';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const Section = ({ title, icon: Icon, children }) => (
  <div className="card space-y-4">
    <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-800">
      <Icon className="w-5 h-5 text-brand-500 dark:text-brand-400" />
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
    </div>
    {children}
  </div>
);

export default function Settings() {
  const { user, logout, updateUser, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [archivedHabits, setArchivedHabits] = useState([]);
  const [profile, setProfile] = useState({
    username: user?.username || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    isPublic: user?.isPublic || false,
    notificationsEnabled: user?.notificationsEnabled || false,
    dailyDigestTime: user?.dailyDigestTime || '08:00',
    reminderEmail: user?.reminderEmail || '',
  });
  const [pwForm, setPwForm] = useState({ password: '', newPassword: '' });

  useEffect(() => {
    habitApi.getAll().then((habits) => {
      setArchivedHabits(habits.filter((h) => h.isArchived));
    }).catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const updated = await userApi.updateSettings(profile);
      updateUser(updated);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.password || !pwForm.newPassword) {
      toast.error('Fill in both password fields');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await userApi.updateSettings(pwForm);
      toast.success('Password updated!');
      setPwForm({ password: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data. This cannot be undone.')) return;
    if (!confirm('Last chance — are you absolutely sure?')) return;
    try {
      await userApi.deleteAccount();
      logout();
      navigate('/login');
      toast.success('Account deleted');
    } catch {
      toast.error('Failed to delete account');
    }
  };

  const handleUnarchive = async (id) => {
    try {
      await habitApi.archive(id);
      setArchivedHabits((prev) => prev.filter((h) => h._id !== id));
      toast.success('Habit unarchived');
    } catch {
      toast.error('Failed to unarchive');
    }
  };

  const earnedBadgeIds = user?.badges?.map((b) => b.id) || [];
  const ALL_BADGES = [
    { id: 'launcher', name: '🚀 Launcher', description: 'Add your first 3 habits' },
    { id: 'on_fire', name: '🔥 On Fire', description: '7-day streak on any habit' },
    { id: 'diamond_discipline', name: '💎 Diamond Discipline', description: '30-day streak' },
    { id: 'perfect_week', name: '📅 Perfect Week', description: 'All habits done Mon–Sun' },
    { id: 'perfect_month', name: '🏆 Perfect Month', description: '100% completion in a month' },
    { id: 'scholar', name: '🧠 Scholar', description: 'Complete a Learning habit 20 times' },
    { id: 'early_bird', name: '🌅 Early Bird', description: 'All habits before 9am (3 days)' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile */}
        <Section title="Profile" icon={User}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
              <input
                className="input-field"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                className="input-field"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Avatar URL</label>
              <input
                className="input-field"
                value={profile.avatar}
                onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between p-3 glass rounded-xl border border-gray-200 dark:border-transparent">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">Public Profile</div>
                <div className="text-xs text-gray-500">Allow others to view your habit grid</div>
              </div>
              <button
                onClick={() => setProfile({ ...profile, isPublic: !profile.isPublic })}
                className={clsx('w-12 h-6 rounded-full transition-all duration-200 relative', profile.isPublic ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700')}
              >
                <div className={clsx('absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200', profile.isPublic ? 'right-1' : 'left-1')} />
              </button>
            </div>
            {profile.isPublic && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <ExternalLink className="w-4 h-4" />
                Public link: <a href={`/u/${user?.username}`} className="text-brand-500 dark:text-brand-400 hover:underline" target="_blank">/u/{user?.username}</a>
              </div>
            )}
            <button onClick={handleSaveProfile} className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Profile
            </button>
          </div>
        </Section>

        {/* Password */}
        <Section title="Change Password" icon={Lock}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
              <input type="password" className="input-field" value={pwForm.password} onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
              <input type="password" className="input-field" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
            </div>
            <button onClick={handleChangePassword} className="btn-secondary w-full" disabled={loading}>
              Update Password
            </button>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon={Bell}>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 glass rounded-xl border border-gray-200 dark:border-transparent">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">Daily Digest Email</div>
                <div className="text-xs text-gray-500">Get a daily summary of your habits</div>
              </div>
              <button
                onClick={() => setProfile({ ...profile, notificationsEnabled: !profile.notificationsEnabled })}
                className={clsx('w-12 h-6 rounded-full transition-all duration-200 relative', profile.notificationsEnabled ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700')}
              >
                <div className={clsx('absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200', profile.notificationsEnabled ? 'right-1' : 'left-1')} />
              </button>
            </div>
            {profile.notificationsEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Digest Time</label>
                  <input type="time" className="input-field" value={profile.dailyDigestTime} onChange={(e) => setProfile({ ...profile, dailyDigestTime: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reminder Email</label>
                  <input type="email" className="input-field" value={profile.reminderEmail} onChange={(e) => setProfile({ ...profile, reminderEmail: e.target.value })} placeholder="digest@email.com" />
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Badges */}
        <Section title="Badges & Achievements" icon={SettingsIcon}>
          <div className="grid grid-cols-2 gap-3">
            {ALL_BADGES.map((badge) => {
              const earned = earnedBadgeIds.includes(badge.id);
              const earnedData = user?.badges?.find((b) => b.id === badge.id);
              return (
                <div
                  key={badge.id}
                  className={clsx('p-3 rounded-xl border transition-all', earned ? 'bg-brand-500/10 border-brand-500/30' : 'bg-gray-100 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-50 grayscale')}
                >
                  <div className="text-lg mb-1">{badge.name.split(' ')[0]}</div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">{badge.name.split(' ').slice(1).join(' ')}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{badge.description}</div>
                  {earned && earnedData && (
                    <div className="text-xs text-brand-400 mt-1">✓ Earned {new Date(earnedData.earnedAt).toLocaleDateString()}</div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* Archived Habits */}
        {archivedHabits.length > 0 && (
          <Section title="Archived Habits" icon={Archive}>
            <div className="space-y-2">
              {archivedHabits.map((habit) => (
                <div key={habit._id} className="flex items-center justify-between p-3 glass rounded-xl border border-gray-200 dark:border-transparent">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: habit.color }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{habit.name}</span>
                  </div>
                  <button onClick={() => handleUnarchive(habit._id)} className="text-xs text-brand-400 hover:text-brand-300">
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Export */}
        <Section title="Export Data" icon={Download}>
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">Download all your habit completion data</p>
            <button
              onClick={() => window.open('/api/export/csv', '_blank')}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export as CSV
            </button>
          </div>
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone" icon={Shield}>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">These actions are irreversible. Proceed with caution.</p>
            <button onClick={handleDeleteAccount} className="btn-danger w-full">
              Delete My Account
            </button>
          </div>
        </Section>
      </main>
    </div>
  );
}
