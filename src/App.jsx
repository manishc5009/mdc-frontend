import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import UploadComponent from './components/UploadComponent';
import LoginPage from './components/Login';
import './styles.css';
import { useMsal } from '@azure/msal-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserCircle } from '@fortawesome/free-solid-svg-icons'

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const { instance } = useMsal();
  const [username, setUsername] = useState(localStorage.getItem("username") || "User");
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();

  return (
    <>
      {location.pathname !== "/login" && (
        <Header username={username} setUsername={setUsername} msalInstance={instance} showDropdown={showDropdown} setShowDropdown={setShowDropdown} />
      )}
      <main className="p-4">
        <Routes>
          <Route path="/" element={<UploadComponent />} />
          <Route path="/login" element={<LoginPage setUsername={setUsername} />} />
        </Routes>
      </main>
    </>
  );
}

function Header({ username, setUsername, msalInstance, showDropdown, setShowDropdown }) {
  const location = useLocation();

  if (location.pathname === "/login") {
    return (
      <header style={{ textAlign: 'center' }}>
        <div className="header-title" style={{textAlign: 'center',width: '100%'}}>MDC Application</div>
      </header>
    );
  }

  return (
    <header>
      <div className="header-title">MDC Application</div>
      <div 
        className="welcome-text" 
        onMouseEnter={() => setShowDropdown(true)} 
        onMouseLeave={() => setShowDropdown(false)}
        style={{ position: 'relative', display: 'inline-block' }}
      >
        <FontAwesomeIcon icon={faUserCircle} style={{ marginRight: '0.5rem', color: '#4b5563' }} />
        <span>{username}!</span>
        {showDropdown && (
          <DropdownMenu onLogout={() => setUsername("")} msalInstance={msalInstance} />
        )}
      </div>
    </header>
  );
}

function DropdownMenu({ onLogout, msalInstance }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    msalInstance.logoutPopup().then(() => {
      localStorage.removeItem("username");
      localStorage.removeItem("useremail");
      onLogout();
      navigate("/login");
    }).catch(e => {
      console.error(e);
    });
  };

  return (
    <div 
      className="dropdown-menu" 
      style={{
        position: 'absolute',
        top: '100%',
        width: '150px',
        left: 0,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '0.5rem',
        zIndex: 1000,
      }}
    >
      <button 
        onClick={handleLogout} 
        style={{
          background: 'none',
          border: 'none',
          color: 'red',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default App
