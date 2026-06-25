import { useState, useEffect, useMemo, useRef } from 'react';
import { Leaf, RefreshCw, BarChart3, CheckSquare, Globe, Menu } from 'lucide-react';
import { calculateFootprint, calculateOffsets, getRecommendations } from './utils/carbonCalculations';
import OnboardingWizard from './components/OnboardingWizard';
import EcoSphere from './components/EcoSphere';
import CarbonScoreCard from './components/CarbonScoreCard';
import ChartCard from './components/ChartCard';
import HabitTrackerCard from './components/HabitTrackerCard';
import OffsetSimulatorCard from './components/OffsetSimulatorCard';
import RecommendationsCard from './components/RecommendationsCard';
import EcoPulseAI from './components/EcoPulseAI';
import CarbonPersonalityCard from './components/CarbonPersonalityCard';
import CarbonForecastCard from './components/CarbonForecastCard';
import ChallengeTrackerCard from './components/ChallengeTrackerCard';
import AccessibilitySettings from './components/AccessibilitySettings';
import CarbonScannerCard from './components/CarbonScannerCard';
import AuthPage from './components/AuthPage';
import { calculatePersonality } from './utils/personalityEngine';
import { generateForecast } from './utils/forecastEngine';
import Navbar from './components/Navbar';

const HABIT_SAVINGS_MAP = {
  commute_green: 520,
  eat_vegan_veg: 600,
  unplug_unused: 120,
  air_dry_laundry: 220,
  cold_shower: 180
};


const SEED_NOTIFICATIONS = [
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

const PageLoader = () => (
  <div className="page-loader-shimmer" data-testid="page-loader">
    <div className="shimmer-spinner"></div>
    <p className="shimmer-text">Retrieving EcoPulse Telemetry...</p>
  </div>
);

export default function App() {
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
        
        if (data.inputs !== undefined) setInputs(data.inputs);
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
  }, [inputs, xp, completedHabits, challengeStats, offsets, history, chatHistory, notifications, highContrast, fontSize, reducedMotion, token, isHydrated]);

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

  // Save onboarding Questionnaire inputs and recalculate baseline
  const saveInputs = (newInputs) => {
    try {
      localStorage.setItem('ecopulse_inputs', JSON.stringify(newInputs));
      setInputs(newInputs);
      setShowWizard(false);

      // Append to history
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
      setInputs(null);
      setHistory([]);
      setCompletedHabits({});
      setChallengeStats({ streak: 0, completedTotal: 0, lastCompletedDate: null });
      setOffsets({ treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 });
      setXp(0);
      setShowWizard(false);
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

  // Scroll to top of page when inputs update
  useEffect(() => {
    if (inputs) {
      window.scrollTo(0, 0);
    }
  }, [inputs]);

  // Real-time calculations (Memoized)
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


  const renderDashboard = () => (
    <div className="saas-page animate-page">
      <div className="saas-page-header">
        <h2 className="saas-page-title">Control Dashboard</h2>
        <p className="saas-page-subtitle">Real-time status of your carbon footprint and planetary ecosystem health.</p>
      </div>
      
      <div className="quick-stats-grid">
        <div className="stat-card">
          <span className="stat-label">Net Footprint</span>
          <span className="stat-value">{Math.round(netFootprint).toLocaleString()} kg/yr</span>
          <span className="stat-trend" style={{ color: netFootprint < footprintBreakdown.total ? 'var(--accent-green)' : 'var(--text-muted)' }}>
            {netFootprint < footprintBreakdown.total ? `↓ ${Math.round((footprintBreakdown.total - netFootprint) / footprintBreakdown.total * 100)}% vs baseline` : 'Baseline'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Offsets</span>
          <span className="stat-value">{Math.round(totalOffsets).toLocaleString()} kg/yr</span>
          <span className="stat-trend" style={{ color: 'var(--accent-blue)' }}>{Object.values(offsets).filter(v => v > 0).length} programs active</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Eco Score XP</span>
          <span className="stat-value">{xp} XP</span>
          <span className="stat-trend" style={{ color: 'var(--accent-purple)' }}>Level {Math.floor(xp / 100) + 1}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Actions Logged</span>
          <span className="stat-value">{Object.values(completedHabits || {}).reduce((a, b) => a + b, 0)} check-ins</span>
          <span className="stat-trend" style={{ color: 'var(--accent-orange)' }}>Streak: {challengeStats.streak || 0} Days</span>
        </div>
      </div>

      <div className="bento-grid dashboard-layout">
        <CarbonScoreCard 
          id="overview"
          netFootprint={netFootprint} 
          baseline={footprintBreakdown.total} 
          xp={xp}
          completedHabits={completedHabits}
          history={history}
          onClearHistory={handleClearHistory}
          challengeStats={challengeStats}
        />
        
        <EcoSphere 
          netFootprint={netFootprint} 
          baselineFootprint={footprintBreakdown.total} 
        />

        <CarbonScannerCard 
          id="scanner"
          inputs={inputs} 
          onUpdateInputs={saveInputs}
          token={token}
        />

        <div className="bento-card col-6 recent-activities-card">
          <h3 className="card-title">Recent Activity Logs</h3>
          <div className="activities-list">
            {history.length === 0 && Object.values(completedHabits || {}).reduce((a, b) => a + b, 0) === 0 ? (
              <p className="no-activities" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0' }}>No recent activity logged yet.</p>
            ) : (
              <>
                {history.slice(0, 3).map((h, i) => (
                   <div key={`hist-${i}`} className="activity-item">
                     <span className="activity-icon hist">📊</span>
                     <div className="activity-details">
                       <span className="activity-title">Baseline Footprint Calculated</span>
                       <span className="activity-desc">{Math.round(h.footprint).toLocaleString()} kg CO₂e/yr</span>
                     </div>
                     <span className="activity-time">{h.timestamp}</span>
                   </div>
                ))}
                {Object.entries(completedHabits || {}).filter((entry) => entry[1] > 0).slice(0, 3).map(([habitId, count]) => (
                   <div key={`habit-${habitId}`} className="activity-item">
                     <span className="activity-icon habit">🌱</span>
                     <div className="activity-details">
                       <span className="activity-title">Eco Action Completed</span>
                       <span className="activity-desc">Completed habit {habitId.replace('_', ' ')} ({count} times)</span>
                     </div>
                     <span className="activity-time">Active</span>
                   </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="saas-page animate-page">
      <div className="saas-page-header">
        <h2 className="saas-page-title">Emission Analytics</h2>
        <p className="saas-page-subtitle">Deep dive into emission breakdown, forecast models, and trend analysis.</p>
      </div>

      <div className="bento-grid analytics-layout">
        <ChartCard id="analytics" categories={footprintBreakdown} />
        <OffsetSimulatorCard 
          id="offsets"
          offsets={offsets} 
          setOffsets={setOffsets} 
        />
        <CarbonForecastCard 
          forecast={forecast} 
          netFootprint={netFootprint} 
          recommendations={recommendations} 
        />

        <div className="bento-card col-12 historical-data-card">
          <h3 className="card-title">Historical Emission Telemetry</h3>
          {history.length === 0 ? (
            <p className="no-data" style={{ padding: '20px', color: 'var(--text-muted)' }}>No historical calculation logs recorded.</p>
          ) : (
            <div className="historical-table-wrapper">
              <table className="historical-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Baseline Footprint</th>
                    <th>Comparison</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, index) => {
                    const isFirst = index === history.length - 1;
                    const diff = index < history.length - 1 ? entry.footprint - history[index + 1].footprint : 0;
                    let diffLabel = 'First Record';
                    let diffColor = 'var(--text-muted)';
                    if (!isFirst) {
                      if (diff < 0) {
                        diffLabel = `↓ ${Math.round(Math.abs(diff))} kg CO₂e`;
                        diffColor = 'var(--accent-green)';
                      } else if (diff > 0) {
                        diffLabel = `↑ ${Math.round(diff)} kg CO₂e`;
                        diffColor = 'var(--danger)';
                      } else {
                        diffLabel = 'Unchanged';
                      }
                    }

                    return (
                      <tr key={index}>
                        <td>{entry.timestamp}</td>
                        <td><strong>{Math.round(entry.footprint).toLocaleString()} kg CO₂e/yr</strong></td>
                        <td style={{ color: diffColor }}>{diffLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAICoach = () => (
    <div className="saas-page animate-page">
      <div className="saas-page-header">
        <h2 className="saas-page-title">Carbon AI Coach</h2>
        <p className="saas-page-subtitle">Chat with our AI model for personalized carbon reduction suggestions.</p>
      </div>

      <div className="bento-grid ai-coach-layout">
        <EcoPulseAI 
          id="ai-coach"
          inputs={inputs} 
          footprintBreakdown={footprintBreakdown} 
          netFootprint={netFootprint} 
          xp={xp} 
          completedHabits={completedHabits} 
          addNotification={addNotification}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          token={token}
        />
        <RecommendationsCard 
          recommendations={recommendations} 
          onOpenCalculator={() => setShowWizard(true)}
        />
      </div>
    </div>
  );

  const renderChallenges = () => (
    <div className="saas-page animate-page">
      <div className="saas-page-header">
        <h2 className="saas-page-title">Sustainability Goals</h2>
        <p className="saas-page-subtitle">Tackle daily checklist tasks and unlock weekly milestone achievements.</p>
      </div>

      <div className="bento-grid challenges-layout">
        <ChallengeTrackerCard 
          xp={xp} 
          setXp={setXp} 
          completedHabits={completedHabits} 
          offsets={offsets} 
          challengeStats={challengeStats} 
          setChallengeStats={setChallengeStats} 
          addNotification={addNotification}
        />
        <HabitTrackerCard 
          id="habits"
          xp={xp} 
          setXp={setXp} 
          completedHabits={completedHabits} 
          setCompletedHabits={setCompletedHabits} 
          habitSavings={habitSavings} 
          setHabitSavings={setHabitSavings} 
          addNotification={addNotification}
        />

        <div className="bento-card col-6 badge-collection-card">
          <h3 className="card-title">Unlocked Badges & Credentials</h3>
          <div className="badges-grid-container">
            {[
              { id: 'starter', title: 'Eco Starter', desc: 'Unlocked at Level 1', check: true, icon: '🌱' },
              { id: 'pioneer', title: 'Green Pioneer', desc: 'Unlocked at Level 2', check: (Math.floor(xp / 100) + 1) >= 2, icon: '🚀' },
              { id: 'champion', title: 'Offset Champion', desc: 'Activate any carbon offset program', check: Object.values(offsets).some(v => v > 0), icon: '🌎' },
              { id: 'master', title: 'Habit Master', desc: 'Complete 5 or more eco actions', check: Object.values(completedHabits || {}).reduce((a, b) => a + b, 0) >= 5, icon: '👑' }
            ].map(badge => (
              <div key={badge.id} className={`badge-item ${badge.check ? 'unlocked' : 'locked'}`}>
                <div className="badge-icon-circle">
                  {badge.icon}
                </div>
                <div className="badge-info">
                  <h4 className="badge-title">{badge.title}</h4>
                  <p className="badge-desc">{badge.desc}</p>
                  <span className="badge-status-pill">{badge.check ? 'Unlocked' : 'Locked'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="saas-page animate-page">
      <div className="saas-page-header">
        <h2 className="saas-page-title">Sustainability Profile</h2>
        <p className="saas-page-subtitle">Manage user preferences, accessibility preferences, and review achievements.</p>
      </div>

      <div className="bento-grid profile-layout">
        <div className="bento-card col-12 merged-sustainability-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <CarbonPersonalityCard 
            key={personality?.key || 'default'}
            personality={personality} 
            xp={xp} 
            setXp={setXp} 
            addNotification={addNotification}
          />

          <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '24px' }}>
            <div className="sustainability-score-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ flex: '1 1 300px' }}>
                <h3 className="card-title">Sustainability Grade</h3>
                <p className="score-desc" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                  Your target is to reduce emissions under 2,000 kg/yr to align with global warming targets.
                </p>
              </div>
              <div className="score-main" style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px' }}>
                <div className="score-details" style={{ textAlign: 'right' }}>
                  <span className="score-label">Neutrality Progress</span>
                  <span className="score-value" style={{ display: 'block', fontSize: '1.6rem', fontWeight: '800', marginTop: '4px' }}>
                    {footprintBreakdown.total > 0 
                      ? `${Math.round(Math.min(100, ((footprintBreakdown.total - netFootprint) / footprintBreakdown.total) * 100))}% Reduced` 
                      : '0% Reduced'}
                  </span>
                </div>
                <div className="grade-badge" style={{ width: '70px', height: '70px', fontSize: '2.5rem' }}>
                  {netFootprint < 2000 ? 'A+' : netFootprint < 4000 ? 'A' : netFootprint < 6000 ? 'B' : 'C'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <header className="app-header">
        <div className="brand-group" style={{ gap: '8px' }}>
          {inputs && token && (
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              aria-label="Toggle Navigation"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}
            >
              <Menu size={24} />
            </button>
          )}
          <div onClick={handleResetToWelcome} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} title="Go to Welcome Page">
            <Leaf className="brand-logo" size={32} />
            <h1 className="brand-name">EcoPulse</h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <AccessibilitySettings 
            highContrast={highContrast}
            setHighContrast={setHighContrast}
            fontSize={fontSize}
            setFontSize={setFontSize}
            reducedMotion={reducedMotion}
            setReducedMotion={setReducedMotion}
          />

          {inputs && token && (
            <button 
              type="button"
              className="btn btn-secondary" 
              style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleResetToWelcome}
              aria-label="Recalculate baseline footprint"
            >
              <RefreshCw size={14} /> Recalculate
            </button>
          )}

          {inputs && token && (
            <div className="user-badge-header">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Level:</span>
              <span className="xp-indicator">{Math.floor(xp / 100) + 1}</span>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />
              <span className="xp-indicator">{xp} XP</span>
            </div>
          )}

          {token && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {user && (
                <span className="user-email-header" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {user.email}
                </span>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.8rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {!token ? (
        <main style={{ flex: '1', display: 'flex', alignItems: 'center', padding: '20px 0 60px' }}>
          <AuthPage onAuthSuccess={handleAuthSuccess} />
        </main>
      ) : (
        <>
          {inputs && (
            <Navbar 
              isOpen={isMobileMenuOpen} 
              setIsOpen={setIsMobileMenuOpen} 
              notifications={notifications}
              markAsRead={markAsRead}
              markAllAsRead={markAllAsRead}
              clearNotification={clearNotification}
              clearAllNotifications={clearAllNotifications}
              currentRoute={currentRoute}
            />
          )}

          <main style={{ flex: '1', display: 'flex', alignItems: 'center', padding: '20px 0 60px' }}>
            {inputs ? (
              isPageLoading ? (
                <PageLoader />
              ) : (
                currentRoute === 'dashboard' ? renderDashboard() :
                currentRoute === 'analytics' ? renderAnalytics() :
                currentRoute === 'ai-coach' ? renderAICoach() :
                currentRoute === 'challenges' ? renderChallenges() :
                renderProfile()
              )
            ) : (
          <div className="bento-card welcome-card">
            <div className="card-icon-wrapper" style={{ width: '64px', height: '64px', background: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-green)', marginBottom: '5px' }}>
              <Leaf size={32} className="float" />
            </div>
            
            <h2 style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: '2.2rem', 
              fontWeight: '800',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #34d399, #06b6d4)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              marginBottom: '5px'
            }}>
              Welcome to EcoPulse
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '480px', marginBottom: '15px' }}>
              Understand your environmental footprint, build a personalized carbon reduction plan, and track your daily eco-habits.
            </p>

            {/* Feature Highlights Grid */}
            <div className="welcome-highlights">
              <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '15px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ color: 'var(--accent-green)' }}><BarChart3 size={20} /></div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0 }}>Track Footprint</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Baseline analytics</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '15px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ color: 'var(--accent-orange)' }}><CheckSquare size={20} /></div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0 }}>Daily Green Habits</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Earn XP & rewards</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '15px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ color: 'var(--accent-blue)' }}><Globe size={20} /></div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0 }}>Offset Carbon</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Heal the EcoSphere</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', margin: '0 auto' }}>
              <button 
                type="button"
                className="btn btn-primary btn-pulse" 
                style={{ padding: '14px 28px', fontSize: '0.95rem', fontWeight: '700' }}
                onClick={() => setShowWizard(true)}
              >
                Get Started
              </button>
            </div>
          </div>
            )}
          </main>
        </>
      )}

      {/* Onboarding Wizard Modal */}
      {showWizard && (
        <OnboardingWizard onComplete={saveInputs} />
      )}

      {/* Accessible Footer */}
      <footer 
        style={{ 
          textAlign: 'center', 
          padding: '24px 20px', 
          borderTop: '1px solid var(--card-border)', 
          background: 'rgba(5, 10, 8, 0.4)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          marginTop: 'auto'
        }}
      >
        <span>© {new Date().getFullYear()} EcoPulse Carbon Platform. Built for Virtual PromptWars.</span>
      </footer>

    </div>
  );
}
