import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

beforeEach(() => {
  localStorage.setItem('ecopulse_token', 'mock-jwt-token');
  localStorage.setItem('ecopulse_user', JSON.stringify({ email: 'test@ecopulse.org' }));

  // Intercept fetch calls to mock DB profile responses
  vi.spyOn(global, 'fetch').mockImplementation((url) => {
    if (url.includes('/api/user/profile')) {
      const inputs = localStorage.getItem('ecopulse_inputs') ? JSON.parse(localStorage.getItem('ecopulse_inputs')) : null;
      const xp = localStorage.getItem('ecopulse_xp') ? parseInt(localStorage.getItem('ecopulse_xp')) : 0;
      const completedHabits = localStorage.getItem('ecopulse_habits') ? JSON.parse(localStorage.getItem('ecopulse_habits')) : {};
      const history = localStorage.getItem('ecopulse_history') ? JSON.parse(localStorage.getItem('ecopulse_history')) : [];
      const offsets = localStorage.getItem('ecopulse_offsets') ? JSON.parse(localStorage.getItem('ecopulse_offsets')) : { treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 };

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          inputs,
          xp,
          completedHabits,
          challengeStats: { streak: 0, completedTotal: 0, lastCompletedDate: null },
          offsets,
          history,
          notifications: [],
          chatHistory: [],
          settings: { highContrast: false, fontSize: 'normal', reducedMotion: false }
        })
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({})
    });
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

// Mock EcoPulseAI to avoid Gemini API complexity in integration tests
vi.mock('../components/EcoPulseAI', () => ({
  default: () => <div data-testid="ecopulse-ai">EcoPulse AI Mock</div>
}));

// Mock EcoSphere to avoid complex SVG rendering issues
vi.mock('../components/EcoSphere', () => ({
  default: ({ netFootprint }) => <div data-testid="ecosphere">EcoSphere: {netFootprint}</div>
}));

const SAMPLE_INPUTS = {
  commuteDistance: 30,
  transportType: 'gasoline',
  flightHours: 5,
  electricityKwh: 200,
  greenEnergyShare: 0,
  heatingSource: 'gas',
  dietType: 'lowMeat',
  shoppingHabit: 'average',
  recycles: true
};

describe('App — Welcome State', () => {
  it('renders the welcome screen when no localStorage inputs exist', () => {
    render(<App />);
    expect(screen.getByText('Welcome to EcoPulse')).toBeInTheDocument();
  });

  it('renders the brand name "EcoPulse"', () => {
    render(<App />);
    expect(screen.getByText('EcoPulse')).toBeInTheDocument();
  });

  it('displays "Get Started" button on welcome screen', () => {
    render(<App />);
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('opens onboarding wizard when "Get Started" is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await user.click(screen.getByText('Get Started'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Calculate Your Baseline')).toBeInTheDocument();
  });

  it('shows feature highlights on welcome page', () => {
    render(<App />);
    expect(screen.getByText('Track Footprint')).toBeInTheDocument();
    expect(screen.getByText('Daily Green Habits')).toBeInTheDocument();
    expect(screen.getByText('Offset Carbon')).toBeInTheDocument();
  });

  it('always renders the accessibility settings widget', () => {
    render(<App />);
    expect(screen.getByLabelText('Accessibility Settings')).toBeInTheDocument();
  });

  it('renders the footer with copyright', () => {
    render(<App />);
    expect(screen.getByText(/EcoPulse Carbon Platform/)).toBeInTheDocument();
  });
});

describe('App — Dashboard State (localStorage hydration)', () => {
  beforeEach(() => {
    localStorage.setItem('ecopulse_inputs', JSON.stringify(SAMPLE_INPUTS));
    localStorage.setItem('ecopulse_xp', '250');
    localStorage.setItem('ecopulse_habits', JSON.stringify({ commute_green: 2 }));
  });

  it('renders dashboard when localStorage inputs exist', () => {
    render(<App />);
    expect(screen.queryByText('Welcome to EcoPulse')).not.toBeInTheDocument();
    expect(screen.getByText('Carbon Scoreboard')).toBeInTheDocument();
  });

  it('hydrates XP from localStorage', () => {
    render(<App />);
    // XP appears in header as '250 XP'
    const xpElements = screen.getAllByText('250 XP');
    expect(xpElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows user level in header', () => {
    render(<App />);
    // Level = Math.floor(250/100) + 1 = 3
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders dashboard cards by default on dashboard route', () => {
    render(<App />);
    expect(screen.getByText('Control Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Carbon Scoreboard')).toBeInTheDocument();
    expect(screen.getByText('Smart Carbon Scanner')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity Logs')).toBeInTheDocument();
  });

  it('allows navigation to other SaaS routes on hashchange', async () => {
    render(<App />);
    
    // Simulate navigation to analytics
    window.location.hash = '#analytics';
    fireEvent(window, new HashChangeEvent('hashchange'));
    
    // findByText automatically waits for the 350ms simulated telemetry loader delay
    expect(await screen.findByText('Emission Analytics')).toBeInTheDocument();
    expect(screen.getByText('Emission Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Carbon Offset Simulator')).toBeInTheDocument();

    // Simulate navigation to challenges
    window.location.hash = '#challenges';
    fireEvent(window, new HashChangeEvent('hashchange'));
    
    expect(await screen.findByText('Sustainability Goals')).toBeInTheDocument();
    expect(screen.getByText('Daily Green Actions')).toBeInTheDocument();
  });

  it('shows Recalculate button on dashboard', () => {
    render(<App />);
    expect(screen.getByLabelText('Recalculate baseline footprint')).toBeInTheDocument();
  });

  it('shows Dashboard link on navbar', () => {
    render(<App />);
    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
  });

  it('calls window.scrollTo(0,0) when inputs load', () => {
    render(<App />);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});

describe('App — State Persistence', () => {
  it('saves inputs to localStorage after wizard completion', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Open wizard
    await user.click(screen.getByText('Get Started'));
    
    // Navigate through all 4 steps
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByText(/Continue/i));
    }
    
    // Submit via the Calculate button
    await user.click(screen.getByRole('button', { name: /Calculate/i }));
    
    // Verify localStorage was populated
    const storedInputs = JSON.parse(localStorage.getItem('ecopulse_inputs'));
    expect(storedInputs).toBeTruthy();
    expect(storedInputs).toHaveProperty('commuteDistance');
    expect(storedInputs).toHaveProperty('transportType');
  });

  it('saves history entry after wizard completion', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await user.click(screen.getByText('Get Started'));
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByText(/Continue/i));
    }
    await user.click(screen.getByRole('button', { name: /Calculate/i }));
    
    const history = JSON.parse(localStorage.getItem('ecopulse_history'));
    expect(history).toBeTruthy();
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0]).toHaveProperty('footprint');
  });

  it('persists accessibility high contrast preference', () => {
    localStorage.setItem('ecopulse_high_contrast', 'true');
    render(<App />);
    // The body class should be set
    expect(document.body.classList.contains('high-contrast')).toBe(true);
  });

  it('persists accessibility font size preference', () => {
    localStorage.setItem('ecopulse_font_size', 'large');
    render(<App />);
    expect(document.body.classList.contains('accessibility-font-large')).toBe(true);
  });

  it('persists reduced motion preference', () => {
    localStorage.setItem('ecopulse_reduced_motion', 'true');
    render(<App />);
    expect(document.body.classList.contains('reduced-motion')).toBe(true);
  });

  it('toggles mobile menu and triggers recalculate flow', async () => {
    const user = userEvent.setup();
    localStorage.setItem('ecopulse_inputs', JSON.stringify(SAMPLE_INPUTS));
    render(<App />);
    
    // Toggle mobile menu
    const menuBtn = screen.getByLabelText('Toggle Navigation');
    await user.click(menuBtn);
    
    // Trigger recalculate
    const recalcBtn = screen.getByLabelText('Recalculate baseline footprint');
    await user.click(recalcBtn);
    expect(screen.getByText('Welcome to EcoPulse')).toBeInTheDocument();
  });
});
