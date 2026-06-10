import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Bot, Send, X, ShieldAlert } from 'lucide-react';

const ChatModal = ({ isOpen, onClose, selectedProblem, isOffline }) => {
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' or 'peer'
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState({
    ai: [
      {
        id: 'ai-init',
        text: "Hi! I am your Helpingo AI Coordinator. Select any problem card in the feed to ask for recommendations, or ask me general safety and volunteer coordination questions!",
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ],
    peer: [
      {
        id: 'peer-init',
        text: "Peer Help Channel: You are connected to verified community volunteers. Send a message to coordinate coordinates and volunteer times.",
        sender: 'system',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  });

  const messageEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, activeTab]);

  // Handle selected problem changes - trigger auto AI analysis
  useEffect(() => {
    if (selectedProblem && isOpen) {
      // Add a greeting/analysis from AI when problem is clicked
      const introMessage = {
        id: `ai-intro-${Date.now()}`,
        text: `I noticed you selected: "${selectedProblem.title}". Let me compile some recommendations. What aspects of this problem would you like to address?`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => ({
        ...prev,
        ai: [...prev.ai, introMessage]
      }));

      // Set up peer chat initial message for this specific problem
      const peerIntro = {
        id: `peer-intro-${Date.now()}`,
        text: `Broadcasting: Coordination session started for "${selectedProblem.title}". Nearby volunteers are viewing this channel.`,
        sender: 'system',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => ({
        ...prev,
        peer: [...prev.peer, peerIntro]
      }));
    }
  }, [selectedProblem, isOpen]);

  if (!isOpen) return null;

  const clientNLPAgent = (query, problem) => {
    const lowerQuery = query.toLowerCase();
    
    if (!problem) {
      if (lowerQuery.includes("hello") || lowerQuery.includes("hi") || lowerQuery.includes("hey")) {
        return "Hello! I am your **Helpingo AI Assistant**. I can help you coordinate volunteer efforts, view safety guidelines, or analyze community issues. Click on any problem card in the feed to ask about a specific problem!";
      }
      if (lowerQuery.includes("map") || lowerQuery.includes("nearby") || lowerQuery.includes("location")) {
        return "You can view our **Interactive Map** in the dashboard to see pins of all reported issues. Toggle 'Nearby Only' in the header to view tasks within 15 km of your location.";
      }
      if (lowerQuery.includes("volunteer") || lowerQuery.includes("help")) {
        return "To volunteer, look at the **Community Needs Feed**, pick an active issue that interests you, and click **Peer Chat** to coordinate with other neighbors, or write a tip in the **Solutions & Comments** section!";
      }
      return "I'm here to help! Select any reported issue from the feed, or ask me general questions about neighborhood coordination, the radar map, or volunteering.";
    }

    const { title, description, category, author, status, location, solutions } = problem;
    const solutionsCount = solutions ? solutions.length : 0;
    
    if (lowerQuery.includes("where") || lowerQuery.includes("location") || lowerQuery.includes("coordinates") || lowerQuery.includes("gps") || lowerQuery.includes("lat") || lowerQuery.includes("lng")) {
      if (location && location.lat) {
        return `📍 **Location Details** for *"${title}"*:\n\n* **Coordinates:** Latitude \`${location.lat.toFixed(4)}\`, Longitude \`${location.lng.toFixed(4)}\`.\n* **Proximity status:** Click the map pin to highlight this location on the Interactive Radar.`;
      }
      return `📍 Location details for *"${title}"* were not provided with exact coordinates. Please check the description for landmarks.`;
    }

    if (lowerQuery.includes("who") || lowerQuery.includes("author") || lowerQuery.includes("reporter") || lowerQuery.includes("reported") || lowerQuery.includes("owner")) {
      return `👤 **Reporter Info**:\n\n* This issue was reported by **${author || "Anonymous"}**.\n* Status: The reporter is currently marked as **Active** in the community. You can coordinate directly with them using the **Peer Chat Room** tab in this drawer.`;
    }

    if (lowerQuery.includes("status") || lowerQuery.includes("resolved") || lowerQuery.includes("active") || lowerQuery.includes("solved")) {
      if (status === 'Resolved') {
        return `✅ **Status:** This issue has been marked as **Resolved**. Thank you to the community members and coordinators who helped address it!`;
      }
      return `⚠️ **Status:** This issue is currently **Active** and needs assistance. If you are on-site or have updates, please post a solution/comment or coordinate in the Peer Chat Room.`;
    }

    if (lowerQuery.includes("solution") || lowerQuery.includes("comment") || lowerQuery.includes("proposed") || lowerQuery.includes("advice") || lowerQuery.includes("suggest") || lowerQuery.includes("do so far") || lowerQuery.includes("replies")) {
      if (solutionsCount === 0) {
        return `💬 **Solutions & Comments**:\n\nThere are currently **no solutions or comments** posted for *"${title}"* yet.\n\nBe the first to help! If you have any helpful tips or coordinates, type them in the input field under **Solutions & Comments** on the problem card.`;
      }
      
      let solText = `💬 **Proposed Solutions (${solutionsCount})** for *"${title}"*:\n\n`;
      solutions.forEach((sol, idx) => {
        const authorType = sol.isAI ? "🤖 Helpingo AI" : `👤 ${sol.author}`;
        solText += `${idx + 1}. **${authorType}** (${sol.upvotes || 0} upvotes):\n   *"${sol.text}"*\n\n`;
      });
      return solText;
    }

    if (lowerQuery.includes("volunteer") || lowerQuery.includes("help") || lowerQuery.includes("what can i do") || lowerQuery.includes("how to solve") || lowerQuery.includes("action")) {
      let actionSteps = "";
      if (category === 'Emergency') {
        actionSteps = "1. **Check safety:** Ensure you do not enter a hazardous zone.\n2. **Contact Authorities:** Dial 112/100 if there is immediate danger.\n3. **Map Warning:** Alert nearby residents to avoid this coordinate.";
      } else if (category === 'NGO Assistance') {
        actionSteps = "1. **Sign Up:** Coordinate with the NGO organizer in the Peer Chat Room.\n2. **Share resources:** Share this link with friends who might have the required skills/tools.\n3. **Post updates:** Log your volunteer schedule here so others can join.";
      } else if (category === 'Student Support') {
        actionSteps = "1. **Check spare books/resources:** See if you have the requested textbooks or notes.\n2. **Offer study support:** Coordinate study sessions or tutoring times.\n3. **Library desk:** Suggest local library services.";
      } else {
        actionSteps = "1. **Coordinate assembly:** Ask the reporter where to meet in the Peer Chat.\n2. **Bring gear:** Pack basic tools depending on the problem description.\n3. **Mark resolved:** Let the community know when the task is complete.";
      }
      
      return `🤝 **Action Plan** for *"${title}"*:\n\n**Category:** ${category}\n\n**Suggested Steps:**\n${actionSteps}`;
    }

    let response = `💡 **Helpingo Coordinator Agent**:\n\nRegarding *"${title}"* (${category}):\n\n`;
    response += `* **Description:** ${description}\n`;
    response += `* **Status:** ${status}\n`;
    response += `* **Reporter:** ${author}\n`;
    response += `* **Community Solutions:** ${solutionsCount} comments received.\n\n`;
    
    if (category === 'Emergency') {
      response += `⚠️ **Emergency Notice:** Keep clear of physical danger and alert verified authorities. Use the **Peer Chat** tab to coordinate with other neighbors on-site safety.`;
    } else {
      response += `How would you like to assist? You can ask me details about the **location**, **who reported it**, **solutions proposed**, or ask for an **action plan**!`;
    }
    return response;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      text: inputText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Append user message
    setMessages(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], userMsg]
    }));
    const textToSend = inputText;
    setInputText('');
    setIsTyping(true);

    if (activeTab === 'ai') {
      // Query the Express Server AI endpoint
      if (!isOffline) {
        try {
          const response = await fetch('http://localhost:5000/api/chat/ai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: textToSend,
              problem: selectedProblem ? {
                title: selectedProblem.title,
                description: selectedProblem.description,
                category: selectedProblem.category,
                author: selectedProblem.author,
                status: selectedProblem.status,
                location: selectedProblem.location,
                solutions: selectedProblem.solutions
              } : null
            })
          });

          if (response.ok) {
            const data = await response.json();
            const aiMsg = {
              id: `msg-ai-${Date.now()}`,
              text: data.reply,
              sender: 'ai',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => ({
              ...prev,
              ai: [...prev.ai, aiMsg]
            }));
            setIsTyping(false);
            return;
          }
        } catch (error) {
          console.error("AI service fetch error, running local client NLP fallback:", error);
        }
      }

      // Offline/Error AI fallback simulation with smart local NLP agent
      setTimeout(() => {
        const replyText = clientNLPAgent(textToSend, selectedProblem);
        const aiMsg = {
          id: `msg-ai-${Date.now()}`,
          text: replyText,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => ({
          ...prev,
          ai: [...prev.ai, aiMsg]
        }));
        setIsTyping(false);
      }, 800);

    } else {
      // Peer Chat Simulation: Realistic volunteer feedback response
      setTimeout(() => {
        let peerReply = "Got it! I am just 10 mins away from that location. I can bring some basic gear/tools. Where should we assemble?";
        if (selectedProblem?.category === 'NGO Assistance') {
          peerReply = "Hi, I represent the local volunteer group. We can allocate 3 members for coordination. Drop us the timing detail!";
        } else if (selectedProblem?.category === 'Student Support') {
          peerReply = "Checking this academic request. I think we have an active study circle in block B. Let me tag them in this thread.";
        }

        const helperMsg = {
          id: `msg-peer-${Date.now()}`,
          text: peerReply,
          sender: 'helper',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => ({
          ...prev,
          peer: [...prev.peer, helperMsg]
        }));
        setIsTyping(false);
      }, 1500);
    }
  };

  return (
    <div className="chat-drawer">
      {/* Header */}
      <div className="chat-drawer-header">
        <div className="chat-header-info">
          {activeTab === 'ai' ? (
            <Bot size={20} className="chat-header-icon" />
          ) : (
            <MessageSquare size={20} className="chat-header-icon" style={{ color: 'var(--primary)' }} />
          )}
          <div>
            <div className="chat-drawer-title">
              {activeTab === 'ai' ? 'Helpingo AI Agent' : 'Peer Helper Channel'}
            </div>
            <div className="chat-drawer-subtitle">
              {selectedProblem ? `Context: ${selectedProblem.title}` : 'General Coordinator'}
            </div>
          </div>
        </div>
        <button className="chat-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="chat-tabs">
        <button 
          className={`chat-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Bot size={14} /> AI Agent Assistant
          </span>
        </button>
        <button 
          className={`chat-tab-btn ${activeTab === 'peer' ? 'active' : ''}`}
          onClick={() => setActiveTab('peer')}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <MessageSquare size={14} /> Peer Chat Room
          </span>
        </button>
      </div>

      {/* Message List */}
      <div className="chat-message-list">
        {messages[activeTab].map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div 
                key={msg.id} 
                style={{ 
                  textAlign: 'center', 
                  fontSize: '0.7rem', 
                  color: 'var(--text-muted)', 
                  margin: '8px 0',
                  padding: '6px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '6px',
                  border: '1px solid var(--border)'
                }}
              >
                <ShieldAlert size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                {msg.text}
              </div>
            );
          }
          return (
            <div 
              key={msg.id} 
              className={`chat-bubble ${
                msg.sender === 'user' 
                  ? 'chat-bubble-sent' 
                  : msg.sender === 'ai' 
                    ? 'chat-bubble-received chat-bubble-ai' 
                    : 'chat-bubble-received'
              }`}
            >
              <div style={{ fontSize: '0.65rem', fontWeight: 700, marginBottom: '2px', opacity: 0.8 }}>
                {msg.sender === 'user' ? 'You' : msg.sender === 'ai' ? '🤖 Helpingo AI' : '👤 Verified Helper'}
              </div>
              <div>{msg.text}</div>
              <div style={{ fontSize: '0.6rem', textAlign: 'right', marginTop: '4px', opacity: 0.7 }}>
                {msg.timestamp}
              </div>
            </div>
          );
        })}

        {/* Loading Spinner / Flashing Dots */}
        {isTyping && (
          <div className="chat-loading-bubble">
            <span>{activeTab === 'ai' ? 'AI is thinking' : 'Volunteer is typing'}</span>
            <span className="dot-flashing"></span>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Footer input */}
      <div className="chat-drawer-footer">
        <form onSubmit={handleSendMessage} className="chat-input-wrapper">
          <input 
            type="text" 
            placeholder={activeTab === 'ai' ? 'Ask AI for advice/solution...' : 'Type a chat message to volunteers...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="chat-input-box"
          />
          <button type="submit" className="chat-send-btn">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
