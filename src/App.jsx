import { EcoPulseProvider, useEcoPulse } from './context/EcoPulseContext';
import { Leaf, RefreshCw, BarChart3, CheckSquare, Globe, Menu } from 'lucide-react';
import OnboardingWizard from './components/OnboardingWizard';
import AccessibilitySettings from './components/AccessibilitySettings';
import AuthPage from './components/AuthPage';
import Navbar from './components/Navbar';
import NotificationBell from './components/NotificationBell';

// Page Components
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import AICoach from './pages/AICoach';
import Challenges from './pages/Challenges';
import Profile from './pages/Profile';

const PageLoader = () => (
  <div className="page-loader-shimmer" data-testid="page-loader">
    <div className="shimmer-spinner"></div>
    <p className="shimmer-text">Retrieving EcoPulse Telemetry...</p>
  </div>
);

function AppContent() {
  const {
    token,
    user,
    inputs,
    xp,
    showWizard,
    setShowWizard,
    isNewUser,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    notifications,
    currentRoute,
    isPageLoading,
    handleLogout,
    handleAuthSuccess,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    saveInputs,
    handleResetToWelcome,
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    reducedMotion,
    setReducedMotion
  } = useEcoPulse();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <header className="app-header">
        <div className="brand-group" style={{ gap: '8px' }}>
          {inputs && !isNewUser && token && (
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
          {inputs && !isNewUser && token && (
            <NotificationBell 
              notifications={notifications}
              markAsRead={markAsRead}
              markAllAsRead={markAllAsRead}
              clearNotification={clearNotification}
              clearAllNotifications={clearAllNotifications}
            />
          )}
          <AccessibilitySettings 
            highContrast={highContrast}
            setHighContrast={setHighContrast}
            fontSize={fontSize}
            setFontSize={setFontSize}
            reducedMotion={reducedMotion}
            setReducedMotion={setReducedMotion}
          />

          {inputs && !isNewUser && token && (
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

          {inputs && !isNewUser && token && (
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
          {inputs && !isNewUser && (
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
            {inputs && !isNewUser ? (
              isPageLoading ? (
                <PageLoader />
              ) : (
                currentRoute === 'dashboard' ? <Dashboard /> :
                currentRoute === 'analytics' ? <Analytics /> :
                currentRoute === 'ai-coach' ? <AICoach /> :
                currentRoute === 'challenges' ? <Challenges /> :
                <Profile />
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

export default function App() {
  return (
    <EcoPulseProvider>
      <AppContent />
    </EcoPulseProvider>
  );
}
