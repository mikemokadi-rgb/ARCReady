import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ARCLogo } from '../components/ARCLogo';
import { useReveal } from '../hooks/useReveal';

export function HomePage() {
  useReveal();
  const [formStatus, setFormStatus] = useState('idle');

  useEffect(() => {
    // scroll progress bar
    const bar = document.getElementById('scroll-progress');
    const update = () => {
      const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (bar) bar.style.width = pct + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    setFormStatus('sent');
    setTimeout(() => { setFormStatus('idle'); e.target.reset(); }, 3500);
  }

  return (
    <>
      {/* ── HERO ── */}
      <section id="home">
        <svg className="hero-arcs" viewBox="0 0 680 680" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="340" cy="340" r="330" stroke="#B09050" strokeWidth="0.6" opacity="0.07"/>
          <circle cx="340" cy="340" r="250" stroke="#B09050" strokeWidth="0.6" opacity="0.055"/>
          <circle cx="340" cy="340" r="170" stroke="#B09050" strokeWidth="0.6" opacity="0.04"/>
          <circle cx="340" cy="340" r="90"  stroke="#B09050" strokeWidth="0.6" opacity="0.03"/>
          <path d="M340 10 A330 330 0 0 1 660 260" stroke="#C8A96A" strokeWidth="1.2" opacity="0.11" fill="none"/>
          <path d="M340 90 A250 250 0 0 1 580 260" stroke="#C8A96A" strokeWidth="0.8" opacity="0.07" fill="none"/>
        </svg>
        <div className="hero-rule" />
        <div className="container">
          <div className="hero-inner">
            <div className="hero-content">
              <div className="hero-eyebrow">GRC &amp; IT Audit Readiness Advisory &nbsp;·&nbsp; Global Standards</div>
              <h1 className="hero-headline">
                Get <em>audit-ready</em><br/>
                before the<br/>
                auditors arrive.
              </h1>
              <p className="hero-sub">
                ARCReady helps organisations worldwide assess and strengthen their audit, risk, and compliance posture — so you're never caught off guard.
              </p>
              <div className="hero-actions">
                <a href="#contact" className="btn btn-gold">Book a Free Discovery Call</a>
                <a href="#services" className="btn-ghost-dark">View Our Services &nbsp;→</a>
              </div>
              <div className="hero-trust">
                {['CA(SA) Qualified','COSO & ISO 27001','IT & GRC Specialist','Globally Aligned'].map(t => (
                  <div className="trust-pill" key={t}>
                    <div className="trust-dot" />
                    <span className="trust-label">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-logo-frame">
                <div className="ring ring-1" /><div className="ring ring-2" /><div className="ring ring-3" />
                <div className="hero-mark">
                  <ARCLogo width={110} height={98} />
                  <div className="hero-mark-name">ARCReady</div>
                  <div className="hero-mark-tag">Audit &nbsp;·&nbsp; Risk &nbsp;·&nbsp; Compliance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUE PROP ── */}
      <section id="value-prop">
        <div className="container">
          <div className="value-header reveal">
            <div className="eyebrow eyebrow--center">Why ARCReady</div>
            <h2 className="section-title" style={{textAlign:'center'}}>What sets us apart</h2>
            <p className="section-sub section-sub--center">
              Every engagement is backed by professional rigour, internationally recognised regulatory frameworks,<br/>and findings you can actually act on.
            </p>
          </div>
          <div className="value-grid">
            {[
              { n:'01', title:'Tailored ARC Readiness', body:'We assess your organisation\'s audit, risk, and compliance standing to ensure full readiness for regulatory requirements — mapped to your specific operating environment.', d:'d1' },
              { n:'02', title:'Expert-Led, CA(SA) Backed', body:'Our assessments are led by a qualified CA(SA) with hands-on experience in external audit, IT general controls, and information systems — not junior associates working from templates.', d:'d2' },
              { n:'03', title:'Actionable, Not Just Theoretical', body:'You receive a structured report with prioritised findings and a clear remediation roadmap — not a list of observations with no direction. Every finding comes with a next step.', d:'d3' },
            ].map(c => (
              <div className={`value-card reveal ${c.d}`} key={c.n}>
                <div className="val-number">{c.n}</div>
                <div className="val-title">{c.title}</div>
                <p className="val-body">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works">
        <div className="hiw-deco hiw-deco-1" /><div className="hiw-deco hiw-deco-2" />
        <div className="container">
          <div className="hiw-header reveal">
            <div className="eyebrow eyebrow--light eyebrow--center">Our Process</div>
            <h2 className="section-title section-title--light">How ARCReady Works</h2>
            <p className="section-sub section-sub--light section-sub--center" style={{marginTop:10}}>
              A structured four-step engagement from first contact to ongoing assurance.
            </p>
          </div>
          <div className="hiw-steps">
            {[
              { n:'1', title:'Discovery Call', body:'We understand your business, regulatory environment, and risk profile before a single document is reviewed.', d:'d1' },
              { n:'2', title:'Assessment', body:'We evaluate your controls, documentation, and compliance posture across all relevant domains with professional rigour.', d:'d2' },
              { n:'3', title:'Report & Roadmap', body:'You receive a comprehensive report with prioritised findings, gap analysis, and practical, sequenced next steps.', d:'d3' },
              { n:'4', title:'Ongoing Support', body:'Stay on track with optional follow-up reviews and advisory support as your remediation progresses.', d:'d4' },
            ].map(s => (
              <div className={`hiw-card reveal ${s.d}`} key={s.n}>
                <div className="hiw-num">{s.n}</div>
                <div className="hiw-title">{s.title}</div>
                <p className="hiw-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div id="trust-bar">
        <div className="container">
          <div className="trust-bar-inner">
            {[
              { icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>, label: 'CA(SA) Qualified' },
              { icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>, label: 'IRBA Framework' },
              { icon: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>, label: 'Globally Aligned' },
              { icon: <><rect x="9" y="9" width="6" height="6"/><path d="M15 9V4h-6v5M15 15v5h-6v-5M9 15H4v-6h5M15 9h5v6h-5"/></>, label: 'IT & GRC Specialist' },
              { icon: <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>, label: 'BDO-Trained' },
            ].map(item => (
              <div className="trust-bar-item" key={item.label}>
                <svg className="trust-bar-icon" width="18" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                <span className="trust-bar-text">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SERVICES ── */}
      <section id="services">
        <div className="container">
          <div className="services-header reveal">
            <div className="eyebrow">Our Services</div>
            <h2 className="section-title">Choose the level of readiness<br/>that fits your business.</h2>
            <p className="section-sub" style={{marginTop:4}}>
              Every ARCReady engagement produces a structured, scoped report you can present to management, auditors, or your board.
            </p>
          </div>
          <div className="services-grid">
            {/* Tier 1 */}
            <div className="svc-card reveal d1">
              <div className="svc-card-head">
                <div className="svc-tier">Tier 1</div>
                <div className="svc-name">Basic ARC<br/>Health Check</div>
                <div className="svc-ideal">Ideal for: Organisations new to formal compliance or preparing for their first external review.</div>
              </div>
              <div className="svc-card-body">
                <div className="svc-includes">What's Included</div>
                <div className="svc-features">
                  {['High-level review of key audit and compliance areas','Gap identification benchmarked against COSO, PCAOB, and SOX baseline control requirements','Executive summary report with prioritised findings','1 x follow-up Q&A session'].map(f => (
                    <div className="svc-feature" key={f}><div className="svc-dot"/><span className="svc-feat-text">{f}</span></div>
                  ))}
                </div>
                <div className="svc-callout"><p className="svc-callout-text">Best entry point to understand where you stand before committing to a deeper review.</p></div>
                <a href="#contact" className="btn btn-outline">Get Started &nbsp;→</a>
              </div>
            </div>

            {/* Tier 2 Featured */}
            <div className="svc-card svc-card--feat reveal d2">
              <div className="svc-popular">Most Popular</div>
              <div className="svc-card-head">
                <div className="svc-tier">Tier 2</div>
                <div className="svc-name">Compliance &amp;<br/>Risk Assessment</div>
                <div className="svc-ideal">Ideal for: Organisations with regulatory exposure, upcoming audits, or cross-border compliance obligations.</div>
              </div>
              <div className="svc-card-body">
                <div className="svc-includes">What's Included</div>
                <div className="svc-features">
                  {['All Basic tier deliverables','Detailed compliance gap analysis mapped to PCAOB, SOX Section 404, ISO 27001, and GDPR as applicable','Risk register development or review aligned to COSO ERM principles','Control effectiveness assessment across financial and operational domains','Structured remediation roadmap with prioritised actions','2 x advisory sessions'].map(f => (
                    <div className="svc-feature" key={f}><div className="svc-dot"/><span className="svc-feat-text">{f}</span></div>
                  ))}
                </div>
                <div className="svc-callout"><p className="svc-callout-text">The most popular tier for organisations preparing for a formal external audit or regulatory review.</p></div>
                <a href="#contact" className="btn btn-gold">Book a Discovery Call</a>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="svc-card reveal d3">
              <div className="svc-card-head">
                <div className="svc-tier">Tier 3</div>
                <div className="svc-name">Full GRC<br/>Assessment</div>
                <div className="svc-ideal">Ideal for: Organisations seeking comprehensive, board-level governance, risk, and compliance assurance.</div>
              </div>
              <div className="svc-card-body">
                <div className="svc-includes">What's Included</div>
                <div className="svc-features">
                  {['All Compliance & Risk tier deliverables','IT General Controls (ITGC) review benchmarked against PCAOB AS 2201 and COBIT 2019','SOP walkthrough and storyboard analysis across control domains','Full COSO Internal Control framework alignment assessment','Board-ready GRC report with executive summary','Ongoing monthly advisory retainer (optional)'].map(f => (
                    <div className="svc-feature" key={f}><div className="svc-dot"/><span className="svc-feat-text">{f}</span></div>
                  ))}
                </div>
                <div className="svc-callout"><p className="svc-callout-text">Designed for organisations that need a full-picture view across governance, risk, compliance, and IT controls — aligned to globally recognised standards.</p></div>
                <a href="#contact" className="btn btn-outline">Get Started &nbsp;→</a>
              </div>
            </div>
          </div>
          <div className="services-cta reveal">
            <p className="services-cta-note">Not sure which tier is right for you?</p>
            <a href="#contact" className="btn btn-royal">Book a Free Discovery Call</a>
          </div>
        </div>
      </section>

      {/* ── FREE ASSESSMENT CTA (new) ── */}
      <div id="assessment-cta">
        <div className="container">
          <div className="assessment-cta-inner">
            <div className="assessment-cta-text">
              <h2>Get your free control self-assessment</h2>
              <p>Answer 12 questions per framework and receive an AI-powered, audit-grade gap analysis report — instantly, at no cost. Know exactly where you stand before we talk.</p>
              <div className="assessment-cta-badges">
                {['ISO 27001','ISO 42001','NIST CSF 2.0','SOC 2','PCI DSS','GDPR / POPIA'].map(b => (
                  <span className="assessment-badge" key={b}>{b}</span>
                ))}
              </div>
            </div>
            <Link to="/assessment" className="btn btn-gold" style={{whiteSpace:'nowrap',flexShrink:0}}>
              Start Free Assessment →
            </Link>
          </div>
        </div>
      </div>

      {/* ── CTA BANNER ── */}
      <div id="cta-banner">
        <div className="cta-deco cta-deco-1"/><div className="cta-deco cta-deco-2"/>
        <div className="container">
          <div className="cta-inner reveal">
            <div className="eyebrow eyebrow--light eyebrow--center">Take the First Step</div>
            <h2 className="cta-title">Ready to know where you stand?</h2>
            <p className="cta-sub">Book a free 30-minute discovery call. No obligation, no jargon — just clarity on your audit and compliance posture.</p>
            <a href="#contact" className="btn btn-gold" style={{margin:'0 auto'}}>Book Your Free Call</a>
          </div>
        </div>
      </div>

      {/* ── ABOUT ── */}
      <section id="about">
        <div className="container">
          <div className="about-grid">
            <div>
              <div className="eyebrow reveal">About ARCReady</div>
              <h2 className="section-title reveal">Built by auditors.<br/>Designed for business.</h2>
              <div className="ornament reveal">
                <div className="ornament-line"/><div className="ornament-diamond"/><div className="ornament-diamond"/><div className="ornament-line"/>
              </div>
              <p className="about-body reveal">ARCReady was founded to solve a problem that's all too common in organisations globally: businesses facing audits, regulatory reviews, or compliance obligations without a clear picture of where they stand.</p>
              <p className="about-body reveal" style={{marginTop:-16}}>We bridge that gap — giving you the clarity, documentation, and remediation direction you need before the auditors arrive.</p>
              <div className="founder-card reveal">
                <div className="founder-avatar"><ARCLogo width={38} height={34}/></div>
                <div className="founder-name">ARCReady Founder</div>
                <div className="founder-role">CA(SA) · IT Audit · GRC Advisory</div>
                <p className="founder-bio">ARCReady is led by a CA(SA) with over five years of experience spanning external audit, audit data analytics, and information systems auditing at a Big 4-affiliated firm. After working across audit engagements, ITGC assessments, and data analytics projects for clients across multiple industries, ARCReady was established to bring that same rigour directly to businesses — on their terms, at their pace.</p>
                <div className="tag-row">
                  <span className="tag tag-r">CA(SA)</span>
                  <span className="tag tag-g">BDO International</span>
                  <span className="tag tag-o">External Audit</span>
                  <span className="tag tag-g">IT General Controls</span>
                  <span className="tag tag-o">Audit Data Analytics</span>
                </div>
              </div>
            </div>
            <div>
              <div className="eyebrow reveal">Our Values</div>
              <h3 className="values-title reveal">Why ARCReady?</h3>
              <div className="value-items">
                {[
                  { icon: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>, name:'Practical over Theoretical', body:'We focus on findings you can actually act on. Every observation in our reports comes with a clear, prioritised remediation recommendation.', d:'d1' },
                  { icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>, name:'Independent and Objective', body:'Our assessments are conflict-free and grounded in professional standards — no vendor relationships, no hidden agendas.', d:'d2' },
                  { icon: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>, name:'Globally Aligned Standards', body:'We work across the full spectrum of internationally recognised frameworks — COSO, PCAOB, SOX, ISO 27001, COBIT, GDPR, and IFRS.', d:'d3' },
                  { icon: <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>, name:'CA(SA) Rigour', body:'Every engagement is backed by professional training and real-world audit experience — not off-the-shelf checklists or junior resources.', d:'d4' },
                ].map(v => (
                  <div className={`vi reveal ${v.d}`} key={v.name}>
                    <div className="vi-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A96A" strokeWidth="1.5" strokeLinecap="round">{v.icon}</svg>
                    </div>
                    <div>
                      <div className="vi-name">{v.name}</div>
                      <p className="vi-body">{v.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:40}} className="reveal">
                <a href="#contact" className="btn-ghost-gold">Get in Touch &nbsp;→</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact">
        <div className="contact-deco contact-deco-1"/><div className="contact-deco contact-deco-2"/>
        <div className="container">
          <div className="contact-grid">
            <div>
              <div className="eyebrow eyebrow--light reveal">Get in Touch</div>
              <h2 className="contact-title reveal">Let's talk about<br/>your readiness.</h2>
              <p className="contact-sub reveal">Whether you have a specific engagement in mind or just want to understand your options, we're happy to have a no-obligation conversation.</p>
              <div className="contact-options">
                {[
                  { icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, title:'Book a Free Discovery Call', text:"Schedule a 30-minute call at a time that suits you. No obligation, no jargon — just clarity.", link:null, linkText:'Schedule a Call →', d:'d1' },
                  { icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>, title:'Send a Message', text:"Prefer email? Reach out directly and we'll respond within one business day.", link:'mailto:hello@arcready.co.za', linkText:'hello@arcready.co.za', d:'d2' },
                  { icon: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>, title:'Global Reach', text:'ARCReady works with organisations across multiple jurisdictions, delivering remote and on-site engagements worldwide.', link:null, linkText:null, d:'d3' },
                ].map(o => (
                  <div className={`co reveal ${o.d}`} key={o.title}>
                    <div className="co-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">{o.icon}</svg>
                    </div>
                    <div>
                      <div className="co-title">{o.title}</div>
                      <p className="co-text">{o.text}</p>
                      {o.link && <a href={o.link} className="co-link">{o.linkText}</a>}
                      {!o.link && o.linkText && <span className="co-link">{o.linkText}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal">
              <div className="form-wrap">
                <div className="form-title">Send a Message</div>
                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <div className="fg"><label className="fl">Name *</label><input className="fi" type="text" placeholder="Your full name" required/></div>
                    <div className="fg"><label className="fl">Company</label><input className="fi" type="text" placeholder="Organisation name"/></div>
                    <div className="fg"><label className="fl">Email *</label><input className="fi" type="email" placeholder="you@company.com" required/></div>
                    <div className="fg"><label className="fl">Phone</label><input className="fi" type="tel" placeholder="+27 ..."/></div>
                    <div className="fg full">
                      <label className="fl">What are you looking for?</label>
                      <select className="fs">
                        <option value="">Select an option</option>
                        <option>General Enquiry</option>
                        <option>Book Assessment</option>
                        <option>Partnership</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="fg full"><label className="fl">Message</label><textarea className="ft" placeholder="Tell us about your situation or what you're looking for..."/></div>
                    <div className="fg full" style={{marginTop:4}}>
                      <button type="submit" className="btn btn-gold" style={{width:'100%',justifyContent:'center', background: formStatus === 'sent' ? 'var(--gold-muted)' : '', pointerEvents: formStatus === 'sent' ? 'none' : ''}}>
                        {formStatus === 'sent' ? 'Message Sent ✓' : 'Send Message'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
