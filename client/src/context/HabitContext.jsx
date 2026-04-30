import { createContext, useContext, useState, useCallback } from 'react';

const HabitContext = createContext(null);

export const HabitProvider = ({ children }) => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);

  const updateHabits = useCallback((data) => setHabits(data), []);

  const updateHabit = useCallback((id, updates) => {
    setHabits((prev) => prev.map((h) => (h._id === id ? { ...h, ...updates } : h)));
  }, []);

  const addHabit = useCallback((habit) => {
    setHabits((prev) => [...prev, habit]);
  }, []);

  const removeHabit = useCallback((id) => {
    setHabits((prev) => prev.filter((h) => h._id !== id));
  }, []);

  return (
    <HabitContext.Provider value={{ habits, loading, setLoading, updateHabits, updateHabit, addHabit, removeHabit }}>
      {children}
    </HabitContext.Provider>
  );
};

export const useHabitContext = () => useContext(HabitContext);
