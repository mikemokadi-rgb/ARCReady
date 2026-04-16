import { ARCLogo } from './ARCLogo';

export function Footer() {
  return (
    <footer id="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-logo">
            <ARCLogo width={28} height={25} />
            <div>
              <div className="footer-logo-name">ARCReady</div>
              <div className="footer-logo-sub">Audit · Risk · Compliance</div>
            </div>
          </div>
          <nav className="footer-nav">
            <a href="/#home">Home</a>
            <a href="/#services">Services</a>
            <a href="/#about">About</a>
            <a href="/#contact">Contact</a>
          </nav>
          <a href="mailto:hello@arcready.co.za" className="footer-email">hello@arcready.co.za</a>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© 2025 ARCReady. All rights reserved.</p>
          <p className="footer-tagline">"Know where you stand before they arrive."</p>
        </div>
      </div>
    </footer>
  );
}
