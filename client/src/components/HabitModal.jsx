import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { habitApi } from '../api/habitApi';
import toast from 'react-hot-toast';

const CATEGORIES = ['Health', 'Learning', 'Productivity', 'Mindfulness', 'Fitness', 'Custom'];
const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#f59e0b',
  '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#a3e635', '#84cc16',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_FORM = {
  name: '',
  category: 'Health',
  color: '#6366f1',
  frequency: 'daily',
  weekDays: [],
  goal: 30,
  reminderTime: '',
  reminderType: 'none',
};

export default function HabitModal({ open, onClose, onCreated, onUpdated, editHabit }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editHabit) {
      setForm({
        name: editHabit.name,
        category: editHabit.category,
        color: editHabit.color,
        frequency: editHabit.frequency,
        weekDays: editHabit.weekDays || [],
        goal: editHabit.goal,
        reminderTime: editHabit.reminderTime || '',
        reminderType: editHabit.reminderType || 'none',
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [editHabit, open]);

  if (!open) return null;

  const toggleWeekDay = (day) => {
    setForm((f) => ({
      ...f,
      weekDays: f.weekDays.includes(day) ? f.weekDays.filter((d) => d !== day) : [...f.weekDays, day],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Habit name is required');
      return;
    }
    if (form.frequency === 'weekly' && form.weekDays.length === 0) {
      toast.error('Select at least one day for weekly habits');
      return;
    }

    setLoading(true);
    try {
      if (editHabit) {
        const updated = await habitApi.update(editHabit._id, form);
        onUpdated?.(updated);
        toast.success('Habit updated!');
      } else {
        const { habit } = await habitApi.create(form);
        onCreated?.(habit);
        toast.success('Habit created! 🎉');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-slide-up">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{editHabit ? 'Edit Habit' : 'New Habit'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg glass glass-hover flex items-center justify-center text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Habit Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Drink 2L water"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label>
            <select
              className="input-field"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === color ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white scale-110' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Frequency</label>
            <div className="flex gap-2">
              {['daily', 'weekly'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setForm({ ...form, frequency: f })}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all ${form.frequency === f ? 'bg-brand-500 text-white' : 'glass glass-hover text-gray-400'}`}
                >
                  {f}
                </button>
              ))}
            </div>

            {form.frequency === 'weekly' && (
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {WEEKDAYS.map((day, idx) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekDay(idx)}
                    className={`w-10 h-10 rounded-xl text-xs font-semibold transition-all ${form.weekDays.includes(idx) ? 'bg-brand-500 text-white' : 'glass glass-hover text-gray-400'}`}
                  >
                    {day.slice(0, 2)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Monthly Goal <span className="text-gray-500 font-normal">(completions)</span>
            </label>
            <input
              type="number"
              className="input-field"
              min="1"
              max="31"
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: parseInt(e.target.value) || 30 })}
            />
          </div>

          {/* Reminder */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Reminder</label>
            <div className="flex gap-2">
              <input
                type="time"
                className="input-field flex-1"
                value={form.reminderTime}
                onChange={(e) => setForm({ ...form, reminderTime: e.target.value })}
              />
              <select
                className="input-field w-36"
                value={form.reminderType}
                onChange={(e) => setForm({ ...form, reminderType: e.target.value })}
              >
                <option value="none">No reminder</option>
                <option value="browser">Browser</option>
                <option value="email">Email</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Saving...' : editHabit ? 'Update Habit' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
