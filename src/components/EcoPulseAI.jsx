import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Trash2, Info, HelpCircle, AlertCircle } from 'lucide-react';

const GEMINI_API_KEY = true; // Now handled securely by backend

export default function EcoPulseAI({ 
  id,
  inputs, 
  footprintBreakdown, 
  netFootprint, 
  xp, 
  completedHabits,
  addNotification,
  chatHistory,
  setChatHistory,
  token
}) {
  // Local state as fallback if parent didn't pass chatHistory/setChatHistory (e.g. in tests)
  const [localMessages, setLocalMessages] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_ai_messages');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load message history:", e);
    }
    return [];
  });

  const defaultGreeting = [
    {
      id: 'initial-greeting',
      sender: 'ai',
      text: `Hello! I am your EcoPulse AI Carbon Coach. I've analyzed your dashboard profile and see that your annual net footprint is currently **${(netFootprint || 0).toLocaleString()} kg CO₂e**. 

How can I help you today? You can ask me questions about your environmental footprint, request a tailored carbon reduction plan, or select one of the quick suggestions below!`,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }
  ];

  const isControlled = chatHistory !== undefined && setChatHistory !== undefined;
  
  const messages = isControlled
    ? (chatHistory && chatHistory.length > 0 ? chatHistory : defaultGreeting)
    : (localMessages.length > 0 ? localMessages : defaultGreeting);

  const setMessages = (update) => {
    if (isControlled) {
      if (typeof update === 'function') {
        setChatHistory(prev => {
          const current = prev.length > 0 ? prev : defaultGreeting;
          return update(current);
        });
      } else {
        setChatHistory(update);
      }
    } else {
      if (typeof update === 'function') {
        setLocalMessages(prev => {
          const current = prev.length > 0 ? prev : defaultGreeting;
          const next = update(current);
          try {
            localStorage.setItem('ecopulse_ai_messages', JSON.stringify(next));
          } catch (e) {
            console.error(e);
          }
          return next;
        });
      } else {
        setLocalMessages(update);
        try {
          localStorage.setItem('ecopulse_ai_messages', JSON.stringify(update));
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const prevMessagesLength = useRef(messages.length);
  const prevLoading = useRef(loading);

  // Auto-scroll to bottom of chat when messages update
  useEffect(() => {
    const messagesIncreased = messages.length > prevMessagesLength.current;
    const loadingStarted = loading && !prevLoading.current;

    if (messagesIncreased || loadingStarted) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevMessagesLength.current = messages.length;
    prevLoading.current = loading;
  }, [messages, loading]);

  // Handle clearing chat history
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your chat history with the Carbon Coach?")) {
      const defaultGreeting = [
        {
          id: 'initial-greeting',
          sender: 'ai',
          text: `Hello! I am your EcoPulse AI Carbon Coach. I've analyzed your dashboard profile and see that your annual net footprint is currently **${(netFootprint || 0).toLocaleString()} kg CO₂e**. 
  
How can I help you today? You can ask me questions about your environmental footprint, request a tailored carbon reduction plan, or select one of the quick suggestions below!`,
          timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(defaultGreeting);
      setError('');
    }
  };

  // Format and highlight text (e.g. bolding, bullet points, numbers like '250 kg CO2')
  const parseMarkdown = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const elements = [];
    let currentList = [];

    // Helper to highlight numbers (e.g. 250 kg CO2 or 1,200 kg CO2e)
    const highlightCo2Values = (str) => {
      const regex = /(\b\d[\d,]*\s*kg\s*CO₂[e\s]*(?:\/yr|annually|annum)?\b)/gi;
      const parts = str.split(regex);
      return parts.map((part, index) => {
        if (part.match(regex)) {
          return (
            <span 
              key={`co2-${index}`} 
              style={{ 
                color: 'var(--accent-green)', 
                fontWeight: '700', 
                background: 'rgba(16, 185, 129, 0.08)',
                padding: '1px 6px',
                borderRadius: '4px',
                display: 'inline'
              }}
            >
              {part}
            </span>
          );
        }
        return part;
      });
    };

    // Helper to parse bold markdown **bold text**
    const parseBoldAndValue = (str) => {
      if (typeof str !== 'string') return str;
      const regex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIndex) {
          parts.push(...highlightCo2Values(str.substring(lastIndex, match.index)));
        }
        parts.push(<strong key={`bold-${match.index}`} style={{ color: 'var(--text-primary)' }}>{match[1]}</strong>);
        lastIndex = regex.lastIndex;
      }
      
      if (lastIndex < str.length) {
        parts.push(...highlightCo2Values(str.substring(lastIndex)));
      }
      
      return parts.length > 0 ? parts : highlightCo2Values(str);
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // List Item
        currentList.push(<li key={`li-${index}`} style={{ marginBottom: '6px' }}>{parseBoldAndValue(trimmed.substring(2))}</li>);
      } else {
        // Flush previous list if any
        if (currentList.length > 0) {
          elements.push(
            <ul key={`ul-${index}`} style={{ paddingLeft: '20px', margin: '10px 0', listStyleType: 'disc' }}>
              {currentList}
            </ul>
          );
          currentList = [];
        }
        
        if (trimmed === '') {
          elements.push(<div key={`empty-${index}`} style={{ height: '10px' }} />);
        } else {
          // Regular Paragraph
          elements.push(<p key={`p-${index}`} style={{ margin: '8px 0', lineHeight: '1.6' }}>{parseBoldAndValue(trimmed)}</p>);
        }
      }
    });

    if (currentList.length > 0) {
      elements.push(
        <ul key="ul-final" style={{ paddingLeft: '20px', margin: '10px 0', listStyleType: 'disc' }}>
          {currentList}
        </ul>
      );
    }

    return elements;
  };

  // Trigger call to Gemini API
  const handleSendMessage = async (textToSend) => {
    const messageContent = (textToSend || inputMessage).trim();
    if (!messageContent) return;

    if (!GEMINI_API_KEY) {
      setError("Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.");
      return;
    }

    // Add user message to state
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageContent,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);
    setError('');

    // System instruction prompt injecting user's real context data
    const systemPrompt = `You are the EcoPulse AI Carbon Coach, a friendly, encouraging, and knowledgeable environmental sustainability expert.
Here is the user's current carbon footprint profile and activity data:
- Total Annual Carbon Footprint: ${footprintBreakdown?.total || 0} kg CO₂e/year
- Net Footprint (after offsets & habits): ${netFootprint || 0} kg CO₂e/year
- Category Breakdown:
  * Transport: ${footprintBreakdown?.transport || 0} kg CO₂e/year
  * Home Energy: ${footprintBreakdown?.energy || 0} kg CO₂e/year
  * Diet: ${footprintBreakdown?.diet || 0} kg CO₂e/year
  * Shopping & Waste: ${footprintBreakdown?.shopping || 0} kg CO₂e/year
- User Onboarding Inputs:
  * Weekly Commute Distance: ${inputs?.commuteDistance || 0} km
  * Transport Fuel/Vehicle Type: ${inputs?.transportType || 'none'}
  * Annual Flight Hours: ${inputs?.flightHours || 0} hours
  * Monthly Electricity Usage: ${inputs?.electricityKwh || 0} kWh
  * Green Electricity Share: ${inputs?.greenEnergyShare || 0}%
  * Home Heating Fuel Source: ${inputs?.heatingSource || 'none'}
  * Diet Type: ${inputs?.dietType || 'lowMeat'}
  * Shopping Habit Style: ${inputs?.shoppingHabit || 'average'}
  * Recycles consistently: ${inputs?.recycles ? 'Yes' : 'No'}
- Gamification Progress:
  * Current Level: ${Math.floor((xp || 0) / 100) + 1}
  * Experience Points: ${xp || 0} XP
  * Completed Habits session count: ${JSON.stringify(completedHabits || {})}

Instructions:
1. Answer the user's questions about carbon footprints, climate change, and sustainability.
2. Analyze their personal data listed above. Explain why their emissions are high in specific categories (e.g. if they drive a gasoline car, fly a lot, or eat heavy meat, point it out gently).
3. Suggest specific, actionable eco-habits or upgrades, and estimate the annual CO₂ savings in kg. Use realistic, quantifiable claims. (e.g. "Switching from gasoline car to public transit twice per week could reduce approximately 250 kg CO₂ annually.")
4. Match the tone of EcoPulse: professional, encouraging, optimistic, and data-driven.
5. Format your answers clearly using markdown (bullet points, bold text). Keep responses concise (under 250 words per message) so they fit nicely in the chat UI. Do not include verbose introductory text; get straight to the helpful answer.`;

    try {
      // Map existing messages to Gemini REST format, skipping initial greeting
      const contents = messages
        .filter(msg => msg.id !== 'initial-greeting')
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

      // Append latest user query
      contents.push({
        role: 'user',
        parts: [{ text: messageContent }]
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status} Error`);
      }

      const responseJson = await response.json();
      const aiResponseText = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiResponseText) {
        throw new Error("Received an empty response from the AI model.");
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      if (addNotification) {
        addNotification('AI Recommendations', 'AI Coach Recommendation', 'AI coach generated a new recommendation.');
      }
    } catch (err) {
      console.error("Gemini API Error:", err);
      setError(err.message || "Failed to connect to the Gemini API service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Quick Action Suggestions Handler
  const handleQuickSuggestion = (promptText) => {
    if (loading) return;
    if (!GEMINI_API_KEY) {
      setError("Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.");
      return;
    }
    handleSendMessage(promptText);
  };

  return (
    <div id={id} className="bento-card col-8" style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* Card Header */}
      <div className="card-header" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div className="card-title-group">
          <div className="card-icon-wrapper" style={{ color: 'var(--accent-green)', background: 'rgba(16, 185, 129, 0.03)' }}>
            <Bot size={20} />
          </div>
          <div>
            <h3 className="card-title">EcoPulse AI</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Your Carbon Coach powered by Gemini API
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '0.65rem', 
            fontWeight: '800', 
            background: GEMINI_API_KEY ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
            padding: '4px 10px', 
            borderRadius: '20px', 
            color: GEMINI_API_KEY ? 'var(--accent-green)' : 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {GEMINI_API_KEY ? '✓ COACH ACTIVE' : '⚠ KEY MISSING (.ENV)'}
          </span>
          
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClearHistory}
            style={{ padding: '6px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--card-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Clear Conversation"
          >
            <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="ai-chat-split">
        
        {/* Left Side: Stats context and suggestion cards */}
        <div className="ai-chat-sidebar">
          
          {/* Key Missing Alert */}
          {!GEMINI_API_KEY && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.05)', 
              border: '1px solid var(--danger)', 
              borderRadius: 'var(--border-radius-md)', 
              padding: '12px', 
              fontSize: '0.75rem', 
              color: 'var(--danger)',
              lineHeight: '1.4'
            }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>API Key Missing</strong>
              Please create a <code>.env</code> file in the project root directory and add:
              <pre style={{ margin: '6px 0 0 0', padding: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '0.7rem' }}>
                VITE_GEMINI_API_KEY=your_api_key_here
              </pre>
            </div>
          )}

          {/* AI Context Card */}
          <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={14} style={{ color: 'var(--accent-blue)' }} />
              <h4 style={{ fontSize: '0.8rem', fontWeight: '700', margin: 0 }}>Active AI Context</h4>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Net Footprint:</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-green)' }}>{(netFootprint || 0).toLocaleString()} kg CO₂/yr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transport:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{(footprintBreakdown?.transport || 0).toLocaleString()} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Home Energy:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{(footprintBreakdown?.energy || 0).toLocaleString()} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Diet Type:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {inputs?.dietType ? inputs.dietType.replace(/([A-Z])/g, ' $1') : 'Low Meat'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Level & XP:</span>
                <span style={{ fontWeight: '600', color: 'var(--accent-orange)' }}>Level {Math.floor((xp || 0) / 100) + 1} ({xp || 0} XP)</span>
              </div>
            </div>
          </div>

          {/* Quick Suggestions Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={14} style={{ color: 'var(--accent-orange)' }} />
              <h4 style={{ fontSize: '0.8rem', fontWeight: '700', margin: 0 }}>Quick Suggestions</h4>
            </div>
            <div className="ai-chip-list">
              <button 
                type="button" 
                className="ai-chip"
                onClick={() => handleQuickSuggestion("Please analyze my footprint data and explain where my emissions are highest.")}
                disabled={loading}
              >
                📊 Analyze my footprint
              </button>
              <button 
                type="button" 
                className="ai-chip"
                onClick={() => handleQuickSuggestion("Generate a personalized 3-step action plan to lower my carbon emissions with estimated annual savings.")}
                disabled={loading}
              >
                💡 Personalized savings plan
              </button>
              <button 
                type="button" 
                className="ai-chip"
                onClick={() => handleQuickSuggestion("How can I reduce my transportation carbon footprint based on my current weekly commute?")}
                disabled={loading}
              >
                🚗 Improve commuting impact
              </button>
              <button 
                type="button" 
                className="ai-chip"
                onClick={() => handleQuickSuggestion("Tell me how my diet type contributes to my emissions and suggest lower impact dietary choices.")}
                disabled={loading}
              >
                🥗 Food and diet options
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Chat panel */}
        <div className="ai-chat-main">
          
          {/* Scrollable messages container */}
          <div className="ai-chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`ai-chat-bubble ${message.sender}`}
              >
                {message.sender === 'ai' ? parseMarkdown(message.text) : message.text}
                <div style={{ 
                  textAlign: 'right', 
                  fontSize: '0.65rem', 
                  marginTop: '6px', 
                  color: message.sender === 'user' ? 'rgba(5, 10, 8, 0.5)' : 'var(--text-muted)',
                  fontWeight: '600'
                }}>
                  {message.timestamp}
                </div>
              </div>
            ))}

            {/* Typing Animation Indicator */}
            {loading && (
              <div className="typing-indicator">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px' }}>Coach is thinking</span>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{ 
                alignSelf: 'stretch', 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid var(--danger)', 
                color: 'var(--danger)', 
                borderRadius: 'var(--border-radius-md)', 
                padding: '12px', 
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'messageFadeIn 0.3s ease-out'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form input field area */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }} 
            className="ai-chat-input-container"
          >
            <input
              type="text"
              className="ai-chat-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={GEMINI_API_KEY ? "Ask your Carbon Coach anything..." : "API Key missing in environment..."}
              disabled={loading || !GEMINI_API_KEY}
            />
            <button
              type="submit"
              className="ai-chat-send-btn"
              disabled={loading || !GEMINI_API_KEY || !inputMessage.trim()}
              title="Send Message"
            >
              <Send size={16} />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
