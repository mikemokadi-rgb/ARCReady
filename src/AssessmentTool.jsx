/**
 * ARCReady Control Self-Assessment Tool
 * 
 * Architecture:
 * - Browser collects responses across 6 frameworks
 * - Each framework POSTs to /api/assess (Vercel serverless function)
 * - Server calls Anthropic API with full SKILL.md content injected
 * - Returns real audit-grade gap analysis JSON
 * - PDF generated client-side using jsPDF
 *
 * Install jsPDF: npm install jspdf
 */

import { useState, useRef, useEffect } from "react";

// ─── Brand ────────────────────────────────────────────────────────────────────
const ROYAL_BLUE = "#1B3461";
const MATTE_GOLD = "#A4844A";
const GOLD_LIGHT = "#BFA06A";
const PAGE_BG    = "#F3EDE2";
const OFF_WHITE  = "#F8F5F0";

// ─── Framework definitions ────────────────────────────────────────────────────
const FRAMEWORKS = [
  {
    id: "iso27001",
    name: "ISO 27001",
    subtitle: "Information Security Management",
    icon: "/frameworks/iso27001.png",
    description: "Gap analysis against ISO 27001:2022 — 93 Annex A controls across 4 themes",
    questions: [
      { id: "q1",  text: "Do you have a formally documented Information Security Policy, approved by senior management and reviewed at least annually?" },
      { id: "q2",  text: "Is there a maintained asset inventory with designated owners for all information assets?" },
      { id: "q3",  text: "Are formal user access reviews conducted at least every 6 months with documented evidence?" },
      { id: "q4",  text: "Do supplier and vendor contracts include information security clauses reviewed at least annually?" },
      { id: "q5",  text: "Is there a documented, tested Incident Response procedure with defined escalation paths and roles?" },
      { id: "q6",  text: "Has a formal risk assessment been completed in the last 12 months with a documented risk treatment plan and Statement of Applicability?" },
      { id: "q7",  text: "Is patch management formalised with a documented schedule, tracked remediation timelines, and evidence of completion?" },
      { id: "q8",  text: "Is there a documented cryptography and encryption policy applied consistently across all systems storing or transmitting sensitive data?" },
      { id: "q9",  text: "Does a formal, recurring security awareness training programme exist for all staff (beyond onboarding only)?" },
      { id: "q10", text: "Is there a documented and tested Business Continuity and Disaster Recovery plan with defined RTOs and RPOs?" },
      { id: "q11", text: "Is change management formally documented with approvals, testing requirements, and rollback procedures?" },
      { id: "q12", text: "Are physical security controls at data centres and server rooms documented, reviewed, and subject to access logs?" },
    ],
  },
  {
    id: "iso42001",
    name: "ISO 42001",
    subtitle: "AI Management Systems",
    icon: "/frameworks/iso42001.png",
    description: "AI governance readiness mapped to ISO 42001:2023 and South Africa's AI Policy",
    questions: [
      { id: "q1",  text: "Does your organisation have a documented AI Policy approved by senior leadership that addresses responsible AI use?" },
      { id: "q2",  text: "Is there a formal AI risk assessment process that evaluates bias, transparency, fairness, and safety before any AI system is deployed?" },
      { id: "q3",  text: "Are AI systems subject to an AI System Impact Assessment (AISIA) that considers effects on individuals and society before production use?" },
      { id: "q4",  text: "Is there documented human oversight capability and intervention mechanisms for all AI systems that make or influence decisions?" },
      { id: "q5",  text: "Do AI systems have documented data governance processes covering training data quality, lineage, and legal basis for data use?" },
      { id: "q6",  text: "Is there a defined AI incident response process with escalation procedures to board or risk committee level?" },
      { id: "q7",  text: "Are AI system outputs subject to regular monitoring for accuracy, fairness, and performance drift in production?" },
      { id: "q8",  text: "Is there a documented Responsible AI framework or ethics policy that addresses transparency, non-discrimination, and accountability?" },
      { id: "q9",  text: "Are AI suppliers and third-party AI tools subject to formal due diligence including AI-specific contractual governance clauses?" },
      { id: "q10", text: "Is there a process to monitor applicable AI regulations (South Africa's AI Policy, EU AI Act) and update governance accordingly?" },
      { id: "q11", text: "Are staff who interact with or oversee AI systems provided with documented AI literacy and responsible use training?" },
      { id: "q12", text: "Is there a process for documenting AI system lifecycle decisions including decommissioning, data deletion, and model retirement?" },
    ],
  },
  {
    id: "nist-csf",
    name: "NIST CSF 2.0",
    subtitle: "Cybersecurity Framework",
    icon: "/frameworks/nist-csf.png",
    description: "Cybersecurity posture across NIST CSF 2.0's six functions: Govern, Identify, Protect, Detect, Respond, Recover",
    questions: [
      { id: "q1",  text: "Is there a documented cybersecurity governance structure with defined roles, board-level oversight, and a cybersecurity risk management strategy? (GOVERN)" },
      { id: "q2",  text: "Has a current and complete asset inventory been maintained covering hardware, software, data assets, and external/third-party systems? (IDENTIFY)" },
      { id: "q3",  text: "Has a formal cybersecurity risk assessment been completed and documented in the last 12 months? (IDENTIFY)" },
      { id: "q4",  text: "Is multi-factor authentication enforced for all privileged access, remote access, and administrative accounts? (PROTECT)" },
      { id: "q5",  text: "Are network segmentation and documented access controls in place between systems of different sensitivity levels? (PROTECT)" },
      { id: "q6",  text: "Is security awareness training mandatory, tracked, and completed by all staff at least annually? (PROTECT)" },
      { id: "q7",  text: "Is there a SIEM, log management system, or equivalent continuous monitoring capability actively in use? (DETECT)" },
      { id: "q8",  text: "Are anomaly detection thresholds and alerting rules defined, documented, and regularly reviewed? (DETECT)" },
      { id: "q9",  text: "Is there a documented and tested Incident Response Plan with defined recovery time objectives and communication procedures? (RESPOND)" },
      { id: "q10", text: "Are post-incident reviews conducted after significant events with lessons learned formally documented and actioned? (RESPOND)" },
      { id: "q11", text: "Is there a documented and tested Business Continuity and Disaster Recovery plan with defined recovery objectives? (RECOVER)" },
      { id: "q12", text: "Are backup and recovery procedures tested at least annually with documented results and evidence of successful restoration? (RECOVER)" },
    ],
  },
  {
    id: "soc2",
    name: "SOC 2",
    subtitle: "Trust Services Criteria",
    icon: "/frameworks/soc2.png",
    description: "SOC 2 Type 1/2 readiness across all five Trust Services Criteria",
    questions: [
      { id: "q1",  text: "Is there a board-approved Information Security policy and documented evidence of management's commitment to the control environment? (CC1)" },
      { id: "q2",  text: "Are security policies formally communicated to all staff and acknowledged in writing at onboarding and annually? (CC2)" },
      { id: "q3",  text: "Is there a formal risk assessment process with a documented risk register reviewed and updated at least annually? (CC3)" },
      { id: "q4",  text: "Are internal controls monitored on an ongoing basis with a documented process for identifying and addressing deficiencies? (CC4)" },
      { id: "q5",  text: "Are control activities (approvals, reconciliations, system access controls) formally documented with evidence of operation? (CC5)" },
      { id: "q6",  text: "Is logical and physical access provisioning, de-provisioning, and quarterly access reviews formally controlled and evidenced? (CC6)" },
      { id: "q7",  text: "Is there a documented incident response process with a tested disaster recovery capability and defined RTO/RPO? (CC7)" },
      { id: "q8",  text: "Is change management formally controlled with documented approval, testing, and rollback procedures for all production changes? (CC8)" },
      { id: "q9",  text: "Are third-party vendors subject to documented risk assessments, security questionnaires, and contractual security requirements? (CC9)" },
      { id: "q10", text: "If Availability is in scope — are uptime SLAs, capacity monitoring, and DR objectives formally documented and measured? (A1)" },
      { id: "q11", text: "If Confidentiality is in scope — is confidential data classified, encrypted, and subject to documented retention and disposal controls? (C1)" },
      { id: "q12", text: "If Privacy is in scope — are data subject rights, consent management, retention schedules, and breach notification procedures documented? (P1–P8)" },
    ],
  },
  {
    id: "pci-dss",
    name: "PCI DSS",
    subtitle: "Payment Card Security",
    icon: "/frameworks/pci-dss.png",
    description: "PCI DSS v4.0.1 readiness across all 12 requirements",
    questions: [
      { id: "q1",  text: "Is the Cardholder Data Environment (CDE) formally scoped with current network diagrams showing all cardholder data flows and system connections?" },
      { id: "q2",  text: "Are network security controls (firewalls, ACLs) in place with documented rule reviews conducted at least every 6 months? (Req 1–2)" },
      { id: "q3",  text: "Is cardholder data (PAN) encrypted at rest and in transit using strong cryptography, and is Sensitive Authentication Data (SAD) never stored post-authorisation? (Req 3–4)" },
      { id: "q4",  text: "Are all CDE systems protected by up-to-date anti-malware software and is patch management applied within defined timeframes? (Req 5–6)" },
      { id: "q5",  text: "Is access to cardholder data restricted strictly on a need-to-know basis with documented access control policies enforced? (Req 7)" },
      { id: "q6",  text: "Are unique IDs assigned to every CDE user, are shared/generic accounts prohibited, and is MFA enforced for all CDE access? (Req 8)" },
      { id: "q7",  text: "Is physical access to CDE systems controlled, logged, and monitored with documented procedures for visitor access? (Req 9)" },
      { id: "q8",  text: "Is comprehensive logging in place for all CDE access and system events, with 12 months retention and 3 months immediately available for review? (Req 10)" },
      { id: "q9",  text: "Are quarterly internal vulnerability scans, ASV external scans, and annual penetration tests conducted and documented? (Req 11)" },
      { id: "q10", text: "Is there a documented Information Security Policy covering all 12 PCI DSS requirements, reviewed annually and communicated to all staff? (Req 12)" },
      { id: "q11", text: "Are all third-party service providers (TPSPs) in the CDE formally listed, their PCI DSS compliance status tracked, and contracts including security requirements? (Req 12.8)" },
      { id: "q12", text: "Have you completed or identified the applicable SAQ type for your merchant or service provider level, and is your compliance programme formally managed?" },
    ],
  },
  {
    id: "gdpr",
    name: "GDPR / POPIA",
    subtitle: "Data Protection & Privacy",
    icon: "/frameworks/gdpr.png",
    description: "GDPR and POPIA compliance readiness for South African organisations",
    questions: [
      { id: "q1",  text: "Is there a documented and maintained Record of Processing Activities (RoPA) covering all personal data processing operations across the organisation?" },
      { id: "q2",  text: "Has a lawful basis been identified, documented, and communicated for each category of personal data processing activity?" },
      { id: "q3",  text: "Are privacy notices provided to data subjects at the point of data collection, covering all required disclosures including purpose, retention, and rights?" },
      { id: "q4",  text: "Is there a documented and tested Data Breach Response procedure capable of meeting the 72-hour notification obligation to regulators?" },
      { id: "q5",  text: "Are Data Processing Agreements (DPAs) formally in place with all third-party processors who handle personal data on your behalf?" },
      { id: "q6",  text: "Is there a documented process to handle data subject requests (access, deletion, portability, correction) within required statutory timeframes?" },
      { id: "q7",  text: "Are Data Protection Impact Assessments (DPIAs) conducted before commencing any new high-risk processing activities?" },
      { id: "q8",  text: "Are personal data retention schedules documented and enforced, with automated or procedural deletion processes in place?" },
      { id: "q9",  text: "Are cross-border data transfers (outside South Africa or EEA as applicable) subject to documented and legally valid transfer mechanisms?" },
      { id: "q10", text: "Has a designated Information Officer (POPIA) or Data Protection Officer (GDPR) been formally appointed and registered where required?" },
      { id: "q11", text: "Is data protection training mandatory for all staff handling personal data, and are completion records maintained?" },
      { id: "q12", text: "Where consent is the lawful basis for processing, are consent mechanisms compliant, documented, and withdrawal processes operational?" },
    ],
  },
  {
    id: "coso",
    name: "COSO",
    subtitle: "Internal Control & ERM",
    icon: "/frameworks/coso.png",
    description: "COSO 2013 Internal Control Framework — 5 components, 17 principles",
    questions: [
      { id: "q1",  text: "Is there a formally documented Code of Conduct or Ethics Policy approved by the board and acknowledged by all staff?" },
      { id: "q2",  text: "Does the board or audit committee have independent oversight of internal controls and financial reporting?" },
      { id: "q3",  text: "Are organisational structures, reporting lines, and delegations of authority formally documented and reviewed?" },
      { id: "q4",  text: "Are HR policies in place that address competence requirements, background checks, and performance management?" },
      { id: "q5",  text: "Are financial reporting, operational, and compliance objectives formally defined and communicated to relevant staff?" },
      { id: "q6",  text: "Is there a formal risk register with identified risks, likelihood/impact ratings, risk owners, and treatment plans?" },
      { id: "q7",  text: "Has a formal fraud risk assessment been conducted, and are anti-fraud controls (e.g. segregation of duties) documented?" },
      { id: "q8",  text: "Are preventive and detective control activities formally documented and mapped to identified risks?" },
      { id: "q9",  text: "Are IT General Controls (access, change management, operations) included as part of the internal control framework?" },
      { id: "q10", text: "Are internal policies and procedures formally documented, reviewed at least annually, and communicated to owners?" },
      { id: "q11", text: "Is there an internal audit function or equivalent that conducts periodic assessments of control effectiveness?" },
      { id: "q12", text: "Is there a formal process to report control deficiencies to appropriate management levels and track remediation?" },
    ],
  },
  {
    id: "cobit2019",
    name: "COBIT 2019",
    subtitle: "IT Governance & ITGC",
    icon: "/frameworks/cobit2019.png",
    description: "COBIT 2019 IT governance — 40 objectives across 5 domains, focused on ITGC",
    questions: [
      { id: "q1",  text: "Is there a formal IT governance framework with defined IT roles, responsibilities, and board-level oversight of technology? (EDM01)" },
      { id: "q2",  text: "Is there a documented IT risk management process that identifies, assesses, and treats IT-related risks? (APO12)" },
      { id: "q3",  text: "Are information security policies and controls formally documented and enforced across all IT systems? (APO13)" },
      { id: "q4",  text: "Is logical access to all financial and operational systems controlled through a formal provisioning, review, and de-provisioning process? (DSS05)" },
      { id: "q5",  text: "Are privileged and administrative access rights restricted, monitored, and subject to periodic review with documented evidence? (DSS05)" },
      { id: "q6",  text: "Is there a formal change management process requiring authorisation, testing, and approval before changes are promoted to production? (BAI06)" },
      { id: "q7",  text: "Are emergency/urgent changes subject to compensating controls and retrospective review? (BAI06)" },
      { id: "q8",  text: "Are IT operations monitored for job failures, batch processing errors, and system availability with documented incident response? (DSS01, DSS02)" },
      { id: "q9",  text: "Are backup and recovery procedures documented, tested at least annually, and results formally recorded? (DSS04)" },
      { id: "q10", text: "Are new system implementations and significant changes governed by a formal SDLC with documented approvals and UAT evidence? (BAI03)" },
      { id: "q11", text: "Is there a formal IT compliance monitoring process that assesses adherence to policies, regulations, and standards? (MEA02, MEA03)" },
      { id: "q12", text: "Are IT internal control deficiencies formally reported to management and the audit committee with tracked remediation? (MEA02)" },
    ],
  },
  {
    id: "pcaob-sox",
    name: "SOX / PCAOB",
    subtitle: "ICFR & IT General Controls",
    icon: "/frameworks/pcaob-sox.png",
    description: "SOX Section 404 ICFR readiness and PCAOB AS 2201 ITGC assessment",
    questions: [
      { id: "q1",  text: "Has management completed a formal assessment of Internal Control over Financial Reporting (ICFR) using the COSO 2013 framework?" },
      { id: "q2",  text: "Are entity-level controls (control environment, risk assessment, monitoring) formally documented and evidenced?" },
      { id: "q3",  text: "Are significant accounts, disclosures, and financial reporting processes formally scoped and documented for ICFR purposes?" },
      { id: "q4",  text: "Are process-level controls mapped to each significant account with documented walkthroughs tracing transactions from initiation to recording?" },
      { id: "q5",  text: "Are logical access controls over financially significant IT systems formally documented, tested, and evidenced (provisioning, reviews, terminations, privileged access)?" },
      { id: "q6",  text: "Is change management over financially significant IT systems formally controlled with documented authorisation, testing, and move-to-production approvals?" },
      { id: "q7",  text: "Are computer operations controls (batch processing, interfaces, job scheduling) documented and monitored with evidence of completeness and accuracy?" },
      { id: "q8",  text: "Are control deficiencies, significant deficiencies, and potential material weaknesses tracked through a formal remediation log reported to the audit committee?" },
      { id: "q9",  text: "If using service organisations for financial processing — are current SOC 1 Type 2 reports obtained and complementary user entity controls documented?" },
      { id: "q10", text: "Are CEO/CFO sub-certifications and disclosure committee processes in place to support Section 302 certifications?" },
      { id: "q11", text: "Are IT systems that support financial close and reporting formally included in the ITGC scope with documented control matrices?" },
      { id: "q12", text: "Has an external auditor or independent party reviewed ITGC controls for the current reporting period, and were findings formally remediated?" },
    ],
  }
];

const ANSWER_OPTIONS = [
  { value: "yes",     label: "Yes — fully in place",      color: "#166534", bg: "#dcfce7" },
  { value: "partial", label: "Partial — some gaps exist", color: "#92400e", bg: "#fef3c7" },
  { value: "no",      label: "No — not implemented",      color: "#991b1b", bg: "#fee2e2" },
  { value: "unsure",  label: "Unsure / not assessed",     color: "#374151", bg: "#f3f4f6" },
];

const INDUSTRY_OPTIONS = ["Mining & Resources","Financial Services","Banking","Insurance","Retail","Manufacturing","Healthcare","Technology","Government / Public Sector","Professional Services","Energy & Utilities","Other"];
const SIZE_OPTIONS = ["1–50 employees","51–200 employees","201–500 employees","501–1,000 employees","1,000+ employees"];

// ─── PDF Generator ─────────────────────────────────────────────────────────────
async function generatePDF(profile, reports, selectedFrameworks) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, margin = 18, contentW = W - margin * 2;
  let y = 0;

  function checkPage(needed = 20) {
    if (y + needed > 272) { doc.addPage(); y = 20; }
  }

  function header() {
    // Navy header bar
    doc.setFillColor(27, 52, 97);
    doc.rect(0, 0, W, 36, "F");
    doc.setTextColor(191, 160, 106);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("ARCREADY · AUDIT. RISK. COMPLIANCE.", margin, 12);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Control Self-Assessment Report", margin, 23);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(`${profile.company} · ${profile.industry} · ${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}`, margin, 31);
    y = 46;
  }

  header();

  // Cover summary
  doc.setTextColor(27, 52, 97);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Assessment Overview", margin, y);
  y += 7;

  doc.setDrawColor(164, 132, 74);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 6;

  const summaryData = selectedFrameworks.map(fwId => {
    const fw = FRAMEWORKS.find(f => f.id === fwId);
    const r = reports[fwId];
    return [fw?.name || fwId, r?.overallScore?.toString() || "—", r?.overallRating || "—", (r?.findings?.filter(f => f.priority === "Critical")?.length || 0).toString()];
  });

  // Summary table
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(27, 52, 97);
  doc.rect(margin, y, contentW, 8, "F");
  doc.setTextColor(255, 255, 255);
  const cols = [60, 25, 60, 30];
  const headers = ["Framework", "Score", "Rating", "Critical"];
  let x = margin + 3;
  headers.forEach((h, i) => { doc.text(h, x, y + 5.5); x += cols[i]; });
  y += 8;

  summaryData.forEach((row, ri) => {
    doc.setFillColor(ri % 2 === 0 ? 248 : 255, ri % 2 === 0 ? 245 : 255, ri % 2 === 0 ? 240 : 255);
    doc.rect(margin, y, contentW, 7, "F");
    doc.setTextColor(44, 50, 64);
    doc.setFont("helvetica", "normal");
    x = margin + 3;
    row.forEach((cell, i) => {
      if (i === 2) {
        const ratingColor = cell === "High Risk" ? [153, 27, 27] : cell === "Medium Risk" ? [146, 64, 14] : [22, 101, 52];
        doc.setTextColor(...ratingColor);
        doc.setFont("helvetica", "bold");
      } else {
        doc.setTextColor(44, 50, 64);
        doc.setFont("helvetica", "normal");
      }
      doc.text(cell, x, y + 5);
      x += cols[i];
    });
    y += 7;
  });
  y += 10;

  // Per-framework sections
  for (const fwId of selectedFrameworks) {
    const fw = FRAMEWORKS.find(f => f.id === fwId);
    const report = reports[fwId];
    if (!report || !report.findings?.length) continue;

    checkPage(40);
    doc.addPage();
    header();

    // Framework title
    doc.setFillColor(27, 52, 97);
    doc.rect(margin, y, contentW, 12, "F");
    doc.setTextColor(191, 160, 106);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(fw.name.toUpperCase(), margin + 3, y + 5);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text("Gap Analysis Report", margin + 3, y + 10);
    y += 18;

    // Score + rating
    const scoreColor = report.overallScore >= 70 ? [22, 101, 52] : report.overallScore >= 40 ? [146, 64, 14] : [153, 27, 27];
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...scoreColor);
    doc.text(report.overallScore.toString(), margin, y + 10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(92, 96, 112);
    doc.text("Overall Score", margin, y + 15);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...scoreColor);
    doc.text(report.overallRating, margin + 30, y + 10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(92, 96, 112);
    doc.text(`Maturity: ${report.maturityLevel || "—"}`, margin + 30, y + 15);
    y += 22;

    // Executive summary
    checkPage(30);
    doc.setFillColor(248, 245, 240);
    doc.setDrawColor(164, 132, 74);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin, y + 20);
    doc.setTextColor(164, 132, 74);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("EXECUTIVE SUMMARY", margin + 3, y + 5);
    doc.setTextColor(44, 50, 64);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(report.executiveSummary || "", contentW - 8);
    summaryLines.forEach((line, i) => { doc.text(line, margin + 3, y + 11 + i * 5); });
    y += 14 + summaryLines.length * 5;

    // Top 5 actions
    checkPage(40);
    y += 6;
    doc.setTextColor(27, 52, 97);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Top 5 Priority Actions", margin, y);
    y += 6;
    (report.top5Actions || []).forEach((action, i) => {
      checkPage(8);
      doc.setFillColor(27, 52, 97);
      doc.circle(margin + 3, y + 2, 2.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text((i + 1).toString(), margin + 3, y + 2.8, { align: "center" });
      doc.setTextColor(44, 50, 64);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(action, contentW - 10);
      lines.forEach((line, li) => { doc.text(line, margin + 9, y + 3 + li * 4.5); });
      y += 4 + lines.length * 4.5;
    });
    y += 6;

    // Findings table
    checkPage(20);
    doc.setTextColor(27, 52, 97);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Detailed Findings (${report.findings.length} controls assessed)`, margin, y);
    y += 6;

    const fCols = [22, 45, 22, 22, 65];
    const fHeaders = ["Control ID", "Control Name", "Priority", "Status", "Recommendation"];

    doc.setFillColor(27, 52, 97);
    doc.rect(margin, y, contentW, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    x = margin + 2;
    fHeaders.forEach((h, i) => { doc.text(h, x, y + 5.5); x += fCols[i]; });
    y += 8;

    for (const [ri, finding] of (report.findings || []).entries()) {
      const rowH = Math.max(10, doc.splitTextToSize(finding.recommendation || "", fCols[4] - 4).length * 4 + 4);
      checkPage(rowH + 2);

      doc.setFillColor(ri % 2 === 0 ? 248 : 255, ri % 2 === 0 ? 245 : 255, ri % 2 === 0 ? 240 : 255);
      doc.rect(margin, y, contentW, rowH, "F");

      x = margin + 2;
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(27, 52, 97);
      doc.text(finding.controlId || "", x, y + 5);
      x += fCols[0];

      doc.setFont("helvetica", "normal");
      doc.setTextColor(44, 50, 64);
      const nameLines = doc.splitTextToSize(finding.controlName || "", fCols[1] - 4);
      nameLines.forEach((l, li) => doc.text(l, x, y + 4 + li * 3.8));
      x += fCols[1];

      const pColors = { Critical: [159,18,57], High: [153,27,27], Medium: [146,64,14], Low: [22,101,52] };
      const pBgs = { Critical: [254,205,211], High: [254,226,226], Medium: [254,243,199], Low: [220,252,231] };
      const pc = pColors[finding.priority] || [55,65,81];
      const pb = pBgs[finding.priority] || [243,244,246];
      doc.setFillColor(...pb);
      doc.roundedRect(x, y + 2, fCols[2] - 4, 5, 1, 1, "F");
      doc.setTextColor(...pc);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(finding.priority || "", x + (fCols[2] - 4) / 2, y + 5.5, { align: "center" });
      x += fCols[2];

      doc.setFont("helvetica", "normal");
      doc.setTextColor(44, 50, 64);
      doc.setFontSize(7);
      doc.text(finding.status || "", x, y + 5);
      x += fCols[3];

      const recLines = doc.splitTextToSize(finding.recommendation || "", fCols[4] - 4);
      recLines.forEach((l, li) => doc.text(l, x, y + 4 + li * 3.8));

      y += rowH;
    }

    // Remediation timeline
    if (report.estimatedRemediationTimeline) {
      checkPage(16);
      y += 6;
      doc.setFillColor(240, 249, 255);
      doc.rect(margin, y, contentW, 12, "F");
      doc.setTextColor(27, 52, 97);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("ESTIMATED REMEDIATION TIMELINE", margin + 3, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(44, 50, 64);
      doc.setFontSize(8.5);
      doc.text(report.estimatedRemediationTimeline, margin + 3, y + 10);
      y += 16;
    }
  }

  // Final CTA page
  doc.addPage();
  doc.setFillColor(27, 52, 97);
  doc.rect(0, 0, W, 297, "F");
  doc.setTextColor(191, 160, 106);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("ARCREADY · AUDIT. RISK. COMPLIANCE.", W / 2, 80, { align: "center" });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("Ready to act on these findings?", W / 2, 110, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  const ctaText = doc.splitTextToSize("Book a free 30-minute consultation with Michael Mokadi CA(SA) to walk through your results and build a prioritised remediation roadmap.", 140);
  ctaText.forEach((line, i) => doc.text(line, W / 2, 126 + i * 7, { align: "center" }));
  doc.setFillColor(164, 132, 74);
  doc.roundedRect(W / 2 - 40, 155, 80, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("www.arcready.co.za", W / 2, 164, { align: "center" });
  doc.setTextColor(191, 160, 106);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("hello@arcready.co.za", W / 2, 185, { align: "center" });
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('"Know where you stand before they arrive."', W / 2, 260, { align: "center" });

  doc.save(`ARCReady_Assessment_${profile.company.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─── Status helpers ───────────────────────────────────────────────────────────
function statusStyle(status) {
  const map = {
    "Compliant":     { bg: "#dcfce7", color: "#166534" },
    "Met":           { bg: "#dcfce7", color: "#166534" },
    "Partial":       { bg: "#fef3c7", color: "#92400e" },
    "Non-Compliant": { bg: "#fee2e2", color: "#991b1b" },
    "Not Met":       { bg: "#fee2e2", color: "#991b1b" },
    "Not Assessed":  { bg: "#f3f4f6", color: "#374151" },
  };
  return map[status] || map["Not Assessed"];
}

function priorityStyle(priority) {
  const map = {
    "Critical": { bg: "#fecdd3", color: "#9f1239" },
    "High":     { bg: "#fee2e2", color: "#991b1b" },
    "Medium":   { bg: "#fef3c7", color: "#92400e" },
    "Low":      { bg: "#dcfce7", color: "#166534" },
  };
  return map[priority] || map["Low"];
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 72 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = ((score || 0) / 100) * circ;
  const color = score >= 70 ? "#166534" : score >= 40 ? "#92400e" : "#991b1b";
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="7"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="central"
        fontSize="13" fontWeight="700" fill={color}>{score || 0}</text>
    </svg>
  );
}

// ─── Recommendations Tracker ──────────────────────────────────────────────────
function RecommendationsTracker({ findings }) {
  const [rows, setRows] = useState(() =>
    findings.map(f => ({ ...f, owner: "", dueDate: "", evidenceNote: "", trackerStatus: "Open" }))
  );
  const update = (i, field, value) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: ROYAL_BLUE, marginBottom: 8 }}>Recommendations Tracker</h3>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>
        Assign owners, set due dates, and track evidence for each finding.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: ROYAL_BLUE, color: "#fff" }}>
              {["Control","Priority","Recommendation","Owner","Due Date","Evidence","Status"].map(h => (
                <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 500, whiteSpace: "nowrap", fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const p = priorityStyle(row.priority);
              return (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "7px 10px", fontWeight: 600, color: ROYAL_BLUE, whiteSpace: "nowrap", fontSize: 11 }}>{row.controlId}</td>
                  <td style={{ padding: "7px 10px" }}>
                    <span style={{ background: p.bg, color: p.color, padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{row.priority}</span>
                  </td>
                  <td style={{ padding: "7px 10px", color: "#374151", maxWidth: 200, fontSize: 11 }}>{row.recommendation}</td>
                  <td style={{ padding: "7px 4px" }}>
                    <input value={row.owner} onChange={e => update(i, "owner", e.target.value)} placeholder="Assign…"
                      style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "3px 7px", fontSize: 11, width: 90 }}/>
                  </td>
                  <td style={{ padding: "7px 4px" }}>
                    <input type="date" value={row.dueDate} onChange={e => update(i, "dueDate", e.target.value)}
                      style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "3px 6px", fontSize: 11, width: 115 }}/>
                  </td>
                  <td style={{ padding: "7px 4px" }}>
                    <input value={row.evidenceNote} onChange={e => update(i, "evidenceNote", e.target.value)} placeholder="Evidence…"
                      style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "3px 7px", fontSize: 11, width: 130 }}/>
                  </td>
                  <td style={{ padding: "7px 4px" }}>
                    <select value={row.trackerStatus} onChange={e => update(i, "trackerStatus", e.target.value)}
                      style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "3px 6px", fontSize: 11,
                        color: row.trackerStatus === "Closed" ? "#166534" : row.trackerStatus === "In Progress" ? "#92400e" : "#374151" }}>
                      {["Open","In Progress","Evidence Collected","Closed"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────
function ReportCard({ report, framework }) {
  const [expanded, setExpanded] = useState(null);
  const [showTracker, setShowTracker] = useState(false);
  const findings = report.findings || [];
  const critical = findings.filter(f => f.priority === "Critical").length;
  const high     = findings.filter(f => f.priority === "High").length;
  const compliant = findings.filter(f => ["Compliant","Met"].includes(f.status)).length;
  const rColor = { "High Risk":"#991b1b","Medium Risk":"#92400e","Low Risk":"#166534" }[report.overallRating] || "#374151";

  return (
    <div style={{ background: "#fff", border: "1px solid #e8dfd0", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
      <div style={{ background: ROYAL_BLUE, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14 }}>
        <ScoreRing score={report.overallScore}/>
        <div style={{ flex: 1 }}>
          <div style={{ color: GOLD_LIGHT, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>
            {report.frameworkName}
          </div>
          <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginBottom: 5 }}>Gap Analysis Report</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ background: rColor, color: "#fff", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{report.overallRating}</span>
            {report.maturityLevel && <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "2px 10px", borderRadius: 20, fontSize: 10 }}>{report.maturityLevel}</span>}
            {critical > 0 && <span style={{ background: "#fecdd3", color: "#9f1239", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{critical} Critical</span>}
            {high > 0 && <span style={{ background: "#fee2e2", color: "#991b1b", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{high} High</span>}
            <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{compliant} Compliant</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 22px" }}>
        {/* Executive summary */}
        <div style={{ background: OFF_WHITE, borderLeft: `4px solid ${MATTE_GOLD}`, padding: "12px 16px", borderRadius: "0 6px 6px 0", marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: MATTE_GOLD, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Executive Summary</div>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, margin: 0 }}>{report.executiveSummary}</p>
        </div>

        {/* Top 5 */}
        {(report.top5Actions||[]).length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ROYAL_BLUE, marginBottom: 8 }}>Top 5 Priority Actions</div>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {(report.top5Actions||[]).map((a,i) => (
                <li key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 5, lineHeight: 1.5 }}>{a}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Findings */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: ROYAL_BLUE, marginBottom: 8 }}>
            Detailed Findings ({findings.length} controls assessed)
          </div>
          {findings.map((f, i) => {
            const sb = statusStyle(f.status);
            const pb = priorityStyle(f.priority);
            const open = expanded === i;
            return (
              <div key={i} style={{ border: "1px solid #e8dfd0", borderRadius: 6, marginBottom: 6, overflow: "hidden" }}>
                <button onClick={() => setExpanded(open ? null : i)}
                  style={{ width: "100%", background: open ? OFF_WHITE : "#fff", border: "none", cursor: "pointer",
                    padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
                  <span style={{ fontWeight: 700, color: ROYAL_BLUE, fontSize: 11, minWidth: 60 }}>{f.controlId}</span>
                  <span style={{ flex: 1, fontSize: 12, color: "#374151", fontWeight: 500 }}>{f.controlName}</span>
                  <span style={{ background: pb.bg, color: pb.color, padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>{f.priority}</span>
                  <span style={{ background: sb.bg, color: sb.color, padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>{f.status}</span>
                  <span style={{ color: "#9ca3af", fontSize: 11 }}>{open ? "▲" : "▼"}</span>
                </button>
                {open && (
                  <div style={{ padding: "0 14px 12px", background: "#fafafa" }}>
                    {f.saPolicyPrinciple && (
                      <div style={{ margin: "8px 0", padding: "5px 10px", background: "#eff6ff", borderRadius: 4, fontSize: 11, color: "#1e40af" }}>
                        <strong>SA AI Policy:</strong> {f.saPolicyPrinciple}
                      </div>
                    )}
                    {f.regulatoryRisk && (
                      <div style={{ margin: "6px 0", padding: "5px 10px", background: "#fff7ed", borderRadius: 4, fontSize: 11, color: "#92400e" }}>
                        <strong>Regulatory risk:</strong> {f.regulatoryRisk}
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                      {[
                        ["Gap", f.gapDescription],
                        ["Evidence Required", f.evidenceRequired],
                        ["Recommendation", f.recommendation],
                        ["Estimated Effort", f.estimatedEffort],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
                          <p style={{ fontSize: 12, color: "#374151", margin: 0, lineHeight: 1.5 }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {report.estimatedRemediationTimeline && (
          <div style={{ background: "#eff6ff", border: "1px solid #bae6fd", borderRadius: 6, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: "#0369a1" }}>
            <strong>Estimated timeline to baseline compliance:</strong> {report.estimatedRemediationTimeline}
          </div>
        )}

        <button onClick={() => setShowTracker(s => !s)}
          style={{ background: showTracker ? "#f3f4f6" : ROYAL_BLUE, color: showTracker ? ROYAL_BLUE : "#fff",
            border: `1px solid ${ROYAL_BLUE}`, borderRadius: 6, padding: "9px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {showTracker ? "Hide Tracker" : "Open Recommendations Tracker →"}
        </button>
        {showTracker && findings.length > 0 && <RecommendationsTracker findings={findings}/>}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AssessmentTool() {
  const [step, setStep]             = useState(0);
  const [selectedFWs, setSFWs]      = useState([]);
  const [currentFW, setCurrentFW]   = useState(0);
  const [answers, setAnswers]       = useState({});
  const [profile, setProfile]       = useState({ name:"", company:"", email:"", phone:"", industry:"", size:"" });
  const [profileErrors, setPE]      = useState({});
  const [reports, setReports]       = useState({});
  const [loadingMsg, setLoadingMsg] = useState("");
  const [loadingErrors, setLErrors] = useState([]);
  const [activeReport, setAR]       = useState(null);
  const [pdfGenerating, setPDF]     = useState(false);
  const topRef = useRef(null);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth" });

  function toggleFW(id) { setSFWs(p => p.includes(id) ? p.filter(f => f !== id) : [...p, id]); }
  function setAnswer(fwId, qId, val) { setAnswers(p => ({ ...p, [fwId]: { ...(p[fwId]||{}), [qId]: val } })); }

  function validateProfile() {
    const e = {};
    if (!profile.name.trim()) e.name = "Required";
    if (!profile.company.trim()) e.company = "Required";
    if (!profile.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) e.email = "Valid email required";
    if (!profile.industry) e.industry = "Required";
    if (!profile.size) e.size = "Required";
    setPE(e);
    return Object.keys(e).length === 0;
  }

  async function runAssessment() {
    setStep(3);
    scrollTop();
    const completed = {};
    const errors = [];
    setLoadingMsg(`Starting assessment across ${selectedFWs.length} framework${selectedFWs.length>1?"s":""}…`);

    await Promise.all(selectedFWs.map(async (fwId) => {
      const fw = FRAMEWORKS.find(f => f.id === fwId);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 58000);

        const res = await fetch("/api/assess", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frameworkId: fwId,
            framework: {
              name: fw.name,
              questions: fw.questions,
            },
            profile,
            answers: answers[fwId] || {},
          }),
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          console.error(`${fw.name} API error:`, errData);
          errors.push(`${fw.name}: ${errData.error || `HTTP ${res.status}`}`);
          completed[fwId] = null;
          return;
        }

        const data = await res.json();
        if (data.report) {
          completed[fwId] = data.report;
        } else {
          errors.push(`${fw.name}: No report returned`);
          completed[fwId] = null;
        }

      } catch (err) {
        if (err.name === "AbortError") {
          errors.push(`${fw.name}: Timed out after 58 seconds`);
        } else {
          errors.push(`${fw.name}: ${err.message}`);
        }
        completed[fwId] = null;
      }

      const doneCount = Object.values(completed).filter(v => v !== undefined).length;
      setLoadingMsg(`${doneCount} of ${selectedFWs.length} framework${selectedFWs.length>1?"s":""} complete…`);
    }));

    if (errors.length > 0) setLErrors(errors);

    const successReports = Object.fromEntries(Object.entries(completed).filter(([,v]) => v !== null));
    setReports(successReports);
    const firstSuccess = selectedFWs.find(id => successReports[id]);
    setAR(firstSuccess || selectedFWs[0]);
    setStep(4);
    scrollTop();
  }

  const activeFWData = FRAMEWORKS.find(f => f.id === selectedFWs[currentFW]);
  const activeAnswers = answers[selectedFWs[currentFW]] || {};
  const allAnswered = activeFWData ? activeFWData.questions.every(q => activeAnswers[q.id]) : false;
  const isLastFW = currentFW === selectedFWs.length - 1;

  // ── Step 0: Framework selector ─────────────────────────────────────────────
  if (step === 0) return (
    <div ref={topRef} style={{ fontFamily:"'Inter',sans-serif", maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ display:"inline-block", background: MATTE_GOLD, color:"#fff", fontSize:10, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", padding:"4px 16px", borderRadius:20, marginBottom:12 }}>
          Free Assessment
        </div>
        <h1 style={{ fontFamily:"'Montserrat',sans-serif", fontSize: 28, fontWeight: 900, color: ROYAL_BLUE, margin:"0 0 10px", textTransform:"uppercase" }}>
          Know where you stand before they arrive.
        </h1>
        <p style={{ fontSize: 15, color: "#5C6070", maxWidth: 560, margin: "0 auto", fontFamily:"'Georgia',serif", fontStyle:"italic" }}>
          Select the frameworks relevant to your organisation. Answer 12 targeted questions per framework and receive a free, AI-powered, audit-grade gap analysis.
        </p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px,1fr))", gap:14, marginBottom:28 }}>
        {FRAMEWORKS.map(fw => {
          const sel = selectedFWs.includes(fw.id);
          return (
            <button key={fw.id} onClick={() => toggleFW(fw.id)}
              style={{ background: sel ? ROYAL_BLUE : "#fff", color: sel ? "#fff" : "#374151",
                border: sel ? `2px solid ${ROYAL_BLUE}` : "2px solid #E8DFD0",
                borderRadius: 8, padding:"16px 18px", cursor:"pointer", textAlign:"left",
                transition:"all 0.15s", boxShadow: sel ? "0 4px 12px rgba(27,52,97,0.2)" : "0 1px 3px rgba(0,0,0,0.06)" }}>
              <img src={fw.icon} alt={fw.name} style={{ width:44, height:44, objectFit:"cover", borderRadius:6, marginBottom:8 }}/>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:2, fontFamily:"'Montserrat',sans-serif" }}>{fw.name}</div>
              <div style={{ fontSize:11, opacity: sel ? 0.8 : 0.55 }}>{fw.subtitle}</div>
              <div style={{ fontSize:10, opacity: sel ? 0.7 : 0.45, marginTop:4 }}>{fw.description}</div>
            </button>
          );
        })}
      </div>
      {selectedFWs.length > 0 && (
        <div style={{ textAlign:"center" }}>
          <button onClick={() => { setStep(1); scrollTop(); }}
            style={{ background: ROYAL_BLUE, color:"#fff", border:"none", borderRadius:6, padding:"13px 36px", fontSize:14, fontWeight:700, cursor:"pointer", letterSpacing:"0.05em" }}>
            Continue with {selectedFWs.length} framework{selectedFWs.length>1?"s":""} →
          </button>
        </div>
      )}
    </div>
  );

  // ── Step 1: Profile ─────────────────────────────────────────────────────────
  if (step === 1) {
    const field = (label, key, type="text", opts=null, req=true) => (
      <div style={{ marginBottom:16 }}>
        <label style={{ display:"block", fontSize:10, fontWeight:700, color: ROYAL_BLUE, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:6 }}>
          {label}{req && <span style={{ color:"#ef4444" }}> *</span>}
        </label>
        {opts ? (
          <select value={profile[key]} onChange={e => setProfile(p => ({...p, [key]: e.target.value}))}
            style={{ width:"100%", padding:"10px 12px", border:`1px solid ${profileErrors[key]?"#ef4444":"#E8DFD0"}`, borderRadius:4, fontSize:13, color: profile[key]?"#0E1A26":"#9ca3af", background:"#fff" }}>
            <option value="">Select…</option>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} value={profile[key]} onChange={e => setProfile(p => ({...p, [key]: e.target.value}))}
            style={{ width:"100%", padding:"10px 12px", border:`1px solid ${profileErrors[key]?"#ef4444":"#E8DFD0"}`, borderRadius:4, fontSize:13, boxSizing:"border-box" }}/>
        )}
        {profileErrors[key] && <div style={{ fontSize:11, color:"#ef4444", marginTop:3 }}>{profileErrors[key]}</div>}
      </div>
    );
    return (
      <div ref={topRef} style={{ fontFamily:"'Inter',sans-serif", maxWidth: 560, margin:"0 auto", padding:"40px 20px" }}>
        <button onClick={() => setStep(0)} style={{ background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:12, marginBottom:20 }}>← Back</button>
        <h2 style={{ fontFamily:"'Montserrat',sans-serif", fontSize:20, fontWeight:900, color: ROYAL_BLUE, textTransform:"uppercase", marginBottom:6 }}>Your Organisation</h2>
        <p style={{ fontSize:13, color:"#5C6070", marginBottom:24, fontFamily:"'Georgia',serif", fontStyle:"italic" }}>
          Your report will be generated immediately on screen and emailed to you for your records.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <div>{field("Your name", "name")}</div>
          <div>{field("Company name", "company")}</div>
        </div>
        {field("Work email", "email", "email")}
        {field("Phone number", "phone", "tel", null, false)}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <div>{field("Industry", "industry", "text", INDUSTRY_OPTIONS)}</div>
          <div>{field("Company size", "size", "text", SIZE_OPTIONS)}</div>
        </div>
        <div style={{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:4, padding:"10px 14px", fontSize:11, color:"#0369A1", marginBottom:20 }}>
          🔒 Your information is used solely to generate and deliver your assessment report. We do not sell or share your data.
        </div>
        <button onClick={() => { if (validateProfile()) { setStep(2); scrollTop(); } }}
          style={{ width:"100%", background: ROYAL_BLUE, color:"#fff", border:"none", borderRadius:6, padding:"13px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
          Start Assessment →
        </button>
      </div>
    );
  }

  // ── Step 2: Questions ───────────────────────────────────────────────────────
  if (step === 2 && activeFWData) {
    const progress = Math.round((Object.keys(activeAnswers).length / activeFWData.questions.length) * 100);
    return (
      <div ref={topRef} style={{ fontFamily:"'Inter',sans-serif", maxWidth: 720, margin:"0 auto", padding:"32px 20px" }}>
        <button onClick={() => currentFW === 0 ? setStep(1) : setCurrentFW(c => c-1)}
          style={{ background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:12, marginBottom:16 }}>← Back</button>
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          {selectedFWs.map((fwId,i) => {
            const fw = FRAMEWORKS.find(f => f.id === fwId);
            const done = i < currentFW;
            const active = i === currentFW;
            return (
              <span key={fwId} style={{ padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:600,
                background: done?"#dcfce7":active?ROYAL_BLUE:"#f3f4f6",
                color: done?"#166534":active?"#fff":"#9ca3af" }}>
                {done ? "✓ " : ""}{fw.name}
              </span>
            );
          })}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <img src={activeFWData.icon} alt={activeFWData.name} style={{ width:36, height:36, objectFit:"cover", borderRadius:4 }}/>
          <div>
            <h2 style={{ fontFamily:"'Montserrat',sans-serif", fontSize:18, fontWeight:900, color: ROYAL_BLUE, margin:0, textTransform:"uppercase" }}>{activeFWData.name}</h2>
            <div style={{ fontSize:12, color:"#5C6070" }}>{activeFWData.description}</div>
          </div>
        </div>
        <div style={{ height:4, background:"#E8DFD0", borderRadius:2, marginBottom:24 }}>
          <div style={{ height:"100%", background: MATTE_GOLD, borderRadius:2, width:`${progress}%`, transition:"width 0.3s" }}/>
        </div>
        {activeFWData.questions.map((q, qi) => (
          <div key={q.id} style={{ marginBottom:18, padding:"16px 18px", background:"#fff", border:"1px solid #E8DFD0", borderRadius:8 }}>
            <div style={{ fontSize:13, color:"#2C3240", fontWeight:500, marginBottom:12, lineHeight:1.6 }}>
              <span style={{ color: MATTE_GOLD, fontWeight:700 }}>Q{qi+1}. </span>{q.text}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
              {ANSWER_OPTIONS.map(opt => {
                const sel = activeAnswers[q.id] === opt.value;
                return (
                  <button key={opt.value} onClick={() => setAnswer(selectedFWs[currentFW], q.id, opt.value)}
                    style={{ background: sel?opt.bg:"#F8F5F0", color: sel?opt.color:"#374151",
                      border: sel?`2px solid ${opt.color}`:"2px solid #E8DFD0",
                      borderRadius:6, padding:"8px 12px", cursor:"pointer", fontSize:12,
                      fontWeight: sel?700:400, textAlign:"left", transition:"all 0.1s" }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <button onClick={() => {
          if (!allAnswered) return;
          if (isLastFW) { runAssessment(); }
          else { setCurrentFW(c => c+1); scrollTop(); }
        }}
          disabled={!allAnswered}
          style={{ width:"100%", background: allAnswered?ROYAL_BLUE:"#E8DFD0", color: allAnswered?"#fff":"#9ca3af",
            border:"none", borderRadius:6, padding:"13px", fontSize:14, fontWeight:700, cursor: allAnswered?"pointer":"not-allowed" }}>
          {isLastFW ? "Generate My Report →" : `Next: ${FRAMEWORKS.find(f=>f.id===selectedFWs[currentFW+1])?.name} →`}
        </button>
      </div>
    );
  }

  // ── Step 3: Loading ─────────────────────────────────────────────────────────
  if (step === 3) {
    const doneCount = parseInt(loadingMsg?.match(/^(\d+) of/)?.[1]||"0");
    const total = selectedFWs.length;
    const pct = total > 0 ? Math.round((doneCount/total)*100) : 5;
    return (
      <div ref={topRef} style={{ fontFamily:"'Inter',sans-serif", maxWidth:560, margin:"0 auto", padding:"80px 20px", textAlign:"center" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width:56, height:56, border:"4px solid #E8DFD0", borderTop:`4px solid ${ROYAL_BLUE}`,
          borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 24px" }}/>
        <h2 style={{ fontFamily:"'Montserrat',sans-serif", fontSize:18, fontWeight:900, color: ROYAL_BLUE, textTransform:"uppercase", marginBottom:8 }}>
          Analysing Your Controls
        </h2>
        <p style={{ fontSize:13, color:"#5C6070", marginBottom:24 }}>{loadingMsg}</p>
        <div style={{ background:"#E8DFD0", borderRadius:4, height:6, marginBottom:20, overflow:"hidden" }}>
          <div style={{ height:"100%", background: ROYAL_BLUE, borderRadius:4, width:`${pct}%`, transition:"width 0.5s ease" }}/>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", marginBottom:24 }}>
          {selectedFWs.map((fwId,i) => {
            const fw = FRAMEWORKS.find(f=>f.id===fwId);
            const done = i < doneCount;
            return (
              <span key={fwId} style={{ padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:600,
                background: done?"#dcfce7":"#f3f4f6", color: done?"#166534":"#9ca3af",
                border:`1px solid ${done?"#bbf7d0":"#e5e7eb"}` }}>
                {done?"✓ ":""}{fw?.name}
              </span>
            );
          })}
        </div>
        <p style={{ fontSize:11, color:"#9ca3af", fontStyle:"italic" }}>
          Your responses are being assessed against audit-grade framework controls by AI sub-agents.<br/>
          {total > 2 ? `With ${total} frameworks this takes about 30–45 seconds.` : "This takes about 20–30 seconds."}
        </p>
      </div>
    );
  }

  // ── Step 4: Results ─────────────────────────────────────────────────────────
  if (step === 4) {
    const activeReportData = reports[activeReport];
    return (
      <div ref={topRef} style={{ fontFamily:"'Inter',sans-serif", maxWidth:880, margin:"0 auto", padding:"24px 20px" }}>
        {/* Header */}
        <div style={{ background: ROYAL_BLUE, borderRadius:10, padding:"22px 26px", marginBottom:20,
          display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
          <div>
            <div style={{ color: GOLD_LIGHT, fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:5 }}>
              ARCReady Assessment Complete
            </div>
            <div style={{ color:"#fff", fontSize:20, fontWeight:800, marginBottom:4 }}>
              {profile.company} — Control Self-Assessment
            </div>
            <div style={{ color:"rgba(255,255,255,0.55)", fontSize:12 }}>
              {new Date().toLocaleDateString("en-ZA",{day:"numeric",month:"long",year:"numeric"})} · {selectedFWs.length} framework{selectedFWs.length>1?"s":""} assessed
            </div>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button onClick={() => window.print()}
              style={{ background:"rgba(255,255,255,0.1)", color:"#fff", border:"1px solid rgba(255,255,255,0.25)",
                borderRadius:6, padding:"8px 16px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
              Print / Save PDF
            </button>
            <button
              onClick={async () => {
                setPDF(true);
                try { await generatePDF(profile, reports, selectedFWs); }
                catch(e) { console.error("PDF error:", e); alert("PDF generation failed. Please use Print / Save PDF instead."); }
                finally { setPDF(false); }
              }}
              disabled={pdfGenerating}
              style={{ background: MATTE_GOLD, color:"#fff", border:"none",
                borderRadius:6, padding:"8px 16px", fontSize:12, fontWeight:700, cursor: pdfGenerating?"not-allowed":"pointer", opacity: pdfGenerating?0.7:1 }}>
              {pdfGenerating ? "Generating…" : "⬇ Download PDF Report"}
            </button>
          </div>
        </div>

        {/* Error notice */}
        {loadingErrors.length > 0 && (
          <div style={{ background:"#fef3c7", border:"1px solid #fcd34d", borderRadius:6, padding:"12px 16px", marginBottom:16, fontSize:12, color:"#92400e" }}>
            <strong>Note:</strong> Some frameworks could not be assessed:
            <ul style={{ margin:"6px 0 0 16px" }}>{loadingErrors.map((e,i) => <li key={i}>{e}</li>)}</ul>
            Please check that your Anthropic API key is correctly set in Vercel Environment Variables (Settings → Environment Variables → ANTHROPIC_API_KEY).
          </div>
        )}

        {/* Booking CTA */}
        <div style={{ background:"#fff8ec", border:`2px solid ${MATTE_GOLD}`, borderRadius:8, padding:"18px 22px", marginBottom:20,
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color: ROYAL_BLUE, marginBottom:4, fontFamily:"'Montserrat',sans-serif" }}>
              Ready to turn these findings into action?
            </div>
            <div style={{ fontSize:12, color:"#5C6070", maxWidth:480 }}>
              Book a free 30-minute consultation with Michael Mokadi CA(SA) to walk through your results and build a prioritised remediation roadmap.
            </div>
          </div>
          <a href="https://www.arcready.co.za/#contact"
            style={{ background: MATTE_GOLD, color:"#fff", textDecoration:"none", borderRadius:6, padding:"11px 22px",
              fontSize:12, fontWeight:700, whiteSpace:"nowrap", display:"inline-block", letterSpacing:"0.05em" }}>
            Book Free Consultation →
          </a>
        </div>

        {/* Framework tabs */}
        {selectedFWs.length > 1 && (
          <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
            {selectedFWs.map(fwId => {
              const fw = FRAMEWORKS.find(f=>f.id===fwId);
              const r = reports[fwId];
              const active = activeReport === fwId;
              const rColor = {
                "High Risk":"#991b1b","Medium Risk":"#92400e","Low Risk":"#166534"
              }[r?.overallRating]||"#374151";
              return (
                <button key={fwId} onClick={() => setAR(fwId)}
                  style={{ background: active?ROYAL_BLUE:"#fff", color: active?"#fff":"#374151",
                    border:`2px solid ${active?ROYAL_BLUE:"#E8DFD0"}`, borderRadius:8,
                    padding:"7px 14px", cursor:"pointer", fontSize:12, fontWeight:600,
                    display:"flex", alignItems:"center", gap:6, opacity: r?1:0.5 }}>
                  <img src={fw?.icon} alt={fw?.name} style={{ width:20, height:20, objectFit:"cover", borderRadius:3 }}/> {fw?.name}
                  {r && (
                    <span style={{ background: active?"rgba(255,255,255,0.2)":rColor+"22",
                      color: active?"#fff":rColor, padding:"1px 6px", borderRadius:4, fontSize:10 }}>
                      {r.overallScore}
                    </span>
                  )}
                  {!r && <span style={{ fontSize:10, color:"#9ca3af" }}>(failed)</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Report */}
        {activeReportData ? (
          <ReportCard report={activeReportData} framework={FRAMEWORKS.find(f=>f.id===activeReport)}/>
        ) : (
          <div style={{ background:"#fff", border:"1px solid #E8DFD0", borderRadius:8, padding:"32px", textAlign:"center" }}>
            <div style={{ fontSize:14, color:"#5C6070" }}>
              Assessment for this framework could not be completed.<br/>
              <span style={{ fontSize:12, color:"#9ca3af" }}>Please check your API key configuration and try again.</span>
            </div>
          </div>
        )}

        {/* Next step */}
        {activeReportData?.nextStep && (
          <div style={{ background: OFF_WHITE, border:`1px solid ${MATTE_GOLD}44`, borderRadius:8,
            padding:"14px 18px", display:"flex", gap:10, alignItems:"flex-start", marginTop:8 }}>
            <span style={{ fontSize:18 }}>💡</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color: ROYAL_BLUE, marginBottom:3 }}>ARCReady recommends</div>
              <div style={{ fontSize:13, color:"#374151" }}>{activeReportData.nextStep}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}