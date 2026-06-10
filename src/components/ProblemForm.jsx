import React, { useState, useEffect } from 'react';
import { Send, MapPin, AlertCircle, HelpCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';


export const ProblemForm = ({ onPost, problems = [], isOffline, currentUser, onOpenAuth }) => {
  const [formData, setFormData] = useState({ title: '', description: '', category: 'General' });
  const [locating, setLocating] = useState(false);
  const [similarProblems, setSimilarProblems] = useState([]);

  // Check for similar problems as the user types
  useEffect(() => {
    const checkSimilar = async () => {
      const titleQuery = formData.title.trim();
      if (titleQuery.length < 4) {
        setSimilarProblems([]);
        return;
      }

      if (!isOffline) {
        // Query the live server
        try {
          const response = await fetch(`${API_BASE_URL}/problems/similar?title=${encodeURIComponent(titleQuery)}`);
          if (response.ok) {
            const data = await response.json();
            setSimilarProblems(data);
            return;
          }
        } catch (error) {
          console.error("Error checking similar problems:", error);
        }
      }

      // Offline fallback: search local problems array passed via props
      const queryWords = titleQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      if (queryWords.length === 0) {
        setSimilarProblems([]);
        return;
      }

      const matches = problems
        .map(prob => {
          let score = 0;
          const probTitleLower = prob.title.toLowerCase();
          queryWords.forEach(word => {
            if (probTitleLower.includes(word)) score += 1;
          });
          return { prob, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.prob)
        .slice(0, 3);

      setSimilarProblems(matches);
    };

    const debounceTimer = setTimeout(checkSimilar, 300);
    return () => clearTimeout(debounceTimer);
  }, [formData.title, problems, isOffline]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setLocating(true);

    // Default coordinates (Delhi) if location is denied or times out
    const defaultLocation = { lat: 28.6139 + (Math.random() - 0.5) * 0.05, lng: 77.2090 + (Math.random() - 0.5) * 0.05 };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const problemData = {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            author: currentUser.username,
            location: { 
              lat: position.coords.latitude, 
              lng: position.coords.longitude 
            }
          };

          onPost(problemData);
          setFormData({ title: '', description: '', category: 'General' });
          setLocating(false);
        },
        (error) => {
          console.warn("Location services unavailable, using simulated nearby coordinates:", error.message);
          // Fail gracefully: post using simulated location nearby so the user has zero errors!
          const problemData = {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            author: currentUser.username,
            location: defaultLocation
          };
          onPost(problemData);
          setFormData({ title: '', description: '', category: 'General' });
          setLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      // Fallback if browser doesn't support geolocation
      const problemData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        author: currentUser.username,
        location: defaultLocation
      };
      onPost(problemData);
      setFormData({ title: '', description: '', category: 'General' });
      setLocating(false);
    }
  };

  return (
    <div className="card-glass">
      <h3 className="card-title">
        <Send size={18} style={{ color: 'var(--primary)' }} />
        Report an Issue
      </h3>

      <form className="problem-form" onSubmit={handleSubmit}>
        
        {/* Category Field */}
        <div className="form-group">
          <label>ISSUE CATEGORY</label>
          <select 
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="form-select"
          >
            <option value="General">General Help</option>
            <option value="Emergency">Emergency Alert</option>
            <option value="Student Support">Student Support</option>
            <option value="NGO Assistance">NGO / Volunteer Assistance</option>
          </select>
        </div>

        {/* Title Field */}
        <div className="form-group">
          <label>SUMMARY TITLE</label>
          <input 
            type="text" 
            placeholder="e.g. Water logging at Gate 3, math textbooks request"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required 
            maxLength={100}
            className="form-input"
          />
        </div>

        {/* Similar Suggestions Panel */}
        {similarProblems.length > 0 && (
          <div className="similar-suggestions-container animate-fade-in">
            <div className="similar-suggestions-title">
              <AlertCircle size={12} />
              Existing matching reports found:
            </div>
            {similarProblems.map((prob) => (
              <div 
                key={prob._id || prob.id} 
                className="similar-item"
                title="Click to view details in the feed"
                onClick={() => {
                  const el = document.getElementById(`prob-${prob._id || prob.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                <strong>{prob.category}</strong>: {prob.title} ({prob.status})
              </div>
            ))}
          </div>
        )}

        {/* Description Field */}
        <div className="form-group">
          <label>DETAILED DESCRIPTION</label>
          <textarea 
            placeholder="Describe the issue, coordinates, and resources required so others or the AI Agent can assist..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required 
            rows={4}
            className="form-textarea"
          />
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn-primary" disabled={locating} style={{ width: '100%' }}>
          {locating ? (
            <>
              <MapPin size={16} className="animate-pulse" />
              <span>Detecting Location...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>Broadcast Problem</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ProblemForm;