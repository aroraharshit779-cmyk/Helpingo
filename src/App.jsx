import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InteractiveMap from './components/InteractiveMap';
import ProblemForm from './components/ProblemForm';
import ProblemFeed from './components/ProblemFeed';
import ChatModal from './components/ChatModal';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import { Bot, MessageSquare } from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

// Distance calculation utility (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Fallback seed problems to load into localStorage if absolutely no data exists
const OFFLINE_SEED_DATA = [
  {
    id: "offline-1",
    _id: "offline-1",
    title: "Overturned garbage truck leaking oil in road intersection",
    description: "A waste containment truck tipped over. Oil is leaking on the asphalt, making the turn extremely slippery and dangerous. Needs sweep/sand trucks.",
    category: "Emergency",
    location: { lat: 28.6189, lng: 77.2040 },
    status: "Active",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    upvotes: 4,
    solutions: [
      {
        id: "sol-off-1",
        author: "Dev Rawat",
        text: "I called the highway maintenance. They said cleanup crews are dispatching.",
        timestamp: new Date(Date.now() - 900000).toISOString(),
        upvotes: 2
      }
    ]
  },
  {
    id: "offline-2",
    _id: "offline-2",
    title: "Looking for volunteer translators to coordinate medical camp reports",
    description: "We are translating patient logs and summaries from our rural medical camp. Need volunteers who understand local language translation.",
    category: "NGO Assistance",
    location: { lat: 28.6050, lng: 77.2400 },
    status: "Active",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    upvotes: 7,
    solutions: []
  }
];

function App() {
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isNearbyOnly, setIsNearbyOnly] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedProblemForChat, setSelectedProblemForChat] = useState(null);
  
  // Ref to track if we have already queued sync items
  const [syncQueue, setSyncQueue] = useState([]);

  // --- User Session & Presence Status State ---
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('helpingo-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeView, setActiveView] = useState('feed'); // 'feed' | 'dashboard'
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState('online'); // 'online' | 'away' | 'offline'
  const [onlineCount, setOnlineCount] = useState(3);

  // --- Online Presence Count Lifecycles ---
  const fetchOnlineCount = async () => {
    if (isOffline) return;
    try {
      const response = await fetch(`${API_BASE_URL}/users/online`);
      if (response.ok) {
        const data = await response.json();
        setOnlineCount(data.count);
      }
    } catch (err) {
      console.warn("Could not fetch online members count:", err);
    }
  };

  useEffect(() => {
    fetchOnlineCount();
    const interval = setInterval(fetchOnlineCount, 15000);
    return () => clearInterval(interval);
  }, [isOffline]);

  const handleChangeStatus = async (newStatus) => {
    setOnlineStatus(newStatus);
    if (newStatus === 'offline') {
      // Manually force offline mode to test resiliency!
      setIsOffline(true);
      return;
    }

    // If switching back to online or away, try hitting the server and updating presence
    if (currentUser) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.username}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
          setIsOffline(false);
          loadData(); // Reload live data now that we are online
        }
      } catch (err) {
        console.warn("Failed to update status on server. Operating in offline fallback.");
        setIsOffline(true);
      }
    } else {
      setIsOffline(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('helpingo-user', JSON.stringify(userData));
    setOnlineStatus('online');
    setIsOffline(false);
    loadData();
    fetchOnlineCount();
  };

  const handleLogout = async () => {
    if (currentUser && !isOffline) {
      try {
        await fetch(`${API_BASE_URL}/users/${currentUser.username}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'offline' })
        });
      } catch (err) {
        console.warn("Logout status update failed on server.");
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('helpingo-user');
    setActiveView('feed');
    loadData();
  };

  // --- Theme Mode Lifecycle ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('helpingo-theme');
    if (savedTheme === 'light') {
      setIsLightTheme(true);
      document.body.classList.add('light-theme');
    } else {
      setIsLightTheme(false);
      document.body.classList.remove('light-theme');
    }
  }, []);

  const toggleTheme = () => {
    setIsLightTheme((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add('light-theme');
        localStorage.setItem('helpingo-theme', 'light');
      } else {
        document.body.classList.remove('light-theme');
        localStorage.setItem('helpingo-theme', 'dark');
      }
      return next;
    });
  };

  // --- Geolocation Lifecycle ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Geolocation access denied. Centering map to Delhi coordinates.", error);
          setUserLocation({ lat: 28.6139, lng: 77.2090 });
        },
        { timeout: 8000 }
      );
    } else {
      setUserLocation({ lat: 28.6139, lng: 77.2090 });
    }
  }, []);

  // --- Data Loading & Syncing Lifecycle ---
  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/problems`, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const data = await response.json();
        setProblems(data);
        localStorage.setItem('helpingo-problems', JSON.stringify(data));
        setIsOffline(false);
        setIsLoading(false);

        // If we have queue items that were created offline, try syncing them!
        if (syncQueue.length > 0) {
          syncOfflineChanges();
        }
        return;
      }
    } catch (err) {
      console.warn("Could not reach backend server. Loading resilient localStorage fallback.", err);
    }

    // Offline fallback loading
    setIsOffline(true);
    const localData = localStorage.getItem('helpingo-problems');
    if (localData) {
      setProblems(JSON.parse(localData));
    } else {
      // Load offline seed data if localStorage is completely blank
      setProblems(OFFLINE_SEED_DATA);
      localStorage.setItem('helpingo-problems', JSON.stringify(OFFLINE_SEED_DATA));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    // Setup periodic polling to check for network recovery
    const pollInterval = setInterval(() => {
      checkNetworkStatus();
    }, 12000);

    return () => clearInterval(pollInterval);
  }, []);

  // Trigger sync queue when network is back online
  useEffect(() => {
    if (!isOffline && syncQueue.length > 0) {
      syncOfflineChanges();
    }
  }, [isOffline, syncQueue]);

  const checkNetworkStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/problems`, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
      if (res.ok && isOffline) {
        setIsOffline(false);
      }
    } catch {
      if (!isOffline) setIsOffline(true);
    }
  };

  // Sync queued local additions/resolutions to backend once online
  const syncOfflineChanges = async () => {
    console.log("Synching offline modifications queue with live database...");
    const currentQueue = [...syncQueue];
    setSyncQueue([]); // clear queue

    for (const item of currentQueue) {
      try {
        if (item.type === 'CREATE_PROBLEM') {
          await fetch(`${API_BASE_URL}/problems`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload)
          });
        } else if (item.type === 'RESOLVE_PROBLEM') {
          await fetch(`${API_BASE_URL}/problems/${item.payload.id}/resolve`, { method: 'PATCH' });
        } else if (item.type === 'ADD_SOLUTION') {
          await fetch(`${API_BASE_URL}/problems/${item.payload.problemId}/solutions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload.solution)
          });
        }
      } catch (err) {
        console.error("Failed to sync queue item, re-queuing:", item, err);
        setSyncQueue(prev => [...prev, item]); // push back to retry later
      }
    }
    // reload fresh server data after sync
    loadData();
  };

  // --- Main Filters Logic ---
  useEffect(() => {
    let result = [...problems];

    // 1. Search Query Keyword matching
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // 2. Category badge filtering
    if (activeCategory !== 'All') {
      result = result.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());
    }

    // 3. Proximity Location filtering (Radius <= 15 km)
    if (isNearbyOnly && userLocation) {
      result = result.filter((p) => {
        if (!p.location) return false;
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          p.location.lat,
          p.location.lng
        );
        return distance <= 15; // 15 km radius
      });
    }

    setFilteredProblems(result);
  }, [problems, searchQuery, activeCategory, isNearbyOnly, userLocation]);

  // --- CRUD Callback Operations ---

  // Post a new problem
  const handlePostProblem = async (newProblemData) => {
    const localId = 'local-' + Date.now();
    const fallbackProblem = {
      _id: localId,
      id: localId,
      ...newProblemData,
      author: currentUser ? currentUser.username : 'Anonymous Helper',
      status: 'Active',
      timestamp: new Date().toISOString(),
      upvotes: 0,
      solutions: []
    };

    // Optimistically add to local state
    setProblems((prev) => [fallbackProblem, ...prev]);

    // Save to local storage right away to avoid loss
    const updatedProblems = [fallbackProblem, ...problems];
    localStorage.setItem('helpingo-problems', JSON.stringify(updatedProblems));

    if (!isOffline) {
      try {
        const response = await fetch(`${API_BASE_URL}/problems`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProblemData)
        });

        if (response.ok) {
          const savedData = await response.json();
          // Replace optimistic local problem with server saved data
          setProblems((current) =>
            current.map((p) => (p._id === localId ? savedData : p))
          );
          return;
        }
      } catch (err) {
        console.warn("Posting to server failed. Queued for offline sync.");
      }
    }

    // If server fails or offline, queue for syncing later
    setSyncQueue(prev => [...prev, { type: 'CREATE_PROBLEM', payload: newProblemData }]);
    setIsOffline(true);
  };

  // Resolve an issue
  const handleResolveProblem = async (id) => {
    // Optimistic Update
    setProblems((current) =>
      current.map((p) => ((p._id === id || p.id === id) ? { ...p, status: 'Resolved' } : p))
    );

    const updated = problems.map((p) => ((p._id === id || p.id === id) ? { ...p, status: 'Resolved' } : p));
    localStorage.setItem('helpingo-problems', JSON.stringify(updated));

    if (!isOffline) {
      try {
        const res = await fetch(`${API_BASE_URL}/problems/${id}/resolve`, { method: 'PATCH' });
        if (res.ok) return;
      } catch (err) {
        console.warn("Resolving on server failed. Queued for offline sync.");
      }
    }

    // Queue for sync
    setSyncQueue(prev => [...prev, { type: 'RESOLVE_PROBLEM', payload: { id } }]);
    setIsOffline(true);
  };

  // Add solution/help advice
  const handleAddSolution = async (problemId, solutionText) => {
    const solId = 'sol-local-' + Date.now();
    const newSolution = {
      id: solId,
      author: currentUser ? currentUser.username : 'Anonymous Helper',
      text: solutionText,
      timestamp: new Date().toISOString(),
      upvotes: 0
    };

    // Optimistic update of local state
    setProblems((current) =>
      current.map((p) => {
        if (p._id === problemId || p.id === problemId) {
          return {
            ...p,
            solutions: [...(p.solutions || []), newSolution]
          };
        }
        return p;
      })
    );

    // Save to local storage
    const updated = problems.map((p) => {
      if (p._id === problemId || p.id === problemId) {
        return { ...p, solutions: [...(p.solutions || []), newSolution] };
      }
      return p;
    });
    localStorage.setItem('helpingo-problems', JSON.stringify(updated));

    if (!isOffline) {
      try {
        const response = await fetch(`${API_BASE_URL}/problems/${problemId}/solutions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSolution)
        });

        if (response.ok) {
          const freshProblemData = await response.json();
          setProblems((current) =>
            current.map((p) => ((p._id === problemId || p.id === problemId) ? freshProblemData : p))
          );
          return;
        }
      } catch (err) {
        console.warn("Adding solution to server failed. Queued for offline sync.");
      }
    }

    // Queue for sync
    setSyncQueue(prev => [
      ...prev,
      { type: 'ADD_SOLUTION', payload: { problemId, solution: newSolution } }
    ]);
    setIsOffline(true);
  };

  // Upvote a solution
  const handleUpvoteSolution = async (problemId, solutionId) => {
    // Optimistic update
    setProblems((current) =>
      current.map((p) => {
        if (p._id === problemId || p.id === problemId) {
          return {
            ...p,
            solutions: p.solutions.map((s) =>
              s.id === solutionId ? { ...s, upvotes: (s.upvotes || 0) + 1 } : s
            )
          };
        }
        return p;
      })
    );

    if (!isOffline) {
      try {
        const res = await fetch(`${API_BASE_URL}/problems/${problemId}/solutions/${solutionId}/upvote`, {
          method: 'POST'
        });
        if (res.ok) {
          const freshProblemData = await res.json();
          setProblems((current) =>
            current.map((p) => ((p._id === problemId || p.id === problemId) ? freshProblemData : p))
          );
        }
      } catch (err) {
        console.warn("Upvoting on server failed.");
      }
    }
  };

  // Map pin click scrolls the corresponding card into view and flashes its border
  const handlePinClick = (id) => {
    const cardElement = document.getElementById(`prob-${id}`);
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cardElement.style.borderColor = 'var(--secondary)';
      setTimeout(() => {
        cardElement.style.borderColor = 'var(--glass-border)';
      }, 2000);
    }
  };

  // Open Chat Trigger
  const handleOpenChat = (problem, tab) => {
    setSelectedProblemForChat(problem);
    setIsChatOpen(true);
    // Timeout gives the DOM a frame to load the drawer, scroll element is handled in ChatModal
  };

  return (
    <div className="app-container">
      {/* Offline Connection Info Banner */}
      {isOffline && (
        <div className="offline-sync-banner">
          <span>⚠️ Network Offline: Running in local fallback sync mode. Changes will auto-save to database when online.</span>
        </div>
      )}

      {/* Main Brand & Search Navigation */}
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isNearbyOnly={isNearbyOnly}
        setIsNearbyOnly={setIsNearbyOnly}
        isOffline={isOffline}
        isLightTheme={isLightTheme}
        toggleTheme={toggleTheme}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={setActiveView}
        onlineCount={onlineCount}
        onlineStatus={onlineStatus}
        onChangeStatus={handleChangeStatus}
      />

      <main className="main-dashboard">
        
        {/* Left Side: Creation Form & Quick AI Trigger Card */}
        <section className="dashboard-sidebar">
          
          <ProblemForm 
            onPost={handlePostProblem} 
            problems={problems}
            isOffline={isOffline}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
          />

          {/* Quick AI Advisor Launchpad Card */}
          <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: 0 }}>
              <Bot size={18} style={{ color: 'var(--secondary)' }} />
              Helpingo Assistant
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Get instant suggestions on handling safety steps or volunteer coordination for local complaints.
            </p>
            <button 
              className="btn-primary" 
              onClick={() => handleOpenChat(null, 'ai')}
              style={{ justifyContent: 'center' }}
            >
              <Bot size={16} /> Let's Consult AI
            </button>
          </div>

        </section>

        {/* Right Side: Switchable between Community Feed and Personal Dashboard */}
        {activeView === 'feed' ? (
          <section className="dashboard-content">
            
            <InteractiveMap 
              problems={filteredProblems} 
              isNearbyOnly={isNearbyOnly}
              userLocation={userLocation}
              onPinClick={handlePinClick}
            />

            <div className="feed-header">
              <h3>Community Needs Feed ({filteredProblems.length})</h3>
            </div>

            <ProblemFeed 
              problems={filteredProblems}
              isLoading={isLoading}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              onResolve={handleResolveProblem}
              onAddSolution={handleAddSolution}
              onUpvoteSolution={handleUpvoteSolution}
              onOpenChat={handleOpenChat}
              currentUser={currentUser}
              onOpenAuth={() => setAuthModalOpen(true)}
            />

          </section>
        ) : (
          <section className="dashboard-content">
            <Dashboard 
              username={currentUser?.username}
              onResolveProblem={handleResolveProblem}
            />
          </section>
        )}
      </main>

      {/* Unified Chat Drawer Toggle Trigger */}
      {!isChatOpen && (
        <button 
          className="floating-chat-trigger animate-bounce" 
          onClick={() => handleOpenChat(null, 'ai')}
          title="Open Helpingo Chatbot"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Sliding Chat Drawer Component */}
      <ChatModal 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        selectedProblem={selectedProblemForChat}
        isOffline={isOffline}
      />

      {/* Auth Portal Modal Dialog */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;
