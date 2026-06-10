import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, Award, MessageSquare, AlertCircle, 
  CheckCircle2, Edit2, Save, MapPin, Activity, Clock 
} from 'lucide-react';
import { API_BASE_URL } from '../config';


const Dashboard = ({ username, onResolveProblem }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch user stats & bio details
  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${username}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setBioInput(data.bio || '');
      } else {
        throw new Error('Failed to fetch profile statistics.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchStats();
    }
  }, [username]);

  // Handle Bio Update
  const handleBioSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${username}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: bioInput })
      });
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({ ...prev, bio: data.bio }));
        setIsEditingBio(false);
      } else {
        throw new Error('Could not update profile bio.');
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleResolve = async (problemId) => {
    // Call parent resolve handler to update DB and global state
    await onResolveProblem(problemId);
    // Reload dashboard stats to update status locally
    fetchStats();
  };

  if (loading) {
    return (
      <div className="card-glass skeleton-shimmer" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton-text" style={{ width: '120px', height: '24px', background: 'rgba(255,255,255,0.05)' }}></div>
            <div className="skeleton-text" style={{ width: '180px', height: '14px', background: 'rgba(255,255,255,0.05)' }}></div>
          </div>
        </div>
        <div className="skeleton-text" style={{ height: '40px', background: 'rgba(255,255,255,0.05)' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div style={{ height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
          <div style={{ height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
          <div style={{ height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
        </div>
      </div>
    );
  }

  // Get Initials for Avatar
  const getInitials = (name) => {
    if (!name) return 'H';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format Join Date
  const formatDate = (isoString) => {
    if (!isoString) return 'Member';
    return new Date(isoString).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Get Category Badge Style
  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'Emergency': return 'badge-emergency';
      case 'NGO Assistance': return 'badge-ngo';
      case 'Student Support': return 'badge-student';
      default: return 'badge-general';
    }
  };

  return (
    <div className="dashboard-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header Profile Panel */}
      <div className="card-glass profile-panel">
        <div className="profile-details">
          <div className="profile-avatar-gradient">
            {getInitials(username)}
          </div>
          
          <div className="profile-info-block">
            <h2 className="profile-username">{username}</h2>
            <div className="profile-joined-date">
              <Calendar size={14} />
              <span>Joined {formatDate(stats?.joinedDate)}</span>
            </div>
            
            <span className="presence-badge">
              <span className="status-indicator status-active"></span>
              <span>Active Online</span>
            </span>
          </div>
        </div>

        {/* Bio Edit Section */}
        <div className="profile-bio-section" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>NEIGHBOR BIO</label>
            {!isEditingBio ? (
              <button 
                onClick={() => setIsEditingBio(true)} 
                className="btn-icon-label" 
                style={{ padding: '4px 8px', fontSize: '0.7rem' }}
              >
                <Edit2 size={10} /> Edit Bio
              </button>
            ) : (
              <button 
                onClick={handleBioSave} 
                className="btn btn-accent" 
                style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#fff', display: 'flex', gap: '4px' }}
              >
                <Save size={10} /> Save
              </button>
            )}
          </div>

          {!isEditingBio ? (
            <p className="profile-bio-text">{stats?.bio || "No biography added yet. Click 'Edit Bio' to tell neighbors about yourself!"}</p>
          ) : (
            <textarea
              className="form-textarea"
              style={{ width: '100%', minHeight: '60px', padding: '8px', fontSize: '0.8rem' }}
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              placeholder="Tell neighbors what topics or volunteer assistance you support..."
              maxLength={200}
            />
          )}
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="dashboard-stats-grid">
        {/* Problems Card */}
        <div className="card-glass stat-card">
          <div className="stat-icon-wrapper emergency">
            <AlertCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Problems Shared</span>
            <span className="stat-value">{stats?.problemsShared || 0}</span>
          </div>
        </div>

        {/* Solutions Card */}
        <div className="card-glass stat-card">
          <div className="stat-icon-wrapper solutions">
            <MessageSquare size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Advice Offered</span>
            <span className="stat-value">{stats?.solutionsProvided || 0}</span>
          </div>
        </div>

        {/* Rating/Upvotes Card */}
        <div className="card-glass stat-card">
          <div className="stat-icon-wrapper rating">
            <Award size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Upvotes Earned</span>
            <span className="stat-value">{stats?.upvotesReceived || 0}</span>
          </div>
        </div>
      </div>

      {/* 3. Activity Highlights (Interactive mockup calendar-grid/graph) */}
      <div className="card-glass activity-highlights">
        <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '12px' }}>
          <Activity size={16} style={{ color: 'var(--primary)' }} />
          Community Activity Heatmap
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Your daily contributions and coordination presence logs.
        </p>
        
        {/* Render simulated contribution calendar dots */}
        <div className="contribution-grid">
          {Array.from({ length: 48 }).map((_, index) => {
            // Random opacity levels to look like a git map
            const levels = ['none', 'low', 'medium', 'high'];
            let level = 'none';
            if (stats?.problemsShared || stats?.solutionsProvided) {
              if (index % 7 === 0 || index % 5 === 0) {
                level = levels[Math.floor(Math.random() * 3) + 1];
              }
            } else if (index % 12 === 0) {
              level = 'low';
            }
            return (
              <span 
                key={index} 
                className={`heatmap-dot heatmap-dot-${level}`}
                title={`Activity index ${index}`}
              />
            );
          })}
        </div>
      </div>

      {/* 4. My Problems list */}
      <div className="my-problems-feed">
        <h3 className="card-title" style={{ fontSize: '1.05rem', margin: '8px 0 16px 0' }}>
          My Broadcasted Reports ({stats?.problemsList?.length || 0})
        </h3>

        {stats?.problemsList?.length === 0 ? (
          <div className="card-glass empty-feed-card" style={{ padding: '30px' }}>
            <MapPin size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>You haven't broadcasted any community needs yet.</p>
          </div>
        ) : (
          stats?.problemsList?.map((prob) => (
            <div key={prob._id || prob.id} className="card-glass problem-card animate-fade-in" style={{ padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${getCategoryBadgeClass(prob.category)}`}>
                  {prob.category}
                </span>
                
                <span className={`badge badge-status ${prob.status === 'Resolved' ? 'badge-status-resolved' : 'badge-status-active'}`}>
                  {prob.status}
                </span>
              </div>

              <h4 style={{ margin: '8px 0 4px 0', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{prob.title}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{prob.description}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={10} />
                  {new Date(prob.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </small>

                {prob.status !== 'Resolved' && (
                  <button 
                    onClick={() => handleResolve(prob._id || prob.id)}
                    className="btn btn-accent" 
                    style={{ padding: '4px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <CheckCircle2 size={12} /> Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
