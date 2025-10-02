import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import './App.css';
import './assets/styles/style.css';
import Home from './components/Home';
import Html from './components/Html';
import BBCode from './components/Bbcode';
import BBCodeV1 from './components/Bbcodev1';
import Content from './components/Content';
import Scss from './components/Scss';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    setIsActive(!isActive);
  };

  return (
    <ErrorBoundary>
      <Router>
        <header className="header">
          <div className="header-logo">
            <span>CONVERT TO</span>
          </div>
          <div className="header-toggle">
            <button className={`btn-nav-toggle ${isActive ? 'active' : ''}`} onClick={handleClick}>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
          <nav className={`header-nav ${isActive ? 'active' : ''}`}>
            <ul className="nav-list">
              <li>
                <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsActive(!isActive)}>Gutenberg</NavLink>
              </li>
              <li>
                <NavLink to="/html" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsActive(!isActive)}>HTML</NavLink>
              </li>
              <li>
                <NavLink to="/bbcode" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsActive(!isActive)}>BBCode</NavLink>
              </li>
              <li>
                <NavLink to="/bbcode-v1" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsActive(!isActive)}>BBCode v1.0</NavLink>
              </li>
              <li>
                <NavLink to="/content" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsActive(!isActive)}>Content</NavLink>
              </li>
              <li>
                <NavLink to="/scss" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsActive(!isActive)}>SCSS</NavLink>
              </li>
            </ul>
          </nav>
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/html" element={<Html />} />
            <Route path="/bbcode" element={<BBCode />} />
            <Route path="/bbcode-v1" element={<BBCodeV1 />} />
            <Route path="/content" element={<Content />} />
            <Route path="/scss" element={<Scss />} />
          </Routes>
        </main>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
