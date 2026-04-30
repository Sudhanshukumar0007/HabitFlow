import { useState, useCallback } from 'react';
import { format, isToday, isPast, isFuture, getDay } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GripVertical, Flame, Archive, Edit2, Trash2 } from 'lucide-react';
import { getDaysInMonth, isHabitCompletedOnDate, isScheduledDay, getMonthCompletions, CATEGORY_COLORS } from '../utils/dateUtils';
import { habitApi } from '../api/habitApi';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const HabitCell = ({ habit, day, onToggle, isCurrentMonth }) => {
  const done = isHabitCompletedOnDate(habit, day);
  const scheduled = isScheduledDay(habit, day);
  const past = isPast(day) && !isToday(day);
  const future = isFuture(day) && !isToday(day);
  const todayCell = isToday(day);

  if (!scheduled) {
    return <div className="habit-cell habit-cell-off-day w-8 h-8 rounded-lg flex-shrink-0" />;
  }

  if (future) {
    return <div className="habit-cell habit-cell-future flex-shrink-0" />;
  }

  return (
    <button
      onClick={() => onToggle(habit._id, day)}
      className={clsx(
        'habit-cell flex-shrink-0',
        done
          ? 'habit-cell-done'
          : past
          ? 'habit-cell-missed'
          : 'bg-gray-900 hover:border-gray-600',
        todayCell && !done && 'border-gray-600 bg-gray-800/50'
      )}
      style={done ? { backgroundColor: habit.color + '40', borderColor: habit.color + '80' } : {}}
      title={format(day, 'MMM d, yyyy')}
    >
      {done && (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" style={{ color: habit.color }}>
          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
};

export default function HabitGrid({ habits, currentMonth, onHabitsReorder, onToggle, onEdit, onDelete, onArchive }) {
  const days = getDaysInMonth(currentMonth);
  const today = new Date();

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(habits);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    onHabitsReorder(reordered);

    try {
      await habitApi.reorder(reordered.map((h) => h._id));
    } catch {
      toast.error('Failed to save order');
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: `${Math.max(700, days.length * 36 + 280)}px` }}>
        {/* Header Row */}
        <div className="flex items-center mb-1">
          <div className="w-64 flex-shrink-0" />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={clsx(
                'w-8 h-10 flex-shrink-0 flex flex-col items-center justify-center rounded-t-lg text-xs font-medium gap-0.5',
                isToday(day)
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'text-gray-500'
              )}
            >
              <span>{format(day, 'd')}</span>
              <span className="text-gray-600 text-[10px]">{format(day, 'EEEEE')}</span>
            </div>
          ))}
          <div className="w-32 flex-shrink-0 pl-3 text-xs text-gray-600 font-medium self-end pb-1">STREAK / GOAL</div>
        </div>

        {/* Habit Rows */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="habits">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                {habits.map((habit, index) => {
                  const completions = getMonthCompletions(habit, currentMonth);
                  const catColors = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.Custom;
                  const isStreakHot = habit.currentStreak >= 7;

                  return (
                    <Draggable key={habit._id} draggableId={habit._id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={clsx(
                            'flex items-center gap-1 rounded-xl transition-all duration-200',
                            snapshot.isDragging ? 'bg-gray-800 shadow-2xl ring-1 ring-brand-500' : 'hover:bg-gray-900/50',
                            isStreakHot && 'streak-glow'
                          )}
                        >
                          {/* Drag handle */}
                          <div {...provided.dragHandleProps} className="flex-shrink-0 text-gray-700 hover:text-gray-500 cursor-grab px-1">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Habit Info */}
                          <div className="w-56 flex-shrink-0 flex items-center gap-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-200 truncate">{habit.name}</div>
                              <span className={`tag border ${catColors.bg} ${catColors.text} ${catColors.border}`}>
                                {habit.category}
                              </span>
                            </div>
                          </div>

                          {/* Cells */}
                          <div className="flex items-center gap-0.5">
                            {days.map((day) => (
                              <HabitCell
                                key={day.toISOString()}
                                habit={habit}
                                day={day}
                                onToggle={onToggle}
                              />
                            ))}
                          </div>

                          {/* Streak & Goal */}
                          <div className="w-32 flex-shrink-0 pl-3 flex items-center gap-2">
                            <div className={clsx('flex items-center gap-1 text-sm font-medium', isStreakHot ? 'text-orange-400' : 'text-gray-500')}>
                              <Flame className={clsx('w-3.5 h-3.5', isStreakHot && 'text-orange-400')} />
                              {habit.currentStreak}
                            </div>
                            <div className={clsx('text-sm font-medium', completions >= habit.goal ? 'text-emerald-400' : completions === 0 ? 'text-yellow-600' : 'text-gray-400')}>
                              {completions}/{habit.goal}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 ml-auto">
                              <button onClick={() => onEdit(habit)} className="text-gray-600 hover:text-brand-400 transition-colors p-0.5">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => onArchive(habit._id)} className="text-gray-600 hover:text-amber-400 transition-colors p-0.5">
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => onDelete(habit._id)} className="text-gray-600 hover:text-red-400 transition-colors p-0.5">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {habits.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <div className="text-4xl mb-3">🌱</div>
            <div className="text-lg font-medium text-gray-500">No habits yet</div>
            <div className="text-sm mt-1">Click "+ New Habit" to get started!</div>
          </div>
        )}
      </div>
    </div>
  );
}
