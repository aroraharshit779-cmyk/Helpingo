import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, RotateCw, ShieldCheck, AlertCircle, FileText } from 'lucide-react';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing characters like 0, O, 1, I

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    bio: '',
    captchaInput: ''
  });
  
  const [captchaText, setCaptchaText] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0); // Used to trigger refresh of random visual attributes
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Generate Captcha text
  const generateCaptcha = () => {
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
    }
    setCaptchaText(result);
    setCaptchaKey(prev => prev + 1);
    setFormData(prev => ({ ...prev, captchaInput: '' }));
    setErrorMsg('');
  };

  useEffect(() => {
    if (isOpen) {
      generateCaptcha();
      setFormData({
        username: '',
        email: '',
        password: '',
        bio: '',
        captchaInput: ''
      });
      setErrorMsg('');
    }
  }, [isOpen, isRegister]);

  if (!isOpen) return null;

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Verify Captcha
    if (formData.captchaInput.toUpperCase() !== captchaText) {
      setErrorMsg('Incorrect Captcha verification code.');
      generateCaptcha();
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const bodyData = isRegister 
        ? { username: formData.username, email: formData.email, password: formData.password, bio: formData.bio }
        : { username: formData.username, password: formData.password };

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Success
      onLoginSuccess(data);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
      generateCaptcha();
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Generate SVG distortion components
  const renderCaptchaSvg = () => {
    const lines = [];
    const dots = [];
    const charElements = [];

    // Distorting Lines
    for (let i = 0; i < 4; i++) {
      const x1 = Math.random() * 40;
      const y1 = Math.random() * 40;
      const x2 = 120 + Math.random() * 40;
      const y2 = Math.random() * 40;
      lines.push(
        <line
          key={`line-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={i % 2 === 0 ? 'var(--primary)' : 'var(--secondary)'}
          strokeWidth="1.5"
          opacity="0.35"
        />
      );
    }

    // Noise dots
    for (let i = 0; i < 20; i++) {
      const cx = Math.random() * 160;
      const cy = Math.random() * 40;
      dots.push(
        <circle
          key={`dot-${i}`}
          cx={cx}
          cy={cy}
          r="1.5"
          fill={i % 2 === 0 ? 'var(--primary)' : 'var(--secondary)'}
          opacity="0.4"
        />
      );
    }

    // Characters with distortion
    for (let i = 0; i < captchaText.length; i++) {
      const char = captchaText[i];
      const fontSize = 22 + Math.random() * 6;
      const rotation = -20 + Math.random() * 40;
      const yOffset = 26 + Math.random() * 6;
      const fill = i % 2 === 0 ? 'var(--primary)' : 'var(--secondary)';
      const xPos = 15 + i * 28;

      charElements.push(
        <text
          key={`char-${i}`}
          x={xPos}
          y={yOffset}
          fontSize={fontSize}
          fontWeight="bold"
          fill={fill}
          transform={`rotate(${rotation}, ${xPos}, ${yOffset})`}
          style={{ userSelect: 'none', fontFamily: 'Outfit, sans-serif' }}
        >
          {char}
        </text>
      );
    }

    return (
      <svg className="captcha-svg-canvas" width="160" height="40" style={{ background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
        {lines}
        {dots}
        {charElements}
      </svg>
    );
  };

  return (
    <div className="auth-overlay">
      <div className={`card-glass auth-modal-card ${shake ? 'shake-element' : ''} animate-fade-in`}>
        {/* Close Button */}
        <button className="auth-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Brand Banner */}
        <div className="auth-brand-info">
          <div className="auth-logo">H</div>
          <h3>Welcome to Helpingo</h3>
          <p>Connect with your community to share local needs and solutions.</p>
        </div>

        {/* Tabs switcher */}
        <div className="auth-tabs">
          <button 
            type="button" 
            className={`auth-tab-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => setIsRegister(false)}
          >
            Sign In
          </button>
          <button 
            type="button" 
            className={`auth-tab-btn ${isRegister ? 'active' : ''}`}
            onClick={() => setIsRegister(true)}
          >
            Create Account
          </button>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Username */}
          <div className="form-group">
            <label htmlFor="auth-username">USERNAME</label>
            <div className="auth-input-wrapper">
              <User size={16} className="auth-input-icon" />
              <input
                id="auth-username"
                type="text"
                name="username"
                placeholder="e.g. Vikram Singh"
                value={formData.username}
                onChange={handleChange}
                required
                className="form-input auth-input"
              />
            </div>
          </div>

          {/* Email (Register Only) */}
          {isRegister && (
            <div className="form-group animate-fade-in">
              <label htmlFor="auth-email">EMAIL ADDRESS</label>
              <div className="auth-input-wrapper">
                <Mail size={16} className="auth-input-icon" />
                <input
                  id="auth-email"
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input auth-input"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label htmlFor="auth-password">PASSWORD</label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="auth-password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input auth-input"
              />
            </div>
          </div>

          {/* Bio (Register Only) */}
          {isRegister && (
            <div className="form-group animate-fade-in">
              <label htmlFor="auth-bio">SHORT BIO (OPTIONAL)</label>
              <div className="auth-input-wrapper">
                <FileText size={16} className="auth-input-icon" />
                <input
                  id="auth-bio"
                  type="text"
                  name="bio"
                  placeholder="e.g. Active volunteer in Block C"
                  value={formData.bio}
                  onChange={handleChange}
                  className="form-input auth-input"
                />
              </div>
            </div>
          )}

          {/* Captcha Verification */}
          <div className="form-group captcha-group">
            <label>ROBOT VERIFICATION</label>
            <div className="captcha-container">
              {renderCaptchaSvg()}
              <button 
                type="button" 
                className="captcha-refresh-btn" 
                onClick={generateCaptcha}
                title="Generate new Captcha"
              >
                <RotateCw size={16} />
              </button>
            </div>
            
            <div className="auth-input-wrapper" style={{ marginTop: '8px' }}>
              <ShieldCheck size={16} className="auth-input-icon" />
              <input
                type="text"
                name="captchaInput"
                placeholder="Enter characters shown above"
                value={formData.captchaInput}
                onChange={handleChange}
                required
                maxLength={5}
                className="form-input auth-input captcha-input"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : isRegister ? 'Register & Sign In' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
