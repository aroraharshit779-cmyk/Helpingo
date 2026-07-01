import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ThumbsUp, 
  UserCheck, 
  Plus, 
  AlertTriangle 
} from 'lucide-react';

const ProblemFeed = ({ 
  problems = [], 
  isLoading = false,
  activeCategory,
  setActiveCategory,
  onResolve, 
  onAddSolution,
  onUpvoteSolution,
  currentUser,
  onOpenAuth
}) => {
  const [solutionInputs, setSolutionInputs] = useState({});

  const categories = ['All', 'Emergency', 'NGO Assistance', 'Student Support', 'General'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'away': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'Emergency': return 'badge-emergency';
      case 'NGO Assistance': return 'badge-ngo';
      case 'Student Support': return 'badge-student';
      default: return 'badge-general';
    }
  };

  const handleAddSolutionSubmit = (e, probId) => {
    e.preventDefault();
    const text = solutionInputs[probId]?.trim();
    if (!text) return;

    onAddSolution(probId, text);
    setSolutionInputs({
      ...solutionInputs,
      [probId]: ''
    });
  };

  // Render Skeleton Loader Screen to avoid layout shifts (flicker-free UI)
  if (isLoading) {
    return (
      <div className="feed-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="category-filter-list">
          {categories.map(c => (
            <div key={c} className="filter-badge" style={{ width: '80px', height: '28px', opacity: 0.5 }}></div>
          ))}
        </div>
        {[1, 2, 3].map((n) => (
          <div key={n} className="card-glass skeleton-shimmer" style={{ minHeight: '160px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div className="skeleton-text" style={{ width: '80px', height: '16px', background: 'rgba(255,255,255,0.05)' }}></div>
              <div className="skeleton-text" style={{ width: '60px', height: '16px', background: 'rgba(255,255,255,0.05)' }}></div>
            </div>
            <div className="skeleton-title" style={{ background: 'rgba(255,255,255,0.05)', height: '24px' }}></div>
            <div className="skeleton-text" style={{ background: 'rgba(255,255,255,0.05)', height: '14px' }}></div>
            <div className="skeleton-text" style={{ background: 'rgba(255,255,255,0.05)', height: '14px', width: '85%' }}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="feed-container">
      {/* Category Selection Filter Badges */}
      <div className="category-filter-list">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`filter-badge ${activeCategory === cat ? 'active' : ''}`}
          >
            {cat === 'All' ? '📌 View All' : cat}
          </button>
        ))}
      </div>

      {/* Problems Feed Cards */}
      {problems.length === 0 ? (
        <div className="card-glass empty-feed-card">
          <AlertTriangle size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3>No matching reports in this view</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Try selecting a different filter category or search keyword.
          </p>
        </div>
      ) : (
        problems.map((prob) => {
          const probId = prob._id || prob.id;
          return (
            <div key={probId} id={`prob-${probId}`} className="card-glass problem-card animate-fade-in">
              
              {/* Card Top Badging */}
              <div className="problem-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${getCategoryBadgeClass(prob.category)}`}>
                    {prob.category}
                  </span>
                  
                  {/* Reporter Info with Status Dot */}
                  <div className="problem-reporter-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="avatar-mini-circle">
                      {prob.author ? prob.author[0].toUpperCase() : 'A'}
                      <span 
                        className="avatar-status-dot mini" 
                        style={{ backgroundColor: getStatusColor(prob.authorStatus || 'online') }}
                      />
                    </div>
                    <span className="reporter-name">{prob.author || 'Anonymous'}</span>
                  </div>
                </div>
                
                <span className={`badge badge-status ${prob.status === 'Resolved' ? 'badge-status-resolved' : 'badge-status-active'}`}>
                  {prob.status === 'Resolved' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle2 size={12} /> Resolved
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span className="status-indicator status-active animate-pulse" style={{ margin: 0 }}></span> Active
                    </span>
                  )}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="problem-card-title">{prob.title}</h3>
              <p className="problem-card-description">{prob.description}</p>

              {/* Footer Row: Timestamp & Actions */}
              <div className="problem-card-actions">
                <small className="problem-card-time">
                  <Clock size={12} /> 
                  {prob.timestamp ? new Date(prob.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Just now'}
                </small>

                <div className="card-action-group">
                  {/* Resolution Button */}
                  {prob.status !== 'Resolved' && currentUser && (prob.author === currentUser.username || currentUser.username === 'Dev Rawat') && (
                    <button 
                      className="btn btn-accent" 
                      onClick={() => onResolve(probId)}
                      style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
                    >
                      <UserCheck size={14} />
                      <span>Resolve</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Solutions Panel */}
              <div className="solutions-panel">
                <div className="solutions-title">
                  <CheckCircle2 size={14} style={{ color: 'var(--accent-success)' }} />
                  <span>Solutions & Comments ({prob.solutions?.length || 0})</span>
                </div>

                {/* List Solutions */}
                <div className="solution-list">
                  {prob.solutions && prob.solutions.map((sol) => (
                    <div 
                      key={sol.id} 
                      className="solution-bubble"
                    >
                      <div className="solution-content">
                        <div className="solution-author">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div className="avatar-mini-circle solution">
                              {sol.author ? sol.author[0].toUpperCase() : 'U'}
                              <span 
                                className="avatar-status-dot micro" 
                                style={{ backgroundColor: getStatusColor(sol.authorStatus || 'online') }}
                              />
                            </div>
                            <span style={{ fontWeight: 700 }}>{sol.author}</span>
                          </div>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>
                            {sol.timestamp ? new Date(sol.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <div className="solution-text" style={{ paddingLeft: '22px' }}>{sol.text}</div>
                      </div>

                      {/* Solution Upvotes */}
                      <div 
                        className="solution-upvotes"
                        onClick={() => onUpvoteSolution(probId, sol.id)}
                        title="Upvote this solution/advice"
                      >
                        <ThumbsUp size={10} />
                        <span>{sol.upvotes || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Solution Form / Sign In Prompt */}
                {!currentUser ? (
                  <div className="comment-login-prompt">
                    <span>Want to offer tips or solutions? </span>
                    <button 
                      type="button" 
                      onClick={onOpenAuth}
                      className="text-link-btn"
                    >
                      Sign In to participate
                    </button>
                  </div>
                ) : (
                  <form 
                    className="add-solution-form" 
                    onSubmit={(e) => handleAddSolutionSubmit(e, probId)}
                  >
                    <input 
                      type="text" 
                      placeholder="Offer coordinate tips or a comment..."
                      value={solutionInputs[probId] || ''}
                      onChange={(e) => setSolutionInputs({
                        ...solutionInputs,
                        [probId]: e.target.value
                      })}
                      className="solution-input"
                      required
                    />
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ padding: '6px 10px', borderRadius: '8px' }}
                      title="Post solution/comment"
                    >
                      <Plus size={14} />
                    </button>
                  </form>
                )}
              </div>

            </div>
          );
        })
      )}
    </div>
  );
};

export default ProblemFeed;