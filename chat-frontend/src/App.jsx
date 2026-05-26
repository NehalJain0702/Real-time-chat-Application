import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL;
const WEBSOCKET_URL = API_URL + '/chat';
const SEND_DESTINATION = '/app/sendMessage';
const DELIVERED_DESTINATION = '/app/delivered';
const SEEN_DESTINATION = '/app/seen';



/* ---------- Helpers ---------- */
function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-gradient-to-br from-violet-500 to-purple-600',
  'bg-gradient-to-br from-blue-500 to-cyan-500',
  'bg-gradient-to-br from-emerald-500 to-teal-500',
  'bg-gradient-to-br from-orange-500 to-amber-500',
  'bg-gradient-to-br from-pink-500 to-rose-500',
  'bg-gradient-to-br from-indigo-500 to-blue-600',
  'bg-gradient-to-br from-fuchsia-500 to-pink-500',
  'bg-gradient-to-br from-lime-500 to-green-500',
];

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function StatusIcon({ status }) {
  if (status === 'SEEN') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
    );
  }
  if (status === 'DELIVERED') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12"></polyline>
        <polyline points="20 6 9 17 4 12" style={{ opacity: 0.5, transform: 'translateX(-6px)' }}></polyline>
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

/* ================================================================
   APP
   ================================================================ */
export default function App() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState('');
  const clientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const seenMessagesRef = useRef(new Set());

  // Derive contacts dynamically from all messages
  const contacts = users.map(user => ({
    name: user.username,
    preview: "Start chatting...",
    online: true
  }));

  // Load users after join
  useEffect(() => {
    if (!username || !joined) return;

    fetch(`${API_URL}/api/users`)
      .then(res => {
        if (!res.ok) {
          throw new Error("Failed to fetch users: " + res.status);
        }
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data)) {
          console.error("Expected array of users but got:", data);
          setUsers([]);
          return;
        }
        // Remove current user from contacts
        setUsers(data.filter(u => u.username !== username));
      })
      .catch(err => {
        console.error("Error fetching users:", err);
        setUsers([]);
      });
  }, [username, joined]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get filtered messages for current contact
  const getFilteredMessages = () => {
    if (!selectedContact) return [];
    return messages.filter(m => 
      (m.sender === selectedContact.name && m.receiver === username) ||
      (m.sender === username && m.receiver === selectedContact.name)
    );
  };

  // Mark visible messages as seen
  useEffect(() => {
    if (!selectedContact || !clientRef.current?.connected) return;
    
    const filteredMessages = getFilteredMessages();
    filteredMessages.forEach(msg => {
      if (msg.sender === selectedContact.name && msg.receiver === username && msg.status !== 'SEEN') {
        if (!seenMessagesRef.current.has(msg.id)) {
          seenMessagesRef.current.add(msg.id);
          setTimeout(() => {
            clientRef.current.publish({
              destination: SEEN_DESTINATION,
              body: msg.id.toString()
            });
          }, 500);
        }
      }
    });
  }, [messages, selectedContact, username]);

  function connect() {
    const client = new Client({
      webSocketFactory: () => new SockJS(WEBSOCKET_URL),
      reconnectDelay: 5000,
       heartbeatIncoming: 4000,
       heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnected(true);
        // Subscribe to user-specific queue
        client.subscribe(`/topic/messages`, (message) => {
          const body = JSON.parse(message.body);
          body._time = new Date();
          body.id = body.id || Date.now();
          setMessages((prev) => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some(m => m.id === body.id);
            if (exists) {
              // Update existing message (status changes)
              return prev.map(m => m.id === body.id ? body : m);
            }
            return [...prev, body];
          });
          
          // Mark as delivered if we're the receiver
          if (body.receiver === username && body.status !== 'DELIVERED' && body.status !== 'SEEN') {
            setTimeout(() => {
              client.publish({
                destination: DELIVERED_DESTINATION,
                body: body.id.toString(),
              });
            }, 300);
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => {
        console.error('STOMP error', frame);
        setConnected(false);
      },
    });
    client.activate();
    clientRef.current = client;
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setAuthError('Username and password are required');
      return;
    }

    const userData = {
      username: username.trim(),
      password: password.trim()
    };

    fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Authentication failed: " + res.status);
        }
        return res.json();
      })
      .then(data => {
        setAuthError('');
        setJoined(true);
        connect();
      })
      .catch(err => {
        console.error("Auth error:", err);
        setAuthError('Failed to authenticate. Please try again.');
      });
  }
  function loadMessages(contactName) {
  fetch(`${API_URL}/messages/${username}/${contactName}`)
  .then(res => {
    if (!res.ok) {
      throw new Error("API failed: " + res.status);
    }
    return res.json();
  })
  .then(data => {
    console.log("API response:", data); // DEBUG

    if (!Array.isArray(data)) {
      console.error("Expected array but got:", data);
      setMessages([]); // fallback
      return;
    }

const formatted = data.map(m => ({
  ...m,
  _time: m.timestamp ? new Date(m.timestamp) : new Date()
}));

setMessages(prev => {

  const merged = [...prev];

  formatted.forEach(fMsg => {

    const exists = merged.some(m =>
      m.id === fMsg.id ||

      (
        m.sender === fMsg.sender &&
        m.receiver === fMsg.receiver &&
        m.content === fMsg.content
      )
    );

    if (!exists) {
      merged.push(fMsg);
    }
  });

  return merged;
});
  })
  .catch(err => {
    console.error("Fetch error:", err);
    setMessages([]);
  });
}
  function handleSend(e) {
  e.preventDefault();

  if (!input.trim() || !clientRef.current?.connected || !selectedContact) return;

  const msg = { 
    sender: username, 
    receiver: selectedContact.name,
    content: input.trim(),
    status: 'SENT',
    
  };

  // show instantly
  setMessages(prev => [...prev, msg]);

  // send ONCE
  clientRef.current.publish({
    destination: SEND_DESTINATION,
    body: JSON.stringify(msg),
  });

  setInput('');
  inputRef.current?.focus();
}

  /* ================ JOIN SCREEN ================ */
  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
        {/* Ambient decorative circle */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-300/20 blur-[120px] pointer-events-none" />

        <form
          onSubmit={handleJoin}
          className="relative z-10 w-full max-w-md mx-4 p-8 rounded-3xl bg-white border border-gray-200 shadow-xl"
        >
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">QuickChat</h1>
            <p className="text-sm text-gray-500">Real-time messaging powered by WebSockets</p>
          </div>

          <label className="block mb-2 text-sm font-medium text-gray-700">Your display name</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. Alex"
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
          />

          <label className="block mb-2 text-sm font-medium text-gray-700 mt-4">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
          />

          {authError && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{authError}</p>
            </div>
          )}

          <button
            type="submit"
            className="mt-6 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            {isLogin ? 'Login / Register' : 'Create Account'}
          </button>
        </form>
      </div>
    );
  }

  /* ================ CHAT SCREEN ================ */
  return (
    <div className="h-screen flex bg-gray-100 text-gray-900">
      {/* -------- SIDEBAR -------- */}
      <aside className="w-[340px] flex flex-col border-r border-gray-200 bg-white">
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          {/* Hamburger icon */}
          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
            />
          </div>
        </div>

        {/* Contacts list */}
        <div className="flex-1 overflow-y-auto sidebar-scroll">
          {contacts.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-gray-400">No contacts yet.</p>
              <p className="text-xs text-gray-400">They'll appear here when someone sends a message.</p>
            </div>
          )}
          {contacts.map((contact) => (
            <button
              key={contact.name}
              onClick={() => {
                        setSelectedContact(contact);
                        loadMessages(contact.name);
                      }}
              className={`contact-row w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer ${selectedContact?.name === contact.name ? 'active' : ''
                }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className={`w-11 h-11 rounded-full ${avatarColor(contact.name)} flex items-center justify-center text-xs font-bold text-white shadow-sm`}>
                  {getInitials(contact.name)}
                </div>
                {contact.online && (
                  <span className="online-pulse absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{contact.name}</p>
                <p className="text-xs text-gray-500 truncate">{contact.preview}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Logged-in badge */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full ${avatarColor(username)} flex items-center justify-center text-[10px] font-bold text-white`}>
              {getInitials(username)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{username}</p>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400'}`} />
                <span className="text-[10px] text-gray-400">{connected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* -------- CHAT AREA -------- */}
      <section className="flex-1 flex flex-col bg-white">
        {/* Chat header */}
        <header className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white">
          {selectedContact ? (
            <>
              <div className="relative">
                <div className={`w-10 h-10 rounded-full ${avatarColor(selectedContact.name)} flex items-center justify-center text-xs font-bold text-white shadow-sm`}>
                  {getInitials(selectedContact.name)}
                </div>
                <span className="online-pulse absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900 leading-tight">{selectedContact.name}</h3>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                  Active now
                </p>
              </div>
            </>
          ) : (
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900 leading-tight">QuickChat</h3>
              <p className="text-xs text-gray-400">Select a contact or start chatting</p>
            </div>
          )}
        </header>

        {/* Messages area */}
        <main className="flex-1 overflow-y-auto chat-scroll px-6 py-5 space-y-4 bg-gray-50/60">
          {getFilteredMessages().length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-40 select-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-400 text-sm">No messages yet — say hello!</p>
            </div>
          )}

          {getFilteredMessages().map((msg, idx) => {
            const isMe = msg.sender === username;
            const time = msg._time ? formatTime(msg._time) : '';
            return (
              <div key={msg.id || idx} className={`msg-animate flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[65%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {/* Sender label for received */}
                  {!isMe && (
                    <p className="text-[11px] font-semibold text-gray-500 mb-1 ml-1">{msg.sender}</p>
                  )}
                  {/* Bubble */}
                  <div
                    className={`px-4 py-2.5 rounded-2xl break-words leading-relaxed text-sm ${isMe
                      ? 'bg-gradient-to-br from-[#4a6cf7] to-[#6c5ce7] text-white rounded-br-md shadow-md shadow-indigo-500/15'
                      : 'bg-[#f0f0f5] text-gray-800 rounded-bl-md'
                      }`}
                  >
                    {msg.content}
                  </div>
                  {/* Timestamp and status */}
                  <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'justify-end mr-1' : 'justify-start ml-1'}`}>
                    {time && (
                      <p className={`text-[10px] text-gray-400`}>
                        {time}
                      </p>
                    )}
                    {isMe && msg.status && (
                      <StatusIcon status={msg.status} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        {/* Message input bar */}
        <form onSubmit={handleSend} className="px-5 py-3.5 border-t border-gray-200 bg-white">
          {!selectedContact && (
            <div className="mb-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              Select a contact to start messaging
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* Attachment icon */}
            <button type="button" className="p-2 rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            {/* Emoji icon */}
            <button type="button" className="p-2 rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedContact ? "Type a message..." : "Select a contact first..."}
              disabled={!selectedContact}
              autoFocus
              className="flex-1 px-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {/* Send button */}
            <button
              type="submit"
              disabled={!input.trim() || !selectedContact}
              className="p-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-[0.92] cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
