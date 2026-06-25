import { useState } from 'react';
import { Leaf, Mail, Lock, User, Key, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function AuthPage({ onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Forgot Password / Reset Password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1 = request token, 2 = reset password with token

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      // Success
      onAuthSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed. Please try again.');
      }

      // Success
      onAuthSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed.');
      }

      setMessage(data.message);
      // For testing convenience, we auto-populate the token if present in debug output
      if (data.debugToken) {
        console.log("Debug Token received:", data.debugToken);
        setResetToken(data.debugToken);
      }
      setResetStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Reset password failed.');
      }

      setMessage(data.message);
      setIsForgotPassword(false);
      setResetStep(1);
      setForgotEmail('');
      setResetToken('');
      setNewPassword('');
      setActiveTab('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '450px',
      margin: '40px auto',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      animation: 'modalScale 0.4s ease'
    }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(16, 185, 129, 0.08)',
          color: 'var(--accent-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Leaf size={28} />
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '8px 0 2px' }}>EcoPulse Platform</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {isForgotPassword ? 'Reset your account security password' : 'Track, reduce, and offset your carbon footprint'}
        </p>
      </div>

      <div className="bento-card" style={{ padding: '32px' }}>
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            borderRadius: 'var(--border-radius-md)',
            padding: '12px',
            fontSize: '0.8rem',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
            borderRadius: 'var(--border-radius-md)',
            padding: '12px',
            fontSize: '0.8rem',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {isForgotPassword ? (
          /* FORGOT / RESET PASSWORD FORM */
          resetStep === 1 ? (
            <form onSubmit={handleForgotPasswordRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" htmlFor="forgot-email">Account Email</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="forgot-email"
                    type="email"
                    className="ai-chat-input"
                    style={{ paddingLeft: '40px', width: '100%', height: '46px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-md)', color: 'var(--text-primary)' }}
                    placeholder="name@domain.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', height: '46px' }}
                disabled={loading}
              >
                {loading ? 'Sending Request...' : 'Generate Reset Token'}
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  alignSelf: 'center',
                  marginTop: '10px'
                }}
                onClick={() => setIsForgotPassword(false)}
              >
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" htmlFor="reset-token">Reset Token</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reset-token"
                    type="text"
                    className="ai-chat-input"
                    style={{ paddingLeft: '40px', width: '100%', height: '46px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-md)', color: 'var(--text-primary)' }}
                    placeholder="Enter received reset token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                  />
                  <Key size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  * The test token was also logged to the Node.js server console.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" htmlFor="new-password">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="new-password"
                    type="password"
                    className="ai-chat-input"
                    style={{ paddingLeft: '40px', width: '100%', height: '46px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-md)', color: 'var(--text-primary)' }}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', height: '46px' }}
                disabled={loading}
              >
                {loading ? 'Resetting Password...' : 'Save New Password'}
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  alignSelf: 'center',
                  marginTop: '10px'
                }}
                onClick={() => {
                  setResetStep(1);
                  setIsForgotPassword(false);
                }}
              >
                Cancel Reset
              </button>
            </form>
          )
        ) : (
          /* STANDARD LOGIN / SIGNUP TABS */
          <>
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--border-radius-md)',
              padding: '4px',
              marginBottom: '28px'
            }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: 'none',
                  borderRadius: 'var(--border-radius-sm)',
                  background: activeTab === 'login' ? 'var(--accent-green-glow)' : 'transparent',
                  color: activeTab === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  transition: 'var(--transition-smooth)'
                }}
                onClick={() => {
                  setActiveTab('login');
                  setError('');
                }}
              >
                Login
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: 'none',
                  borderRadius: 'var(--border-radius-sm)',
                  background: activeTab === 'signup' ? 'var(--accent-green-glow)' : 'transparent',
                  color: activeTab === 'signup' ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  transition: 'var(--transition-smooth)'
                }}
                onClick={() => {
                  setActiveTab('signup');
                  setError('');
                }}
              >
                Register
              </button>
            </div>

            {activeTab === 'login' ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="login-email">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="login-email"
                      type="email"
                      className="ai-chat-input"
                      style={{ paddingLeft: '40px', width: '100%', height: '46px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-md)', color: 'var(--text-primary)' }}
                      placeholder="name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" htmlFor="login-password" style={{ margin: 0 }}>Password</label>
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-green)', fontSize: '0.75rem', cursor: 'pointer' }}
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setMessage('');
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className="ai-chat-input"
                      style={{ paddingLeft: '40px', paddingRight: '40px', width: '100%', height: '46px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-md)', color: 'var(--text-primary)' }}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                    <button
                      type="button"
                      style={{ position: 'absolute', right: '14px', top: '14px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', height: '46px', marginTop: '10px' }}
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Sign In'}
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              /* SIGNUP FORM */
              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="register-name">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="register-name"
                      type="text"
                      className="ai-chat-input"
                      style={{ paddingLeft: '40px', width: '100%', height: '46px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-md)', color: 'var(--text-primary)' }}
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="register-email">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="register-email"
                      type="email"
                      className="ai-chat-input"
                      style={{ paddingLeft: '40px', width: '100%', height: '46px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-md)', color: 'var(--text-primary)' }}
                      placeholder="name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="register-password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      className="ai-chat-input"
                      style={{ paddingLeft: '40px', paddingRight: '40px', width: '100%', height: '46px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-md)', color: 'var(--text-primary)' }}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                    <button
                      type="button"
                      style={{ position: 'absolute', right: '14px', top: '14px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="register-confirm">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="register-confirm"
                      type="password"
                      className="ai-chat-input"
                      style={{ paddingLeft: '40px', width: '100%', height: '46px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-md)', color: 'var(--text-primary)' }}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', height: '46px', marginTop: '10px' }}
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Register'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
