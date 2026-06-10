import React, { useState } from 'react';
import { Search, Sun, Moon, Cloud, CloudOff, Globe, MapPin, User, LogOut, ChevronDown, Check, Activity } from 'lucide-react';

const Header = ({ 
  searchQuery, 
  setSearchQuery, 
  isNearbyOnly, 
  setIsNearbyOnly, 
  isOffline, 
  isLightTheme, 
  toggleTheme,
  currentUser,
  onOpenAuth,
  onLogout,
  activeView,
  setActiveView,
  onlineCount = 3,
  onlineStatus = 'online',
  onChangeStatus
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Helper to render status dot style
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10b981'; // Green
      case 'away': return '#f59e0b'; // Amber
      case 'offline': return '#ef4444'; // Red
      default: return '#64748b'; // Grey
    }
  };

  const getInitials = (name) => {
    if (!name) return 'H';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        
        {/* Left Side: Brand Logo and Title */}
        <div className="brand-section" style={{ cursor: 'pointer' }} onClick={() => setActiveView('feed')}>
          <div className="brand-logo">H</div>
          <div className="brand-info">
            <h1>Helpingo</h1>
            <p>Share problems. Find local & global solutions.</p>
          </div>
        </div>

        {/* Middle: Live Search Bar (Only display if viewing feed) */}
        <div className="search-bar-container" style={{ visibility: activeView === 'feed' ? 'visible' : 'hidden' }}>
          <Search size={16} className="search-icon-inside" />
          <input 
            type="text" 
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Right Side: Toggles, Connection Status, Profile dropdown */}
        <div className="header-controls">
          
          {/* Active Members Count */}
          <div 
            className="active-counter-badge" 
            title="Active neighbors currently online coordinate"
          >
            <span className="pulse-dot-online" style={{ background: getStatusColor(onlineStatus) }}></span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {onlineCount} active now
            </span>
          </div>

          {/* Nearby vs Global Toggle (Only on Feed view) */}
          {activeView === 'feed' && (
            <div className="map-toggle-view">
              <button 
                className={`map-toggle-btn ${isNearbyOnly ? 'active' : ''}`}
                onClick={() => setIsNearbyOnly(true)}
                title="Filter by nearby problems"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> Nearby
                </span>
              </button>
              <button 
                className={`map-toggle-btn ${!isNearbyOnly ? 'active' : ''}`}
                onClick={() => setIsNearbyOnly(false)}
                title="Show problems globally"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={12} /> Global
                </span>
              </button>
            </div>
          )}

          {/* Resiliency Sync Status Indicator */}
          <div 
            className={`badge ${isOffline ? 'badge-emergency' : 'badge-ngo'}`}
            style={{ padding: '8px 12px', borderRadius: '10px' }}
            title={isOffline ? "Running in Offline Mode. Saves to localStorage." : "Connected to Live Helpingo Server."}
          >
            {isOffline ? (
              <>
                <CloudOff size={14} />
                <span style={{ fontSize: '0.75rem', textTransform: 'none' }}>Offline Mode</span>
              </>
            ) : (
              <>
                <Cloud size={14} />
                <span style={{ fontSize: '0.75rem', textTransform: 'none' }}>Live Synced</span>
              </>
            )}
          </div>

          {/* Theme Toggle Switcher */}
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            title={isLightTheme ? "Switch to Dark Mode" : "Switch to Light Mode"}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Authentication Dropdown Button */}
          {!currentUser ? (
            <button className="btn-primary" onClick={onOpenAuth} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              <User size={14} />
              <span>Sign In</span>
            </button>
          ) : (
            <div className="profile-dropdown-wrapper">
              <button 
                className="profile-menu-trigger" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
              >
                <div className="avatar-header-circle">
                  {getInitials(currentUser.username)}
                  <span 
                    className="avatar-status-dot" 
                    style={{ backgroundColor: getStatusColor(onlineStatus) }}
                  />
                </div>
                <span className="header-username">{currentUser.username.split(' ')[0]}</span>
                <ChevronDown size={14} className={`chevron-transition ${dropdownOpen ? 'rotated' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="profile-dropdown-menu card-glass animate-slide-down">
                  <div className="dropdown-user-info">
                    <p className="dropdown-username">{currentUser.username}</p>
                    <p className="dropdown-email">{currentUser.email}</p>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  {/* Status Selection */}
                  <div className="dropdown-status-picker">
                    <span className="status-label">MY STATUS:</span>
                    <button onClick={() => onChangeStatus('online')} className={`status-option ${onlineStatus === 'online' ? 'active' : ''}`}>
                      <span className="dot" style={{ backgroundColor: '#10b981' }}></span> Online
                      {onlineStatus === 'online' && <Check size={12} className="check-icon" />}
                    </button>
                    <button onClick={() => onChangeStatus('away')} className={`status-option ${onlineStatus === 'away' ? 'active' : ''}`}>
                      <span className="dot" style={{ backgroundColor: '#f59e0b' }}></span> Away
                      {onlineStatus === 'away' && <Check size={12} className="check-icon" />}
                    </button>
                    <button onClick={() => onChangeStatus('offline')} className={`status-option ${onlineStatus === 'offline' ? 'active' : ''}`}>
                      <span className="dot" style={{ backgroundColor: '#ef4444' }}></span> Offline Mode
                      {onlineStatus === 'offline' && <Check size={12} className="check-icon" />}
                    </button>
                  </div>

                  <div className="dropdown-divider"></div>

                  {/* Navigation Views */}
                  {activeView === 'feed' ? (
                    <button 
                      onClick={() => setActiveView('dashboard')} 
                      className="dropdown-item"
                    >
                      <Activity size={14} />
                      <span>My Dashboard</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => setActiveView('feed')} 
                      className="dropdown-item"
                    >
                      <Globe size={14} />
                      <span>Community Feed</span>
                    </button>
                  )}

                  <div className="dropdown-divider"></div>

                  {/* Logout */}
                  <button onClick={onLogout} className="dropdown-item logout-item">
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default Header;
