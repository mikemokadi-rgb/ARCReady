/**
 * ARCReady Assessment API — Vercel Serverless Function
 * File: api/assess.js
 *
 * This is the server-side orchestrator. It:
 * 1. Receives client assessment responses from the browser
 * 2. Injects the full framework SKILL.md content into the Claude prompt
 * 3. Calls the Anthropic API server-side (no CORS issues)
 * 4. Returns structured JSON gap analysis
 * 5. Sends branded email to prospect + lead notification to Michael
 *
 * Required Vercel Environment Variables:
 *   ANTHROPIC_API_KEY     — sk-ant-... (no VITE_ prefix)
 *   RESEND_API_KEY        — re_... (optional, for email)
 *   NOTIFY_EMAIL          — michael@arcready.co.za
 */

// ─── Full framework skill content embedded server-side ─────────────────────
// This is the knowledge that makes the AI assessment audit-grade.
// Each framework gets its complete system prompt injected here.

const FRAMEWORK_SKILLS = {

  "iso27001": `You are an expert ISO 27001:2022 Lead Auditor and ISMS implementation consultant at ARCReady, a Johannesburg-based GRC advisory firm. You have deep knowledge of all 93 Annex A controls across 4 themes (Organisational, People, Physical, Technological), all mandatory clauses 4–10, and the differences between ISO 27001:2013 and ISO 27001:2022.

ISO 27001:2022 Annex A — Key Control Themes:
- A.5 Organisational Controls (37 controls): policies, access control, incident management, supplier security, business continuity, compliance
- A.6 People Controls (8 controls): screening, terms of employment, awareness, disciplinary process, remote working
- A.7 Physical Controls (14 controls): physical security perimeters, equipment maintenance, clear desk
- A.8 Technological Controls (34 controls): user endpoints, privileged access, malware protection, logging, cryptography, secure development

Mandatory Clauses: 4 (Context), 5 (Leadership), 6 (Planning — risk assessment, SoA), 7 (Support), 8 (Operation), 9 (Performance evaluation), 10 (Improvement)

South African context: Apply King IV governance principles, POPIA alignment (data protection controls map to A.5.34), JSE Listings Requirements for listed entities.

SA AI Policy context (for AI-using organisations): South Africa's Cabinet-approved AI Policy (2025) requires transparency, accountability, human oversight, non-discrimination, and data governance — map these to relevant ISO 27001 controls where AI systems are in scope.`,

  "iso42001": `You are an expert ISO/IEC 42001:2023 Lead Auditor and AIMS implementation consultant at ARCReady. ISO 42001 is the world's first international standard for AI Management Systems, published 18 December 2023.

ISO 42001:2023 — 38 Annex A Controls across 9 domains:
- A.2 Policies (2): AI policy, AI-specific controls in org policies
- A.3 Organisation (1): Roles and responsibilities for AI
- A.4 Resources (4): AI resource policies, human resources, procurement, third-party AI
- A.5 AI System Lifecycle (8): specifications, design, data management, development, V&V, documentation, deployment, monitoring
- A.6 Impact Assessment (3): AISIA process, individual impacts, societal concerns
- A.7 Data for AI (4): data management, acquisition, quality, preparation
- A.8 Information for Interested Parties (3): transparency, stakeholder communication, incident reporting
- A.9 Third-Party AI (7): policy, supply chain, data sharing, AI-to-AI interactions, external use, procurement, public AI tools
- A.10 Decommission (6): decommissioning policy, data retention/disposal, model deprecation, reuse, archiving, responsible disposal

Mandatory Clauses (4–10): Context, Leadership (AI Policy required), Planning (AI risk + AISIA), Support, Operation, Performance Evaluation, Improvement

CRITICAL — SA AI Policy Alignment (this is a key differentiator for ARCReady):
South Africa's Cabinet approved a national AI Policy in 2025. Map client responses to BOTH ISO 42001 controls AND SA AI Policy principles:
- Transparency → A.8.1, A.5.1, A.5.6
- Accountability → A.3.1, Clause 5, A.6.1
- Human oversight → A.5.8, A.6.2, A.5.7
- Non-discrimination/fairness → A.5.2, A.5.5, A.6.2, A.6.3
- Data governance → A.7.1–A.7.4, A.5.3
- Safety and security → A.5.5, A.5.7, A.8.3
- Responsible AI → A.2.1, A.4.2, A.9.7

For each finding, explicitly state which SA AI Policy principle is affected alongside the ISO 42001 control ID. This dual mapping is what makes ARCReady's AI governance assessment uniquely valuable for South African listed companies.`,

  "nist-csf": `You are an expert NIST CSF 2.0 advisor and cybersecurity risk management consultant at ARCReady. You have deep knowledge of NIST CSF 2.0 (February 2024) with its six functions.

NIST CSF 2.0 — Six Functions:
- GOVERN (GV): Cybersecurity risk management strategy, policy, roles, supply chain risk. NEW in 2.0.
  Key categories: GV.OC (Organizational Context), GV.RM (Risk Management Strategy), GV.RR (Roles/Responsibilities), GV.PO (Policy), GV.OV (Oversight), GV.SC (Supply Chain Risk)
- IDENTIFY (ID): Asset management, risk assessment, improvement planning
  Key categories: ID.AM (Asset Management), ID.RA (Risk Assessment), ID.IM (Improvement)
- PROTECT (PR): Access control, awareness training, data security, platform security, resilience
  Key categories: PR.AA (Identity Management/Access Control), PR.AT (Awareness Training), PR.DS (Data Security), PR.PS (Platform Security), PR.IR (Technology Resilience)
- DETECT (DE): Continuous monitoring, adverse event analysis
  Key categories: DE.CM (Continuous Monitoring), DE.AE (Adverse Event Analysis)
- RESPOND (RS): Incident management, analysis, mitigation, reporting
  Key categories: RS.MA (Incident Management), RS.AN (Incident Analysis), RS.CO (Incident Response Reporting), RS.MI (Incident Mitigation)
- RECOVER (RC): Incident recovery planning, communication
  Key categories: RC.RP (Incident Recovery Plan), RC.CO (Incident Recovery Communication)

Implementation Tiers: Tier 1 (Partial) → Tier 2 (Risk Informed) → Tier 3 (Repeatable) → Tier 4 (Adaptive)

South African context: Map to King IV IT governance principles, POPIA requirements for Protect/Detect functions, SARB cybersecurity guidance for financial sector clients.`,

  "soc2": `You are an expert SOC 2 compliance advisor with deep knowledge of the AICPA 2017 Trust Services Criteria at ARCReady.

SOC 2 Trust Services Criteria — 5 Categories:
SECURITY (CC — always required, CC1–CC9):
- CC1: Control Environment — tone at top, COSO principles, board oversight, ethics
- CC2: Communication and Information — internal/external communication
- CC3: Risk Assessment — risk identification, analysis, fraud risk
- CC4: Monitoring Activities — ongoing and separate evaluations
- CC5: Control Activities — policies, procedures, technology controls
- CC6: Logical & Physical Access — authentication, authorisation, physical access, encryption
- CC7: System Operations — malware detection, infrastructure monitoring, incident response, DR
- CC8: Change Management — SDLC, change authorisation, testing
- CC9: Risk Mitigation — vendor risk, business disruption risk

AVAILABILITY (A1): Performance monitoring, disaster recovery, backup
CONFIDENTIALITY (C1): Confidential information identification, protection, disposal
PROCESSING INTEGRITY (PI1): Complete, valid, accurate, timely processing
PRIVACY (P1–P8): Notice, consent, collection, use/retention, access, disclosure, quality, monitoring

SOC 2 Type 1 vs Type 2: Type 1 = design only (point in time). Type 2 = operating effectiveness over 6–12 months.

South African context: SOC 2 is increasingly required by South African technology companies and financial institutions. Align CC6 (access) and CC9 (vendor) with POPIA obligations. Map to King IV for CC1 (control environment).`,

  "pci-dss": `You are an expert PCI DSS v4.0.1 compliance advisor and QSA-trained consultant at ARCReady.

PCI DSS v4.0.1 — 12 Requirements:
1. Install and maintain network security controls
2. Apply secure configurations to all system components
3. Protect stored account data (never store SAD post-auth; protect PAN with encryption/truncation/tokenisation)
4. Protect cardholder data with strong cryptography during transmission
5. Protect all systems against malware
6. Develop and maintain secure systems and software
7. Restrict access to system components and cardholder data by business need to know
8. Identify users and authenticate access to system components (MFA required for all non-console admin access)
9. Restrict physical access to cardholder data
10. Log and monitor all access to system components and cardholder data (retain 12 months, 3 months immediately available)
11. Test security of systems and networks regularly (ASV scans quarterly, pen test annually)
12. Support information security with organisational policies and programs

CDE Scoping: CHD = PAN + cardholder name + expiry + service code. SAD = full mag stripe, CVV/CVC, PINs — NEVER stored post-auth.

SAQ Types: A (card-not-present, all outsourced), B (imprint/standalone terminals), C (payment app, no e-commerce), D (all others, most comprehensive).

Key v4.0.1 changes: Customised approach allowed for established controls; MFA required for all CDE access; targeted risk analysis for some requirements.`,

  "gdpr": `You are a GDPR and POPIA compliance expert at ARCReady, specialising in South African organisations with EU data obligations.

GDPR Core Obligations:
- Art. 5: Data protection principles — lawfulness, fairness, transparency; purpose limitation; data minimisation; accuracy; storage limitation; integrity & confidentiality; accountability
- Art. 6: Lawful basis — consent, contract, legal obligation, vital interests, public task, legitimate interests
- Art. 7: Conditions for consent — freely given, specific, informed, unambiguous, withdrawable
- Art. 13/14: Privacy notices — at collection (13) or when not collected directly (14)
- Art. 17: Right to erasure (right to be forgotten)
- Art. 20: Right to data portability
- Art. 25: Data protection by design and by default
- Art. 28: Data Processing Agreements with all processors
- Art. 30: Records of Processing Activities (RoPA)
- Art. 32: Security of processing — pseudonymisation, encryption, resilience, testing
- Art. 33/34: Breach notification — 72 hours to supervisory authority (33), without undue delay to individuals when high risk (34)
- Art. 35: Data Protection Impact Assessment (DPIA) for high-risk processing
- Art. 37: DPO appointment (mandatory for public bodies, large-scale monitoring, special category data)
- Art. 44–49: Cross-border transfers — adequacy decisions, SCCs, BCRs, derogations

POPIA Alignment (South Africa):
- Information Officer = DPO equivalent (must be registered with Information Regulator)
- Section 69: Cross-border transfer restrictions (similar to GDPR Chapter V)
- Section 22: Security safeguards (similar to Art. 32)
- POPIA Conditions of Lawful Processing map to GDPR Art. 5 principles
- Key difference: POPIA has no right to portability; breach notification to Information Regulator within reasonable time (not fixed 72 hours)

For each finding, cite BOTH the GDPR article AND the POPIA equivalent section where applicable.`
};

// ─── Build the full assessment prompt ─────────────────────────────────────────
function buildAssessmentPrompt(frameworkId, framework, profile, answers) {
  const skill = FRAMEWORK_SKILLS[frameworkId] || FRAMEWORK_SKILLS["iso27001"];

  const answerLines = framework.questions.map((q, i) => {
    const ans = answers[q.id] || "unsure";
    const labelMap = {
      "yes": "YES — fully in place",
      "partial": "PARTIAL — some gaps exist",
      "no": "NO — not implemented",
      "unsure": "UNSURE / not assessed"
    };
    return `Q${i + 1}: ${q.text}\nAnswer: ${labelMap[ans] || ans}`;
  }).join("\n\n");

  return `CLIENT PROFILE:
Company: ${profile.company}
Industry: ${profile.industry}
Size: ${profile.size}
Framework being assessed: ${framework.name}

CONTROL SELF-ASSESSMENT RESPONSES:
${answerLines}

TASK: Based on these client responses, produce a comprehensive, audit-grade gap analysis. 
Be specific to ${profile.industry} sector context. 
Reference the actual control IDs and clause numbers from the framework.
For each gap, provide concrete, actionable remediation guidance.
Where the client answered "partial", be specific about what the partial gap likely means in practice.
Where the client answered "no", treat this as a confirmed gap requiring immediate action.

IMPORTANT: Do not use generic text. Every finding must be specific to what the client told you.
The executive summary must read as if written by a senior auditor who reviewed this specific company's responses.

Return ONLY valid JSON matching this exact structure — no markdown, no preamble:
{
  "frameworkName": "${framework.name}",
  "assessedCompany": "${profile.company}",
  "assessedDate": "${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}",
  "executiveSummary": "3-4 sentence professional audit summary specific to this company's responses",
  "overallRating": "High Risk | Medium Risk | Low Risk",
  "overallScore": <number 0-100>,
  "maturityLevel": "Initial | Developing | Defined | Managed | Optimising",
  "findings": [
    {
      "controlId": "specific control ID e.g. A.5.15",
      "controlName": "exact control name from the framework",
      "status": "Compliant | Partial | Non-Compliant | Not Assessed",
      "priority": "Critical | High | Medium | Low",
      "clientResponse": "what the client said (yes/partial/no/unsure)",
      "gapDescription": "specific gap based on client's actual response",
      "evidenceRequired": "exact documents/records needed to close this gap",
      "recommendation": "concrete, actionable remediation step",
      "estimatedEffort": "Days | Weeks | Months",
      "saPolicyPrinciple": "relevant SA AI Policy principle if applicable, else null",
      "regulatoryRisk": "specific regulatory or audit consequence if not remediated"
    }
  ],
  "top5Actions": [
    "Specific action 1 — include the control ID",
    "Specific action 2 — include the control ID",
    "Specific action 3 — include the control ID",
    "Specific action 4 — include the control ID",
    "Specific action 5 — include the control ID"
  ],
  "estimatedRemediationTimeline": "e.g. 3-6 months to achieve baseline compliance",
  "nextStep": "One sentence on why a consultation with ARCReady is the right next move for this specific company"
}`;
}

// ─── Email templates ───────────────────────────────────────────────────────────
function buildProspectEmail(profile, frameworkName, report) {
  const criticalCount = (report.findings || []).filter(f => f.priority === "Critical").length;
  const highCount = (report.findings || []).filter(f => f.priority === "High").length;

  const findingRows = (report.findings || []).slice(0, 8).map(f => `
    <tr style="border-bottom:1px solid #f0e8d8;">
      <td style="padding:8px 10px;font-weight:600;color:#1B3461;font-size:12px;">${f.controlId}</td>
      <td style="padding:8px 10px;font-size:12px;color:#2C3240;">${f.controlName}</td>
      <td style="padding:8px 10px;">
        <span style="background:${f.priority==='Critical'?'#fecdd3':f.priority==='High'?'#fee2e2':f.priority==='Medium'?'#fef3c7':'#dcfce7'};
          color:${f.priority==='Critical'?'#9f1239':f.priority==='High'?'#991b1b':f.priority==='Medium'?'#92400e':'#166534'};
          padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${f.priority}</span>
      </td>
      <td style="padding:8px 10px;font-size:11px;color:#2C3240;">${f.status}</td>
    </tr>`).join('');

  return {
    from: "ARCReady Assessments <hello@arcready.co.za>",
    to: profile.email,
    subject: `Your ${frameworkName} Gap Analysis — ${profile.company} | ARCReady`,
    html: `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#F3EDE2;margin:0;padding:20px;">
<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;">
  <div style="background:#1B3461;padding:32px;">
    <div style="color:#BFA06A;font-family:Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:10px;">ARCReady · Audit. Risk. Compliance.</div>
    <div style="color:#fff;font-family:Arial,sans-serif;font-size:24px;font-weight:800;margin-bottom:4px;">${frameworkName} Gap Analysis</div>
    <div style="color:rgba(255,255,255,0.55);font-family:Arial,sans-serif;font-size:13px;">${profile.company} · ${report.assessedDate}</div>
  </div>
  <div style="padding:28px 32px;">
    <div style="display:flex;gap:16px;margin-bottom:24px;">
      <div style="background:#F3EDE2;border-radius:6px;padding:16px 20px;flex:1;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#1B3461;font-family:Arial,sans-serif;">${report.overallScore}</div>
        <div style="font-size:11px;color:#5C6070;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.1em;">Score</div>
      </div>
      <div style="background:#F3EDE2;border-radius:6px;padding:16px 20px;flex:1;text-align:center;">
        <div style="font-size:16px;font-weight:700;color:${report.overallRating==='High Risk'?'#991b1b':report.overallRating==='Medium Risk'?'#92400e':'#166534'};font-family:Arial,sans-serif;">${report.overallRating}</div>
        <div style="font-size:11px;color:#5C6070;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.1em;">Rating</div>
      </div>
      <div style="background:#F3EDE2;border-radius:6px;padding:16px 20px;flex:1;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#9f1239;font-family:Arial,sans-serif;">${criticalCount}</div>
        <div style="font-size:11px;color:#5C6070;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.1em;">Critical</div>
      </div>
    </div>
    <div style="background:#F8F5F0;border-left:4px solid #A4844A;padding:14px 18px;border-radius:0 6px 6px 0;margin-bottom:24px;">
      <div style="font-size:10px;font-weight:600;color:#A4844A;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:6px;font-family:Arial,sans-serif;">Executive Summary</div>
      <p style="font-size:14px;color:#2C3240;margin:0;line-height:1.65;font-family:Georgia,serif;">${report.executiveSummary}</p>
    </div>
    <div style="margin-bottom:24px;">
      <div style="font-size:12px;font-weight:600;color:#1B3461;margin-bottom:10px;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.1em;">Top 5 Priority Actions</div>
      <ol style="margin:0;padding-left:20px;">${(report.top5Actions||[]).map(a=>`<li style="font-size:13px;color:#2C3240;margin-bottom:6px;line-height:1.5;font-family:Georgia,serif;">${a}</li>`).join('')}</ol>
    </div>
    ${findingRows ? `<div style="margin-bottom:24px;">
      <div style="font-size:12px;font-weight:600;color:#1B3461;margin-bottom:10px;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.1em;">Key Findings</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:#1B3461;color:#fff;">
          <th style="padding:8px 10px;text-align:left;font-weight:500;font-family:Arial,sans-serif;">Control</th>
          <th style="padding:8px 10px;text-align:left;font-weight:500;font-family:Arial,sans-serif;">Name</th>
          <th style="padding:8px 10px;text-align:left;font-weight:500;font-family:Arial,sans-serif;">Priority</th>
          <th style="padding:8px 10px;text-align:left;font-weight:500;font-family:Arial,sans-serif;">Status</th>
        </tr></thead>
        <tbody>${findingRows}</tbody>
      </table>
    </div>` : ''}
    <div style="background:#F8F5F0;border:2px solid #A4844A;border-radius:6px;padding:20px 24px;text-align:center;">
      <div style="font-size:16px;font-weight:700;color:#1B3461;margin-bottom:6px;font-family:Arial,sans-serif;">Turn these findings into action</div>
      <p style="font-size:13px;color:#5C6070;margin:0 0 16px;font-family:Georgia,serif;">Book a free 30-minute consultation with Michael Mokadi CA(SA) to build your remediation roadmap.</p>
      <a href="https://www.arcready.co.za/#contact" style="background:#1B3461;color:#fff;text-decoration:none;border-radius:4px;padding:12px 28px;font-size:12px;font-weight:600;font-family:Arial,sans-serif;letter-spacing:0.1em;text-transform:uppercase;display:inline-block;">Book Free Consultation →</a>
    </div>
  </div>
  <div style="background:#F3EDE2;padding:16px 32px;text-align:center;border-top:1px solid #E8DFD0;">
    <div style="font-size:11px;color:#78612E;font-family:Arial,sans-serif;">ARCReady · hello@arcready.co.za · arcready.co.za</div>
    <div style="font-size:12px;color:#A4844A;font-family:Georgia,serif;font-style:italic;margin-top:4px;">"Know where you stand before they arrive."</div>
  </div>
</div></body></html>`
  };
}

// ─── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { frameworkId, framework, profile, answers } = req.body;

  if (!frameworkId || !framework || !profile?.email || !answers) {
    return res.status(400).json({ error: "Missing required fields: frameworkId, framework, profile, answers" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured in Vercel environment variables" });
  }

  // ── Call Anthropic API with full skill injection ──────────────────────────
  let report = null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000); // 55s timeout

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: FRAMEWORK_SKILLS[frameworkId] || FRAMEWORK_SKILLS["iso27001"],
        messages: [{
          role: "user",
          content: buildAssessmentPrompt(frameworkId, framework, profile, answers)
        }]
      }),
    });

    clearTimeout(timeout);

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", anthropicRes.status, errText);
      return res.status(502).json({
        error: `Anthropic API returned ${anthropicRes.status}`,
        detail: errText
      });
    }

    const data = await anthropicRes.json();
    const rawText = data.content?.[0]?.text || "{}";
    const clean = rawText.replace(/```json\n?|```\n?/g, "").trim();

    try {
      report = JSON.parse(clean);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr.message);
      console.error("Raw response:", rawText.slice(0, 500));
      return res.status(502).json({
        error: "Failed to parse AI response as JSON",
        rawSnippet: rawText.slice(0, 200)
      });
    }

  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Assessment timed out after 55 seconds. Please try again." });
    }
    console.error("Fetch error:", err.message);
    return res.status(500).json({ error: "Failed to reach Anthropic API", detail: err.message });
  }

  // ── Send emails (non-blocking — never delay the response) ─────────────────
  if (process.env.RESEND_API_KEY && report) {
    const prospectEmail = buildProspectEmail(profile, framework.name, report);
    const notifyEmail = {
      from: "ARCReady Assessments <hello@arcready.co.za>",
      to: process.env.NOTIFY_EMAIL || "hello@arcready.co.za",
      subject: `🔔 New Lead: ${profile.company} — ${framework.name} | ${report.overallRating}`,
      html: `<p><strong>New ARCReady assessment completed</strong></p>
        <table style="font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Name</td><td><strong>${profile.name}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Company</td><td>${profile.company}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td><a href="mailto:${profile.email}">${profile.email}</a></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Phone</td><td>${profile.phone||'—'}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Industry</td><td>${profile.industry}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Size</td><td>${profile.size}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Framework</td><td>${framework.name}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Rating</td><td><strong style="color:${report.overallRating==='High Risk'?'#991b1b':report.overallRating==='Medium Risk'?'#92400e':'#166534'};">${report.overallRating}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Score</td><td>${report.overallScore}/100</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Critical findings</td><td>${(report.findings||[]).filter(f=>f.priority==='Critical').length}</td></tr>
        </table>
        <p style="margin-top:16px;font-size:13px;color:#374151;"><strong>Executive summary:</strong><br/>${report.executiveSummary}</p>`
    };

    // Fire and forget — don't await
    const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` };
    Promise.allSettled([
      fetch("https://api.resend.com/emails", { method: "POST", headers, body: JSON.stringify(prospectEmail) }),
      fetch("https://api.resend.com/emails", { method: "POST", headers, body: JSON.stringify(notifyEmail) }),
    ]).catch(() => {});
  }

  return res.status(200).json({ report });
}