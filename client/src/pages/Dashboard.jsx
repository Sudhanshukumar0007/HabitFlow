import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckSquare, Search, ChevronDown, StickyNote, X, Loader2 } from 'lucide-react';
import { format, isToday } from 'date-fns';
import ReactConfetti from 'react-confetti';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { habitApi, noteApi } from '../api/habitApi';
import { useAuth } from '../context/AuthContext';
import { isHabitCompletedOnDate, CATEGORY_COLORS } from '../utils/dateUtils';
import HabitGrid from '../components/HabitGrid';
import HabitModal from '../components/HabitModal';
import Navbar from '../components/Navbar';

const CATEGORIES = ['All', 'Health', 'Learning', 'Productivity', 'Mindfulness', 'Fitness', 'Custom'];

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [habits, setHabits] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [confetti, setConfetti] = useState(false);
  const [undoState, setUndoState] = useState(null); // { habitId, date, wasCompleted }
  const [undoTimer, setUndoTimer] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [habitsData, notesData] = await Promise.all([habitApi.getAll(), noteApi.getAll()]);
        setHabits(habitsData.filter((h) => !h.isArchived));
        setNotes(notesData);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'n' || e.key === 'N') setModalOpen(true);
      if (e.key === 'Escape') { setModalOpen(false); setShowNoteModal(false); }
      if (e.key === 'a' || e.key === 'A') completeAllToday();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [habits]);

  const filteredHabits = habits.filter((h) => {
    const matchCat = filter === 'All' || h.category === filter;
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleToggle = useCallback(async (habitId, date) => {
    if (!isToday(date)) {
      toast.error('You can only update habits for today');
      return;
    }

    const habit = habits.find((h) => h._id === habitId);
    if (!habit) return;
    const wasCompleted = isHabitCompletedOnDate(habit, date);

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => {
        if (h._id !== habitId) return h;
        const dateStr = format(date, 'yyyy-MM-dd');
        const newDates = wasCompleted
          ? h.completedDates.filter((d) => format(new Date(d), 'yyyy-MM-dd') !== dateStr)
          : [...h.completedDates, date.toISOString()];
        return { ...h, completedDates: newDates };
      })
    );

    // Set up undo
    if (undoTimer) clearTimeout(undoTimer);
    setUndoState({ habitId, date, wasCompleted: !wasCompleted });
    const timer = setTimeout(() => setUndoState(null), 5000);
    setUndoTimer(timer);

    try {
      const result = await habitApi.toggle(habitId, date.toISOString());
      // Update with server state
      setHabits((prev) => prev.map((h) => (h._id === habitId ? { ...h, ...result.habit } : h)));
      if (result.xpResult) updateUser({ xp: result.xpResult.xp, level: result.xpResult.level });
      if (result.xpResult?.leveledUp) {
        toast.success(`🎉 Level Up! You're now Level ${result.xpResult.level} — ${result.xpResult.levelTitle}!`, { duration: 5000 });
      }
      if (result.newBadges?.length > 0) {
        result.newBadges.forEach((badge) => toast.success(`🏅 Badge earned: ${badge}`, { duration: 4000 }));
      }

      // Check all done today
      const updatedHabits = habits.map((h) => (h._id === habitId ? result.habit : h));
      const allDoneToday = updatedHabits.every((h) => isHabitCompletedOnDate(h, new Date()));
      if (allDoneToday && !wasCompleted) {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 5000);
        toast.success('🎊 All habits done for today! Amazing!', { duration: 5000 });
      }
    } catch (error) {
      // Revert on error
      setHabits((prev) =>
        prev.map((h) => {
          if (h._id !== habitId) return h;
          const dateStr = format(date, 'yyyy-MM-dd');
          const revertDates = !wasCompleted
            ? h.completedDates.filter((d) => format(new Date(d), 'yyyy-MM-dd') !== dateStr)
            : [...h.completedDates, date.toISOString()];
          return { ...h, completedDates: revertDates };
        })
      );
      toast.error(error.response?.data?.message || 'Failed to update habit');
    }
  }, [habits, undoTimer]);

  const handleUndo = () => {
    if (!undoState) return;
    handleToggle(undoState.habitId, new Date(undoState.date));
    setUndoState(null);
    clearTimeout(undoTimer);
  };

  const completeAllToday = async () => {
    const today = new Date();
    const incomplete = habits.filter((h) => !isHabitCompletedOnDate(h, today) && !h.isArchived);
    if (incomplete.length === 0) {
      toast('All habits already done! 🎉');
      return;
    }
    for (const h of incomplete) {
      await handleToggle(h._id, today);
    }
    toast.success('Completed all habits for today!');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this habit?')) return;
    try {
      await habitApi.delete(id);
      setHabits((prev) => prev.filter((h) => h._id !== id));
      toast.success('Habit deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleArchive = async (id) => {
    try {
      await habitApi.archive(id);
      setHabits((prev) => prev.filter((h) => h._id !== id));
      toast.success('Habit archived');
    } catch {
      toast.error('Failed to archive');
    }
  };

  const handleCreateNote = async () => {
    if (!noteContent.trim()) return;
    try {
      const note = await noteApi.create(noteContent);
      setNotes((prev) => [note, ...prev]);
      setNoteContent('');
      setShowNoteModal(false);
      toast.success('Note saved!');
    } catch {
      toast.error('Failed to save note');
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await noteApi.delete(id);
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch {
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {confetti && <ReactConfetti recycle={false} numberOfPieces={300} />}
      <Navbar currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />

      <main className="max-w-full px-4 py-6 space-y-6">
        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={completeAllToday}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            Complete All Today
          </button>
          <button
            onClick={() => { setEditHabit(null); setModalOpen(true); }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Habit
          </button>

          <div className="relative flex-1 min-w-48 max-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              className="input-field pl-9 text-sm py-2"
              placeholder="Search habits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input-field w-auto text-sm py-2 pr-8"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Habit Grid */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : (
            <div className="group">
              <HabitGrid
                habits={filteredHabits}
                currentMonth={currentMonth}
                onHabitsReorder={(reordered) => {
                  setHabits(reordered);
                }}
                onToggle={handleToggle}
                onEdit={(h) => { setEditHabit(h); setModalOpen(true); }}
                onDelete={handleDelete}
                onArchive={handleArchive}
              />
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-yellow-400" />
              Notes
            </h2>
            <button onClick={() => setShowNoteModal(true)} className="btn-secondary text-sm py-1.5 flex items-center gap-1">
              <Plus className="w-4 h-4" /> New Note
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="card text-center py-8 text-gray-500 dark:text-gray-600">
              <div className="text-2xl mb-2">📝</div>
              <div className="text-sm">No notes yet. Add your thoughts!</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {notes.map((note) => (
                <div key={note._id} className="card group relative hover:border-gray-700 transition-colors">
                  <button
                    onClick={() => handleDeleteNote(note._id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="prose prose-sm prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm line-clamp-4">
                    <ReactMarkdown>{note.content}</ReactMarkdown>
                  </div>
                  <div className="mt-3 text-xs text-gray-400 dark:text-gray-600">
                    {format(new Date(note.createdAt), 'MMM d, yyyy · h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Habit Modal */}
      <HabitModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditHabit(null); }}
        editHabit={editHabit}
        onCreated={(habit) => setHabits((prev) => [...prev, habit])}
        onUpdated={(habit) => setHabits((prev) => prev.map((h) => (h._id === habit._id ? habit : h)))}
      />

      {/* Note Modal */}
      {showNoteModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowNoteModal(false)}>
          <div className="modal-content max-w-md animate-slide-up">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Note</h2>
              <button onClick={() => setShowNoteModal(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                className="input-field resize-none h-40"
                placeholder="Write your note... (Markdown supported: **bold**, *italic*, - list)"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setShowNoteModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleCreateNote} className="btn-primary flex-1">Save Note</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast */}
      {undoState && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="glass rounded-xl px-5 py-3 flex items-center gap-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-300">Habit toggled</span>
            <button onClick={handleUndo} className="text-brand-400 font-semibold text-sm hover:text-brand-300">
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
