import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthPage from '../AuthPage';

describe('AuthPage & Demo Account Access', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url.includes('/api/auth/demo-credentials')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ email: 'demo@ecopulse.app', password: 'EcoDemo123!' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  it('renders the privacy demo banner with demo credentials', () => {
    render(<AuthPage onAuthSuccess={vi.fn()} />);

    expect(screen.getByTestId('demo-access-banner')).toBeInTheDocument();
    expect(screen.getByText('Privacy-First Demo Access')).toBeInTheDocument();
    expect(screen.getByTestId('demo-email-display')).toHaveTextContent('demo@ecopulse.app');
    expect(screen.getByTestId('demo-password-display')).toHaveTextContent('EcoDemo123!');
    expect(screen.getByTestId('demo-login-btn')).toBeInTheDocument();
    expect(screen.getByTestId('demo-autofill-btn')).toBeInTheDocument();
  });

  it('auto-fills demo credentials into the login inputs when Auto-fill is clicked', async () => {
    const user = userEvent.setup();
    render(<AuthPage onAuthSuccess={vi.fn()} />);

    const autoFillBtn = screen.getByTestId('demo-autofill-btn');
    await user.click(autoFillBtn);

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    expect(emailInput).toHaveValue('demo@ecopulse.app');
    expect(passwordInput).toHaveValue('EcoDemo123!');
  });

  it('performs one-click demo login successfully and triggers onAuthSuccess', async () => {
    const mockOnAuthSuccess = vi.fn();
    const mockResponse = {
      token: 'mock-demo-jwt-token',
      user: {
        id: 'mock-demo-id',
        name: 'Eco Demo User',
        email: 'demo@ecopulse.app'
      }
    };

    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url.includes('/api/auth/demo-login')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    const user = userEvent.setup();
    render(<AuthPage onAuthSuccess={mockOnAuthSuccess} />);

    const demoLoginBtn = screen.getByTestId('demo-login-btn');
    await user.click(demoLoginBtn);

    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalledWith(
        'mock-demo-jwt-token',
        expect.objectContaining({ email: 'demo@ecopulse.app' })
      );
    });
  });

  it('falls back to standard login if demo-login endpoint returns error', async () => {
    const mockOnAuthSuccess = vi.fn();
    const mockResponse = {
      token: 'fallback-demo-jwt',
      user: {
        id: 'fallback-id',
        name: 'Eco Demo User',
        email: 'demo@ecopulse.app'
      }
    };

    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url.includes('/api/auth/demo-login')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Endpoint not supported' })
        });
      }
      if (url.includes('/api/auth/login')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    const user = userEvent.setup();
    render(<AuthPage onAuthSuccess={mockOnAuthSuccess} />);

    const demoLoginBtn = screen.getByTestId('demo-login-btn');
    await user.click(demoLoginBtn);

    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalledWith('fallback-demo-jwt', expect.any(Object));
    });
  });

  it('fills demo credentials when Try Demo button is clicked, and logs in when Log In is clicked', async () => {
    const mockOnAuthSuccess = vi.fn();
    const mockResponse = {
      token: 'valid-demo-session-token',
      user: {
        id: 'demo-user-id',
        name: 'Eco Demo User',
        email: 'demo@ecopulse.app'
      }
    };

    vi.spyOn(global, 'fetch').mockImplementation((url, options) => {
      if (url.includes('/api/auth/login')) {
        const body = JSON.parse(options?.body || '{}');
        if (body.email === 'demo@ecopulse.app' && body.password === 'EcoDemo123!') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse)
          });
        }
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    const user = userEvent.setup();
    render(<AuthPage onAuthSuccess={mockOnAuthSuccess} />);

    // 1. Click "Try Demo" button on login form
    const tryDemoBtn = screen.getByTestId('try-demo-btn');
    expect(tryDemoBtn).toBeInTheDocument();
    await user.click(tryDemoBtn);

    // Verify fields are populated
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    expect(emailInput).toHaveValue('demo@ecopulse.app');
    expect(passwordInput).toHaveValue('EcoDemo123!');

    // 2. Click "Log In" button
    const logInBtn = screen.getByTestId('login-submit-btn');
    expect(logInBtn).toHaveTextContent('Log In');
    await user.click(logInBtn);

    // 3. Verify user is authenticated and app opens
    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalledWith(
        'valid-demo-session-token',
        expect.objectContaining({ email: 'demo@ecopulse.app' })
      );
    });
  });

  it('allows switching to Register tab and displays registration form', async () => {
    const user = userEvent.setup();
    render(<AuthPage onAuthSuccess={vi.fn()} />);

    const registerTab = screen.getByRole('button', { name: 'Register' });
    await user.click(registerTab);

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
  });
});
