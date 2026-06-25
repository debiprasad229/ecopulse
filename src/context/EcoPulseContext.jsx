import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { calculateFootprint, calculateOffsets, getRecommendations } from '../utils/carbonCalculations';
import { calculatePersonality } from '../utils/personalityEngine';
import { generateForecast } from '../utils/forecastEngine';

const EcoPulseContext = createContext(null);

export const HABIT_SAVINGS_MAP = {
  commute_green: 520,
  eat_vegan_veg: 600,
  unplug_unused: 120,
  air_dry_laundry: 220,
  cold_shower: 180
};

export const SEED_NOTIFICATIONS = [
  {
    id: 'seed-1',
    category: 'AI Recommendations',
    title: 'AI Coach Recommendation',
    description: 'Swapping 2 car trips for public transit will save 45 kg CO₂e next week.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false
  },
  {
    id: 'seed-2',
    category: 'Challenges',
    title: 'Daily challenge completed',
    description: "You completed 'Unplug unused electronics' (+25 XP)",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false
  },
  {
    id: 'seed-3',
    category: 'Carbon Score Updates',
    title: 'Carbon footprint reduced by 5%',
    description: 'Your net carbon emissions dropped to 320 kg CO₂e/yr.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    read: false
  },
  {
    id: 'seed-4',
    category: 'Achievements',
    title: 'New badge unlocked',
    description: "You unlocked the 'Eco Warrior' badge! Keep up the great work.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: false
  },
  {
    id: 'seed-5',
    category: 'Carbon Score Updates',
    title: 'Sustainability goal achieved',
    description: 'Reduced transportation emissions by 20% this month.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true
  },
  {
    id: 'seed-6',
    category: 'System Updates',
    title: 'EcoPulse v2.0 Live',
    description: 'The notification center and accessibility tools are now active.',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    read: true
  }
];

export function EcoPulseProvider({ children }) {
  // Authentication & Session state
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('ecopulse_token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isHydrated, setIsHydrated] = useState(false);

  // Application States
  const [inputs, setInputs] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_inputs');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [xp, setXp] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_xp');
      return stored ? Math.max(0, parseInt(stored) || 0) : 0;
    } catch {
      return 0;
    }
  });

  const [completedHabits, setCompletedHabits] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_habits');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [challengeStats, setChallengeStats] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_challenge_stats');
      return stored ? JSON.parse(stored) : { streak: 0, completedTotal: 0, lastCompletedDate: null };
    } catch {
      return { streak: 0, completedTotal: 0, lastCompletedDate: null };
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [showWizard, setShowWizard] = useState(false);

  const [isNewUser, setIsNewUser] = useState(() => {
    try {
      return localStorage.getItem('ecopulse_is_new_user') === 'true';
    } catch {
      return false;
    }
  });

  const [habitSavings, setHabitSavings] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_habits');
      const habits = stored ? JSON.parse(stored) : {};
      return Object.entries(habits).reduce((total, [habitId, count]) => {
        const saving = HABIT_SAVINGS_MAP[habitId] || 0;
        return total + (saving * count);
      }, 0);
    } catch {
      return 0;
    }
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [offsets, setOffsets] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_offsets');
      return stored ? JSON.parse(stored) : { treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 };
    } catch {
      return { treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 };
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_notifications');
      return stored ? JSON.parse(stored) : SEED_NOTIFICATIONS;
    } catch {
      return SEED_NOTIFICATIONS;
    }
  });

  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_ai_messages');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Accessibility States
  const [highContrast, setHighContrast] = useState(() => {
    try {
      return localStorage.getItem('ecopulse_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  const [fontSize, setFontSize] = useState(() => {
    try {
      return localStorage.getItem('ecopulse_font_size') || 'normal';
    } catch {
      return 'normal';
    }
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_reduced_motion');
      if (stored !== null) return stored === 'true';
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });

  const [currentRoute, setCurrentRoute] = useState(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      return ['dashboard', 'analytics', 'ai-coach', 'challenges', 'profile'].includes(hash) ? hash : 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [isPageLoading, setIsPageLoading] = useState(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem('ecopulse_token');
      localStorage.removeItem('ecopulse_user');
      localStorage.removeItem('ecopulse_is_new_user');
    } catch (e) {
      console.error(e);
    }
    setToken(null);
    setUser(null);
    setInputs(null);
    setXp(0);
    setCompletedHabits({});
    setChallengeStats({ streak: 0, completedTotal: 0, lastCompletedDate: null });
    setHistory([]);
    setOffsets({ treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 });
    setNotifications(SEED_NOTIFICATIONS);
    setChatHistory([]);
    setHabitSavings(0);
    setIsNewUser(false);
    setIsHydrated(false);
  };

  // Authenticated State Hydration Effect
  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            handleLogout();
          }
          throw new Error('Failed to load profile');
        }

        const data = await res.json();
        
        if (data.isNewUser !== undefined) {
          setIsNewUser(data.isNewUser);
        }
        
        if (data.isNewUser === false && !data.inputs) {
          const defaultInputs = {
            commuteDistance: 0,
            transportType: 'none',
            flightHours: 0,
            electricityKwh: 0,
            greenEnergyShare: 0,
            heatingSource: 'none',
            dietType: 'lowMeat',
            shoppingHabit: 'average',
            recycles: false
          };
          setInputs(defaultInputs);
        } else if (data.inputs !== undefined) {
          setInputs(data.inputs);
        }
        if (data.xp !== undefined) setXp(data.xp);
        if (data.completedHabits !== undefined) {
          setCompletedHabits(data.completedHabits || {});
          
          // Re-calculate habit savings
          const habits = data.completedHabits || {};
          const savings = Object.entries(habits).reduce((total, [habitId, count]) => {
            const saving = HABIT_SAVINGS_MAP[habitId] || 0;
            return total + (saving * count);
          }, 0);
          setHabitSavings(savings);
        }
        if (data.challengeStats !== undefined) setChallengeStats(data.challengeStats || { streak: 0, completedTotal: 0, lastCompletedDate: null });
        if (data.offsets !== undefined) setOffsets(data.offsets || { treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 });
        if (data.history !== undefined) setHistory(data.history || []);
        if (data.notifications !== undefined) setNotifications(data.notifications || SEED_NOTIFICATIONS);
        if (data.chatHistory !== undefined) setChatHistory(data.chatHistory || []);
        
        if (data.settings) {
          if (data.settings.highContrast !== undefined) setHighContrast(data.settings.highContrast);
          if (data.settings.fontSize !== undefined) setFontSize(data.settings.fontSize);
          if (data.settings.reducedMotion !== undefined) setReducedMotion(data.settings.reducedMotion);
        }
        
        setIsHydrated(true);
      } catch (err) {
        console.error('Error fetching profile from MongoDB:', err);
      }
    };

    fetchProfile();
  }, [token]);

  // Debounced MongoDB Database Synchronization Effect
  useEffect(() => {
    if (!token || !isHydrated) return;

    const delayDebounce = setTimeout(async () => {
      try {
        await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            inputs,
            xp,
            completedHabits,
            challengeStats,
            offsets,
            history,
            chatHistory,
            notifications,
            isNewUser,
            settings: {
              highContrast,
              fontSize,
              reducedMotion
            }
          })
        });
      } catch (err) {
        console.error('Failed to sync profile with database:', err);
      }
    }, 1000); // 1-second debounce to batch rapid updates

    return () => clearTimeout(delayDebounce);
  }, [inputs, xp, completedHabits, challengeStats, offsets, history, chatHistory, notifications, highContrast, fontSize, reducedMotion, token, isHydrated, isNewUser]);

  // Route hashchange listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const targetRoute = ['dashboard', 'analytics', 'ai-coach', 'challenges', 'profile'].includes(hash) ? hash : 'dashboard';
      
      setIsPageLoading(true);
      setCurrentRoute(targetRoute);
      
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 350);
      
      return () => clearTimeout(timer);
    };

    window.addEventListener('hashchange', handleHashChange);
    
    if (window.location.hash) {
      handleHashChange();
    }
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleAuthSuccess = (newToken, newUser) => {
    try {
      localStorage.setItem('ecopulse_token', newToken);
      localStorage.setItem('ecopulse_user', JSON.stringify(newUser));
    } catch (e) {
      console.error(e);
    }
    setToken(newToken);
    setUser(newUser);
  };

  const addNotification = (category, title, description) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category,
      title,
      description,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const prevXpRef = useRef(xp);
  useEffect(() => {
    const prevLevel = Math.floor(prevXpRef.current / 100) + 1;
    const currentLevel = Math.floor(xp / 100) + 1;
    if (currentLevel > prevLevel) {
      addNotification(
        'Achievements',
        'Level Up!',
        `Congratulations! You have reached Level ${currentLevel} (+100 XP Milestone).`
      );
    }
    prevXpRef.current = xp;
  }, [xp]);

  // Sync state changes with body classes and localStorage for accessibility and caching
  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_high_contrast', highContrast);
    } catch (e) {
      console.error(e);
    }
    document.body.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_font_size', fontSize);
    } catch (e) {
      console.error(e);
    }
    document.body.classList.remove('accessibility-font-normal', 'accessibility-font-large', 'accessibility-font-xlarge');
    if (fontSize !== 'normal') {
      document.body.classList.add(`accessibility-font-${fontSize}`);
    }
  }, [fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_reduced_motion', reducedMotion);
    } catch (e) {
      console.error(e);
    }
    document.body.classList.toggle('reduced-motion', reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_offsets', JSON.stringify(offsets));
    } catch (e) {
      console.error(e);
    }
  }, [offsets]);

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_xp', xp.toString());
    } catch (e) {
      console.error(e);
    }
  }, [xp]);

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_is_new_user', isNewUser);
    } catch (e) {
      console.error(e);
    }
  }, [isNewUser]);

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_habits', JSON.stringify(completedHabits));
    } catch (e) {
      console.error(e);
    }
  }, [completedHabits]);

  useEffect(() => {
    try {
      localStorage.setItem('ecopulse_ai_messages', JSON.stringify(chatHistory));
    } catch (e) {
      console.error(e);
    }
  }, [chatHistory]);

  const saveInputs = (newInputs) => {
    try {
      localStorage.setItem('ecopulse_inputs', JSON.stringify(newInputs));
      setInputs(newInputs);
      setShowWizard(false);
      setIsNewUser(false);

      const breakdown = calculateFootprint(newInputs);
      const totalFootprint = breakdown.total;
      setHistory(prev => {
        const newEntry = {
          timestamp: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          footprint: totalFootprint
        };
        const updated = [newEntry, ...prev].slice(0, 10);
        try {
          localStorage.setItem('ecopulse_history', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });

      addNotification(
        'Carbon Score Updates',
        'Carbon Baseline Recalculated',
        `Your baseline carbon footprint is calculated at ${Math.round(totalFootprint).toLocaleString()} kg CO₂e/yr.`
      );
    } catch (e) {
      console.error("Failed to save onboarding parameters:", e);
    }
  };

  const handleResetToWelcome = () => {
    try {
      localStorage.removeItem('ecopulse_inputs');
      localStorage.removeItem('ecopulse_history');
      localStorage.removeItem('ecopulse_habits');
      localStorage.removeItem('ecopulse_challenge_stats');
      localStorage.removeItem('ecopulse_offsets');
      localStorage.removeItem('ecopulse_xp');
      localStorage.removeItem('ecopulse_is_new_user');
      setInputs(null);
      setHistory([]);
      setCompletedHabits({});
      setChallengeStats({ streak: 0, completedTotal: 0, lastCompletedDate: null });
      setOffsets({ treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 });
      setXp(0);
      setShowWizard(false);
      setIsNewUser(true);
    } catch (e) {
      console.error("Failed to go to welcome screen:", e);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your calculation history? This will reset your progress tracking.")) {
      try {
        localStorage.removeItem('ecopulse_history');
        setHistory([]);
      } catch (e) {
        console.error("Failed to clear history:", e);
      }
    }
  };

  useEffect(() => {
    if (inputs) {
      window.scrollTo(0, 0);
    }
  }, [inputs]);

  const footprintBreakdown = useMemo(() => {
    if (!inputs) {
      return { transport: 0, energy: 0, diet: 0, shopping: 0, total: 0 };
    }
    return calculateFootprint(inputs);
  }, [inputs]);

  const totalOffsets = useMemo(() => {
    return calculateOffsets(offsets);
  }, [offsets]);

  const netFootprint = useMemo(() => {
    const totalReduction = totalOffsets + habitSavings;
    return Math.max(0, footprintBreakdown.total - totalReduction);
  }, [footprintBreakdown.total, totalOffsets, habitSavings]);

  const recommendations = useMemo(() => {
    if (!inputs) return [];
    return getRecommendations(inputs, footprintBreakdown);
  }, [inputs, footprintBreakdown]);

  const personality = useMemo(() => {
    if (!inputs) return null;
    return calculatePersonality(inputs, footprintBreakdown, netFootprint, xp, completedHabits, offsets);
  }, [inputs, footprintBreakdown, netFootprint, xp, completedHabits, offsets]);

  const forecast = useMemo(() => {
    if (!inputs) return null;
    return generateForecast(history, netFootprint, recommendations, completedHabits, offsets);
  }, [inputs, history, netFootprint, recommendations, completedHabits, offsets]);

  const value = {
    token,
    user,
    isHydrated,
    inputs,
    xp,
    setXp,
    completedHabits,
    setCompletedHabits,
    challengeStats,
    setChallengeStats,
    history,
    showWizard,
    setShowWizard,
    isNewUser,
    setIsNewUser,
    habitSavings,
    setHabitSavings,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    offsets,
    setOffsets,
    notifications,
    chatHistory,
    setChatHistory,
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    reducedMotion,
    setReducedMotion,
    currentRoute,
    setCurrentRoute,
    isPageLoading,
    handleLogout,
    handleAuthSuccess,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    saveInputs,
    handleResetToWelcome,
    handleClearHistory,
    footprintBreakdown,
    totalOffsets,
    netFootprint,
    recommendations,
    personality,
    forecast
  };

  return (
    <EcoPulseContext.Provider value={value}>
      {children}
    </EcoPulseContext.Provider>
  );
}

export function useEcoPulse() {
  const context = useContext(EcoPulseContext);
  if (!context) {
    throw new Error('useEcoPulse must be used within an EcoPulseProvider');
  }
  return context;
}
