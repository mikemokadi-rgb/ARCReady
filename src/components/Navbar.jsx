import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ARCLogo } from './ARCLogo';

export function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [mobileOpen, setMobile]   = useState(false);
  const [activeSection, setActive] = useState('home');
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      if (!isHome) return;
      const ids = ['home', 'services', 'about', 'contact'];
      const y = window.scrollY + 120;
      let cur = 'home';
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) cur = id;
      });
      setActive(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  function scrollTo(id) {
    setMobile(false);
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <>
      <div id="scroll-progress" style={{ width: '0%' }} />
      <nav id="navbar" className={scrolled ? 'scrolled' : ''}>
        <div className="container">
          <div className="nav-inner">
            <Link to="/" className="nav-logo">
              <ARCLogo width={30} height={26} />
              <div className="nav-wordmark">
                <span className="nav-wordmark-name">ARCReady</span>
                <span className="nav-wordmark-sub">Audit · Risk · Compliance</span>
              </div>
            </Link>

            <ul className="nav-links">
              <li><a href={isHome ? '#home' : '/#home'} className={isHome && activeSection === 'home' ? 'active' : ''} onClick={() => scrollTo('home')}>Home</a></li>
              <li><a href={isHome ? '#services' : '/#services'} className={isHome && activeSection === 'services' ? 'active' : ''} onClick={() => scrollTo('services')}>Services</a></li>
              <li><a href={isHome ? '#about' : '/#about'} className={isHome && activeSection === 'about' ? 'active' : ''} onClick={() => scrollTo('about')}>About</a></li>
              <li><a href={isHome ? '#contact' : '/#contact'} className={isHome && activeSection === 'contact' ? 'active' : ''} onClick={() => scrollTo('contact')}>Contact</a></li>
              <li><Link to="/assessment" style={{ color: 'var(--gold-light)' }}>Free Assessment</Link></li>
            </ul>

            <a href="https://calendly.com/michael-arcready/30min"
               target="_blank" rel="noopener noreferrer"
               className="nav-cta-btn">
              Book a Call
            </a>
            <button className="hamburger" onClick={() => setMobile(o => !o)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        <a href="/#home"     onClick={() => setMobile(false)}>Home</a>
        <a href="/#services" onClick={() => setMobile(false)}>Services</a>
        <a href="/#about"    onClick={() => setMobile(false)}>About</a>
        <a href="/#contact"  onClick={() => setMobile(false)}>Contact</a>
        <Link to="/assessment" style={{ color: 'var(--gold-light)' }} onClick={() => setMobile(false)}>Free Assessment</Link>
      </div>
    </>
  );
}