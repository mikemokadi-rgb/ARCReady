/**
 * ARCReady Control Self-Assessment Tool
 * Drop into your existing Vite + React project.
 *
 * Required env vars (Vite):
 *   VITE_ANTHROPIC_API_KEY   — your Anthropic API key
 *   VITE_SUPABASE_URL        — your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY   — your Supabase anon key
 *   VITE_RESEND_API_KEY      — your Resend API key (used server-side via Vercel Function)
 *
 * Supabase table required:
 *   assessment_leads (
 *     id uuid default gen_random_uuid() primary key,
 *     created_at timestamptz default now(),
 *     name text, company text, email text, phone text,
 *     industry text, size text, frameworks text[],
 *     answers jsonb, report jsonb
 *   )
 *
 * For production: move the Anthropic API call to a Vercel serverless
 * function at /api/assess.js to protect your API key.
 * The component below calls /api/assess in production and falls back
 * to direct API in dev — swap VITE_ANTHROPIC_API_KEY accordingly.
 */

import { useState, useRef } from "react";

// ─── ARCReady brand colours ───────────────────────────────────────────────────
const ROYAL_BLUE  = "#1B3A6B";
const MATTE_GOLD  = "#B8963E";
const LIGHT_GOLD  = "#D4AF6A";
const NAVY_LIGHT  = "#2A4F8A";
const OFF_WHITE   = "#F8F6F1";
const WARM_WHITE  = "#FDFCFA";

// ─── Framework definitions ────────────────────────────────────────────────────
const FRAMEWORKS = [
  {
    id: "iso27001",
    name: "ISO 27001",
    subtitle: "Information Security Management",
    icon: "🔒",
    color: "#1B3A6B",
    description: "ISMS gap analysis against ISO 27001:2022 Annex A controls",
    questions: [
      { id: "q1",  text: "Do you have a formally documented Information Security Policy, signed by senior management and reviewed annually?" },
      { id: "q2",  text: "Is there a maintained asset inventory with designated owners for all information assets?" },
      { id: "q3",  text: "Are formal user access reviews conducted at least every 6 months with documented evidence?" },
      { id: "q4",  text: "Do supplier/vendor contracts include information security clauses and regular reviews?" },
      { id: "q5",  text: "Is there a documented, tested Incident Response procedure with defined escalation paths?" },
      { id: "q6",  text: "Has a formal risk assessment been completed in the last 12 months with a documented risk treatment plan?" },
      { id: "q7",  text: "Is a patch management schedule in place with tracked remediation timelines?" },
      { id: "q8",  text: "Is there a documented cryptography / encryption policy applied consistently across systems?" },
      { id: "q9",  text: "Does a formal security awareness training programme exist beyond onboarding?" },
      { id: "q10", text: "Is there a documented and tested Business Continuity / Disaster Recovery plan?" },
      { id: "q11", text: "Is change management formally documented with approvals, testing, and rollback procedures?" },
      { id: "q12", text: "Are physical security controls at server rooms / data centres documented and audited?" },
    ],
  },
  {
    id: "iso42001",
    name: "ISO 42001",
    subtitle: "AI Management Systems",
    icon: "🤖",
    color: "#2A4F8A",
    description: "AI governance readiness mapped to ISO 42001:2023 AIMS controls",
    questions: [
      { id: "q1",  text: "Does your organisation have a documented AI Policy approved by senior leadership?" },
      { id: "q2",  text: "Is there a formal AI risk assessment process covering bias, transparency, and safety before deployment?" },
      { id: "q3",  text: "Are AI systems subject to an impact assessment before production use?" },
      { id: "q4",  text: "Is there documented human oversight and intervention capability for all AI decision systems?" },
      { id: "q5",  text: "Do AI systems have documented data governance processes covering training data quality and lineage?" },
      { id: "q6",  text: "Is there a defined AI incident response process with escalation to the board or risk committee?" },
      { id: "q7",  text: "Are AI system outputs subject to regular accuracy and fairness monitoring?" },
      { id: "q8",  text: "Is there a documented Responsible AI framework or ethics policy in place?" },
      { id: "q9",  text: "Are AI suppliers and third-party AI tools subject to formal due diligence and contractual AI governance clauses?" },
      { id: "q10", text: "Is there a process to keep AI systems current with applicable regulations (e.g. SA AI Policy, EU AI Act)?" },
      { id: "q11", text: "Are staff who interact with AI systems provided with documented training on responsible use?" },
      { id: "q12", text: "Is there a process for documenting and reviewing AI system retirement and lifecycle decisions?" },
    ],
  },
  {
    id: "nist-csf",
    name: "NIST CSF 2.0",
    subtitle: "Cybersecurity Framework",
    icon: "🛡️",
    color: "#1a5c3a",
    description: "Cybersecurity posture mapped to NIST CSF 2.0 six functions",
    questions: [
      { id: "q1",  text: "Is there a documented cybersecurity governance structure with defined roles, policies, and board-level oversight? (GOVERN)" },
      { id: "q2",  text: "Has a current asset inventory been completed covering hardware, software, data, and external systems? (IDENTIFY)" },
      { id: "q3",  text: "Has a formal cybersecurity risk assessment been completed and documented in the last 12 months? (IDENTIFY)" },
      { id: "q4",  text: "Is multi-factor authentication enforced for all privileged and remote access? (PROTECT)" },
      { id: "q5",  text: "Are network segmentation and access controls in place and documented? (PROTECT)" },
      { id: "q6",  text: "Is security awareness training mandatory and tracked for all staff annually? (PROTECT)" },
      { id: "q7",  text: "Is there a SIEM, log management, or similar continuous monitoring capability in place? (DETECT)" },
      { id: "q8",  text: "Are anomaly detection and alerting thresholds defined and regularly reviewed? (DETECT)" },
      { id: "q9",  text: "Is there a documented and tested Incident Response Plan with defined recovery time objectives? (RESPOND)" },
      { id: "q10", text: "Are post-incident reviews conducted and lessons learned formally documented? (RESPOND)" },
      { id: "q11", text: "Is there a documented and tested Business Continuity / Disaster Recovery plan? (RECOVER)" },
      { id: "q12", text: "Are backup and recovery procedures tested at least annually with documented results? (RECOVER)" },
    ],
  },
  {
    id: "soc2",
    name: "SOC 2",
    subtitle: "Trust Services Criteria",
    icon: "✅",
    color: "#5a2d82",
    description: "SOC 2 Type 1 / Type 2 readiness across all Trust Services Criteria",
    questions: [
      { id: "q1",  text: "Is there a board-approved Information Security policy and a documented control environment? (CC1)" },
      { id: "q2",  text: "Are security policies communicated to all staff and acknowledged in writing? (CC2)" },
      { id: "q3",  text: "Is there a formal risk assessment process with a documented risk register updated at least annually? (CC3)" },
      { id: "q4",  text: "Are internal controls monitored continuously with documented deficiency tracking? (CC4)" },
      { id: "q5",  text: "Are control activities (approvals, reconciliations, authorisations) formally documented and evidenced? (CC5)" },
      { id: "q6",  text: "Is logical and physical access provisioning and de-provisioning formally controlled and reviewed? (CC6)" },
      { id: "q7",  text: "Is there a documented incident response process with a tested disaster recovery capability? (CC7)" },
      { id: "q8",  text: "Is change management formally controlled with approval, testing, and rollback documentation? (CC8)" },
      { id: "q9",  text: "Are third-party vendors subject to documented risk assessments and contractual security requirements? (CC9)" },
      { id: "q10", text: "If Availability is in scope — are uptime SLAs, capacity monitoring, and DR objectives documented? (A1)" },
      { id: "q11", text: "If Confidentiality is in scope — is confidential data classified, encrypted, and subject to retention controls? (C1)" },
      { id: "q12", text: "If Privacy is in scope — are data subject rights, consent management, and breach notification procedures documented? (P1–P8)" },
    ],
  },
  {
    id: "pci-dss",
    name: "PCI DSS",
    subtitle: "Payment Card Security",
    icon: "💳",
    color: "#8B2500",
    description: "PCI DSS v4.0.1 readiness across all 12 requirements",
    questions: [
      { id: "q1",  text: "Is the Cardholder Data Environment (CDE) formally scoped with network diagrams showing all payment data flows? (Req 1–2)" },
      { id: "q2",  text: "Are firewalls and network access controls in place with documented rule reviews at least every 6 months? (Req 1)" },
      { id: "q3",  text: "Is cardholder data (PAN) encrypted at rest and in transit, and is SAD never stored after authorisation? (Req 3–4)" },
      { id: "q4",  text: "Are all CDE systems protected by up-to-date anti-malware and patch management processes? (Req 5–6)" },
      { id: "q5",  text: "Is access to cardholder data restricted on a need-to-know basis with documented access control policies? (Req 7)" },
      { id: "q6",  text: "Are unique IDs assigned to all CDE users and is shared / generic account use prohibited? (Req 8)" },
      { id: "q7",  text: "Is physical access to CDE systems controlled, monitored, and logged? (Req 9)" },
      { id: "q8",  text: "Is logging and monitoring in place for all CDE access with 12 months of log retention? (Req 10)" },
      { id: "q9",  text: "Are network vulnerability scans (ASV) and penetration tests conducted as per PCI DSS schedule? (Req 11)" },
      { id: "q10", text: "Is there a documented Information Security Policy covering all 12 PCI DSS requirements? (Req 12)" },
      { id: "q11", text: "Are all third-party service providers (TPSPs) in the CDE formally listed with compliance status tracked? (Req 12.8)" },
      { id: "q12", text: "Have you completed or identified the applicable SAQ type for your merchant / service provider level?" },
    ],
  },
  {
    id: "gdpr",
    name: "GDPR / POPIA",
    subtitle: "Data Protection & Privacy",
    icon: "🔐",
    color: "#1a4a5c",
    description: "GDPR and POPIA compliance readiness for data protection obligations",
    questions: [
      { id: "q1",  text: "Is there a documented Record of Processing Activities (RoPA) covering all personal data processing operations?" },
      { id: "q2",  text: "Has a lawful basis been identified and documented for each category of personal data processing?" },
      { id: "q3",  text: "Are privacy notices provided to data subjects at the point of collection, covering all required disclosures?" },
      { id: "q4",  text: "Is there a documented and tested Data Breach Response procedure meeting 72-hour notification obligations?" },
      { id: "q5",  text: "Are Data Processing Agreements (DPAs) in place with all third-party processors handling personal data?" },
      { id: "q6",  text: "Is there a process to handle data subject requests (access, deletion, portability) within statutory timeframes?" },
      { id: "q7",  text: "Are Data Protection Impact Assessments (DPIAs) conducted for high-risk processing activities?" },
      { id: "q8",  text: "Is personal data retention enforced with documented schedules and automated deletion where applicable?" },
      { id: "q9",  text: "Are cross-border data transfers (outside SA / EEA) subject to documented transfer mechanisms?" },
      { id: "q10", text: "Is there a designated Information Officer (POPIA) or Data Protection Officer (GDPR) formally appointed?" },
      { id: "q11", text: "Is staff training on data protection obligations mandatory and tracked?" },
      { id: "q12", text: "Are consent management processes in place where consent is the lawful basis, with withdrawal mechanisms?" },
    ],
  },
];

const ANSWER_OPTIONS = [
  { value: "yes",     label: "Yes — fully in place",        color: "#166534", bg: "#dcfce7" },
  { value: "partial", label: "Partial — some gaps exist",   color: "#92400e", bg: "#fef3c7" },
  { value: "no",      label: "No — not implemented",        color: "#991b1b", bg: "#fee2e2" },
  { value: "unsure",  label: "Unsure / not assessed",       color: "#374151", bg: "#f3f4f6" },
];

const INDUSTRY_OPTIONS = [
  "Mining & Resources", "Financial Services", "Banking", "Insurance",
  "Retail", "Manufacturing", "Healthcare", "Technology", "Government",
  "Professional Services", "Energy & Utilities", "Other",
];

const SIZE_OPTIONS = [
  "1–50 employees", "51–200 employees", "201–500 employees",
  "501–1,000 employees", "1,000+ employees",
];

// ─── System prompts per framework ─────────────────────────────────────────────
function buildSystemPrompt(frameworkId) {
  const prompts = {
    iso27001: `You are an expert ISO 27001:2022 Lead Auditor and ISMS implementation consultant at ARCReady, a Johannesburg-based GRC advisory firm. You are assessing a JSE-listed or similar regulated company.

Produce a gap analysis in valid JSON only. No prose outside the JSON object.

Return exactly this structure:
{
  "frameworkName": "ISO 27001:2022",
  "executiveSummary": "3-4 sentence summary of overall posture",
  "overallRating": "High Risk | Medium Risk | Low Risk",
  "overallScore": <number 0-100>,
  "findings": [
    {
      "controlId": "e.g. A.5.1",
      "controlName": "Short control name",
      "status": "Compliant | Partial | Non-Compliant | Not Assessed",
      "priority": "Critical | High | Medium | Low",
      "gapDescription": "What is missing or insufficient",
      "evidenceRequired": "Specific evidence needed to close the gap",
      "recommendation": "Concrete remediation action",
      "estimatedEffort": "Days | Weeks | Months"
    }
  ],
  "top5Actions": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"],
  "nextStep": "One sentence on why a consultation with ARCReady is the right next move"
}`,

    iso42001: `You are an expert ISO 42001:2023 AI Management Systems advisor at ARCReady, a Johannesburg-based GRC firm specialising in AI governance for South African listed companies.

Context: South Africa's Cabinet approved a national AI Policy in 2025. Map findings to both ISO 42001:2023 controls and South Africa's AI Policy principles where relevant.

Return exactly this JSON structure, no prose outside it:
{
  "frameworkName": "ISO 42001:2023 — AI Management Systems",
  "executiveSummary": "3-4 sentence summary referencing SA AI Policy alignment",
  "overallRating": "High Risk | Medium Risk | Low Risk",
  "overallScore": <number 0-100>,
  "findings": [
    {
      "controlId": "e.g. A.6.1.2",
      "controlName": "Short control name",
      "saPolicyPrinciple": "SA AI Policy principle this maps to (or N/A)",
      "status": "Compliant | Partial | Non-Compliant | Not Assessed",
      "priority": "Critical | High | Medium | Low",
      "gapDescription": "What is missing",
      "evidenceRequired": "Specific evidence needed",
      "recommendation": "Concrete action",
      "estimatedEffort": "Days | Weeks | Months"
    }
  ],
  "top5Actions": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"],
  "nextStep": "One sentence on why a consultation with ARCReady is the right next move"
}`,

    "nist-csf": `You are an expert NIST CSF 2.0 cybersecurity advisor at ARCReady. Assess posture across all six CSF 2.0 functions: Govern, Identify, Protect, Detect, Respond, Recover.

Return exactly this JSON structure, no prose outside it:
{
  "frameworkName": "NIST Cybersecurity Framework 2.0",
  "executiveSummary": "3-4 sentence summary",
  "overallRating": "High Risk | Medium Risk | Low Risk",
  "overallScore": <number 0-100>,
  "findings": [
    {
      "controlId": "e.g. GV.RM-01",
      "controlName": "Short control name",
      "csfFunction": "Govern | Identify | Protect | Detect | Respond | Recover",
      "status": "Compliant | Partial | Non-Compliant | Not Assessed",
      "priority": "Critical | High | Medium | Low",
      "gapDescription": "What is missing",
      "evidenceRequired": "Specific evidence needed",
      "recommendation": "Concrete action",
      "estimatedEffort": "Days | Weeks | Months"
    }
  ],
  "top5Actions": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"],
  "nextStep": "One sentence on why a consultation with ARCReady is the right next move"
}`,

    soc2: `You are an expert SOC 2 compliance advisor at ARCReady. Assess readiness against AICPA 2017 Trust Services Criteria with 2022 Revised Points of Focus.

Return exactly this JSON structure, no prose outside it:
{
  "frameworkName": "SOC 2 — Trust Services Criteria",
  "executiveSummary": "3-4 sentence summary",
  "overallRating": "High Risk | Medium Risk | Low Risk",
  "overallScore": <number 0-100>,
  "findings": [
    {
      "controlId": "e.g. CC6.1",
      "controlName": "Short criteria name",
      "tscCategory": "Security | Availability | Confidentiality | Processing Integrity | Privacy",
      "status": "Met | Partial | Not Met | Not Assessed",
      "priority": "Critical | High | Medium | Low",
      "gapDescription": "What is missing",
      "evidenceRequired": "Specific evidence needed",
      "recommendation": "Concrete action",
      "estimatedEffort": "Days | Weeks | Months"
    }
  ],
  "top5Actions": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"],
  "nextStep": "One sentence on why a consultation with ARCReady is the right next move"
}`,

    "pci-dss": `You are an expert PCI DSS v4.0.1 compliance advisor at ARCReady. Assess readiness across all 12 PCI DSS requirements.

Return exactly this JSON structure, no prose outside it:
{
  "frameworkName": "PCI DSS v4.0.1",
  "executiveSummary": "3-4 sentence summary",
  "overallRating": "High Risk | Medium Risk | Low Risk",
  "overallScore": <number 0-100>,
  "findings": [
    {
      "controlId": "e.g. Req 3.2",
      "controlName": "Short requirement name",
      "pciRequirement": "Requirement number",
      "status": "Compliant | Partial | Non-Compliant | Not Assessed",
      "priority": "Critical | High | Medium | Low",
      "gapDescription": "What is missing",
      "evidenceRequired": "Specific evidence needed",
      "recommendation": "Concrete action",
      "estimatedEffort": "Days | Weeks | Months"
    }
  ],
  "top5Actions": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"],
  "nextStep": "One sentence on why a consultation with ARCReady is the right next move"
}`,

    gdpr: `You are an expert GDPR and POPIA compliance advisor at ARCReady, a Johannesburg-based GRC firm. Assess data protection readiness against both GDPR and South Africa's POPIA where applicable.

Return exactly this JSON structure, no prose outside it:
{
  "frameworkName": "GDPR / POPIA — Data Protection",
  "executiveSummary": "3-4 sentence summary referencing both GDPR and POPIA obligations",
  "overallRating": "High Risk | Medium Risk | Low Risk",
  "overallScore": <number 0-100>,
  "findings": [
    {
      "controlId": "e.g. Art.30 / POPIA s.69",
      "controlName": "Short obligation name",
      "regulation": "GDPR | POPIA | Both",
      "status": "Compliant | Partial | Non-Compliant | Not Assessed",
      "priority": "Critical | High | Medium | Low",
      "gapDescription": "What is missing",
      "evidenceRequired": "Specific evidence needed",
      "recommendation": "Concrete action",
      "estimatedEffort": "Days | Weeks | Months"
    }
  ],
  "top5Actions": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"],
  "nextStep": "One sentence on why a consultation with ARCReady is the right next move"
}`,
  };
  return prompts[frameworkId] || prompts.iso27001;
}

function buildUserPrompt(framework, profile, answers) {
  const answerLines = framework.questions.map((q, i) => {
    const ans = answers[q.id] || "unsure";
    const label = ANSWER_OPTIONS.find(o => o.value === ans)?.label || ans;
    return `Q${i + 1}: ${q.text}\nAnswer: ${label}`;
  }).join("\n\n");

  return `Client profile:
- Company: ${profile.company}
- Industry: ${profile.industry}
- Size: ${profile.size}
- Framework: ${framework.name}

Control self-assessment responses:
${answerLines}

Produce the gap analysis JSON now. Be specific to the industry context. Flag Critical priority items prominently. All findings must be actionable.`;
}

// ─── Supabase lead save (lightweight fetch, no SDK needed) ────────────────────
function buildRuleBasedReport(framework, profile, answers) {
  const answerWeights = { yes: 100, partial: 60, no: 20, unsure: 40 };
  const answerStatus = {
    yes: "Compliant",
    partial: "Partial",
    no: "Non-Compliant",
    unsure: "Not Assessed",
  };
  const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };

  function getPriority(answer, index) {
    if (answer === "no") return index < 4 ? "Critical" : "High";
    if (answer === "partial") return index < 4 ? "High" : "Medium";
    if (answer === "unsure") return "Medium";
    return "Low";
  }

  function getEffort(answer) {
    if (answer === "no") return "Weeks";
    if (answer === "partial") return "Days";
    if (answer === "unsure") return "Days";
    return "Days";
  }

  function getRecommendation(question, answer) {
    if (answer === "yes") {
      return "Maintain the control, preserve evidence, and keep it in the regular review cycle.";
    }
    if (answer === "partial") {
      return `Formalise, document, and fully evidence this control area: ${question.text}`;
    }
    if (answer === "unsure") {
      return `Confirm control ownership and perform an evidence review for: ${question.text}`;
    }
    return `Design and implement a documented control response for: ${question.text}`;
  }

  const findings = framework.questions
    .map((question, index) => {
      const answer = answers[question.id] || "unsure";
      if (answer === "yes") return null;

      return {
        controlId: `${framework.name} Q${index + 1}`,
        controlName: question.text.replace(/\s*\([^)]*\)\s*$/u, ""),
        status: answerStatus[answer],
        priority: getPriority(answer, index),
        gapDescription:
          answer === "partial"
            ? "This control appears to exist, but the response suggests design, documentation, or operating evidence gaps remain."
            : answer === "unsure"
              ? "The organisation could not confirm whether this control is operating effectively, creating uncertainty against the framework."
              : "This control does not appear to be implemented based on the submitted response.",
        evidenceRequired: `Provide policy, procedure, ownership, and operating evidence for: ${question.text}`,
        recommendation: getRecommendation(question, answer),
        estimatedEffort: getEffort(answer),
      };
    })
    .filter(Boolean);

  const scores = framework.questions.map((question) => {
    const answer = answers[question.id] || "unsure";
    return answerWeights[answer] ?? 40;
  });
  const overallScore = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  const criticalCount = findings.filter(f => f.priority === "Critical").length;
  const highCount = findings.filter(f => f.priority === "High").length;
  const implementedCount = framework.questions.filter((question) => (answers[question.id] || "unsure") === "yes").length;
  const partialCount = framework.questions.filter((question) => (answers[question.id] || "unsure") === "partial").length;

  const overallRating = overallScore >= 75 && criticalCount === 0
    ? "Low Risk"
    : overallScore >= 50 && criticalCount < 2
      ? "Medium Risk"
      : "High Risk";

  const top5Actions = findings
    .slice()
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 5)
    .map(f => f.recommendation);

  return {
    frameworkName: framework.name,
    executiveSummary: `${profile.company} was assessed against ${framework.name} using ${framework.questions.length} control questions. ${implementedCount} controls were confirmed as fully in place, ${partialCount} were partially in place, and ${findings.length - partialCount} were either missing or not evidenced. Based on the submitted responses, the current posture is rated ${overallRating.toLowerCase()} with an overall score of ${overallScore}/100.`,
    overallRating,
    overallScore,
    findings,
    top5Actions,
    nextStep: criticalCount + highCount > 0
      ? "Use this assessment to prioritise remediation, then engage ARCReady to validate evidence and close the highest-risk gaps."
      : "Your responses indicate a stronger control posture; ARCReady can help validate evidence and prepare you for formal review.",
  };
}

async function saveLead(profile, frameworks, answers, reports) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("supabase.com/dashboard")) return;
  await fetch(`${url}/rest/v1/assessment_leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      name: profile.name,
      company: profile.company,
      email: profile.email,
      phone: profile.phone || null,
      industry: profile.industry,
      size: profile.size,
      frameworks,
      answers,
      report: reports,
    }),
  });
}

// ─── Status badge colours ─────────────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    "Compliant":      { bg: "#dcfce7", color: "#166534", label: "Compliant" },
    "Met":            { bg: "#dcfce7", color: "#166534", label: "Met" },
    "Partial":        { bg: "#fef3c7", color: "#92400e", label: "Partial" },
    "Non-Compliant":  { bg: "#fee2e2", color: "#991b1b", label: "Non-Compliant" },
    "Not Met":        { bg: "#fee2e2", color: "#991b1b", label: "Not Met" },
    "Not Assessed":   { bg: "#f3f4f6", color: "#374151", label: "Not Assessed" },
  };
  return map[status] || map["Not Assessed"];
}

function priorityBadge(priority) {
  const map = {
    "Critical": { bg: "#fecdd3", color: "#9f1239" },
    "High":     { bg: "#fee2e2", color: "#991b1b" },
    "Medium":   { bg: "#fef3c7", color: "#92400e" },
    "Low":      { bg: "#dcfce7", color: "#166534" },
  };
  return map[priority] || map["Low"];
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 80 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? "#166534" : score >= 40 ? "#92400e" : "#991b1b";
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="7"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="central"
        fontSize="14" fontWeight="700" fill={color}>{score}</text>
    </svg>
  );
}

// ─── Recommendations Tracker ──────────────────────────────────────────────────
function RecommendationsTracker({ findings }) {
  const [tracker, setTracker] = useState(() =>
    findings.map(f => ({ ...f, owner: "", dueDate: "", evidenceNote: "", trackerStatus: "Open" }))
  );

  function update(i, field, value) {
    setTracker(t => t.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }

  const trackerStatuses = ["Open", "In Progress", "Evidence Collected", "Closed"];

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: ROYAL_BLUE, marginBottom: 12 }}>
        Recommendations Tracker
      </h3>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Assign owners, set due dates, and track evidence collection for each finding.
        Export or screenshot to share with your team.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: ROYAL_BLUE, color: "#fff" }}>
              {["Control", "Priority", "Recommendation", "Owner", "Due Date", "Evidence Note", "Status"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tracker.map((row, i) => {
              const p = priorityBadge(row.priority);
              return (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 500, color: ROYAL_BLUE, whiteSpace: "nowrap" }}>{row.controlId}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ background: p.bg, color: p.color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                      {row.priority}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px", color: "#374151", maxWidth: 220 }}>{row.recommendation}</td>
                  <td style={{ padding: "8px 4px" }}>
                    <input value={row.owner} onChange={e => update(i, "owner", e.target.value)}
                      placeholder="Assign…"
                      style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "4px 8px", fontSize: 12, width: 100 }}/>
                  </td>
                  <td style={{ padding: "8px 4px" }}>
                    <input type="date" value={row.dueDate} onChange={e => update(i, "dueDate", e.target.value)}
                      style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "4px 6px", fontSize: 12, width: 120 }}/>
                  </td>
                  <td style={{ padding: "8px 4px" }}>
                    <input value={row.evidenceNote} onChange={e => update(i, "evidenceNote", e.target.value)}
                      placeholder="Evidence collected…"
                      style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "4px 8px", fontSize: 12, width: 140 }}/>
                  </td>
                  <td style={{ padding: "8px 4px" }}>
                    <select value={row.trackerStatus} onChange={e => update(i, "trackerStatus", e.target.value)}
                      style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "4px 6px", fontSize: 12,
                        color: row.trackerStatus === "Closed" ? "#166534" : row.trackerStatus === "In Progress" ? "#92400e" : "#374151" }}>
                      {trackerStatuses.map(s => <option key={s}>{s}</option>)}
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

// ─── Single framework report card ─────────────────────────────────────────────
function ReportCard({ report }) {
  const [expanded, setExpanded] = useState(null);
  const [showTracker, setShowTracker] = useState(false);

  const findings = report.findings || [];
  const criticalCount  = findings.filter(f => f.priority === "Critical").length;
  const highCount      = findings.filter(f => f.priority === "High").length;
  const compliantCount = findings.filter(f => ["Compliant","Met"].includes(f.status)).length;

  const ratingColor = {
    "High Risk":   "#991b1b",
    "Medium Risk": "#92400e",
    "Low Risk":    "#166534",
  }[report.overallRating] || "#374151";

  return (
    <div style={{ background: "#fff", border: `1px solid #e5e7eb`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
      {/* Report header */}
      <div style={{ background: ROYAL_BLUE, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <ScoreRing score={report.overallScore} size={72}/>
        <div style={{ flex: 1 }}>
          <div style={{ color: LIGHT_GOLD, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
            {report.frameworkName}
          </div>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            Gap Analysis Report
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ background: ratingColor, color: "#fff", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
              {report.overallRating}
            </span>
            {criticalCount > 0 && (
              <span style={{ background: "#fecdd3", color: "#9f1239", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                {criticalCount} Critical
              </span>
            )}
            {highCount > 0 && (
              <span style={{ background: "#fee2e2", color: "#991b1b", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                {highCount} High
              </span>
            )}
            <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
              {compliantCount} Compliant
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Executive summary */}
        <div style={{ background: OFF_WHITE, borderLeft: `4px solid ${MATTE_GOLD}`, padding: "12px 16px", borderRadius: "0 8px 8px 0", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: MATTE_GOLD, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Executive Summary
          </div>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, margin: 0 }}>{report.executiveSummary}</p>
        </div>

        {/* Top 5 actions */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: ROYAL_BLUE, marginBottom: 10 }}>
            Top 5 Priority Actions
          </div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {(report.top5Actions || []).map((action, i) => (
              <li key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 6, lineHeight: 1.5 }}>{action}</li>
            ))}
          </ol>
        </div>

        {/* Findings table */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: ROYAL_BLUE, marginBottom: 10 }}>
            Detailed Findings ({report.findings.length} controls assessed)
          </div>
          {(report.findings || []).map((f, i) => {
            const sb = statusBadge(f.status);
            const pb = priorityBadge(f.priority);
            const isOpen = expanded === i;
            return (
              <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
                <button onClick={() => setExpanded(isOpen ? null : i)}
                  style={{ width: "100%", background: isOpen ? "#f8f6f1" : "#fff", border: "none", cursor: "pointer",
                    padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                  <span style={{ fontWeight: 700, color: ROYAL_BLUE, fontSize: 12, minWidth: 64 }}>{f.controlId}</span>
                  <span style={{ flex: 1, fontSize: 13, color: "#374151", fontWeight: 500 }}>{f.controlName}</span>
                  <span style={{ background: pb.bg, color: pb.color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {f.priority}
                  </span>
                  <span style={{ background: sb.bg, color: sb.color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {sb.label}
                  </span>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 16px 14px", background: "#fafafa" }}>
                    {f.saPolicyPrinciple && f.saPolicyPrinciple !== "N/A" && (
                      <div style={{ marginBottom: 10, padding: "6px 10px", background: "#eff6ff", borderRadius: 6, fontSize: 12, color: "#1e40af" }}>
                        <strong>SA AI Policy alignment:</strong> {f.saPolicyPrinciple}
                      </div>
                    )}
                    {f.csfFunction && (
                      <div style={{ marginBottom: 10, padding: "6px 10px", background: "#f0fdf4", borderRadius: 6, fontSize: 12, color: "#166534" }}>
                        <strong>CSF Function:</strong> {f.csfFunction}
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 }}>Gap</div>
                        <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.5 }}>{f.gapDescription}</p>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 }}>Evidence Required</div>
                        <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.5 }}>{f.evidenceRequired}</p>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 }}>Recommendation</div>
                        <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.5 }}>{f.recommendation}</p>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 }}>Estimated Effort</div>
                        <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>{f.estimatedEffort}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tracker toggle */}
        <button onClick={() => setShowTracker(s => !s)}
          style={{ background: showTracker ? "#f3f4f6" : ROYAL_BLUE, color: showTracker ? ROYAL_BLUE : "#fff",
            border: `1px solid ${ROYAL_BLUE}`, borderRadius: 8, padding: "10px 20px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: showTracker ? 0 : 0 }}>
          {showTracker ? "Hide Tracker" : "Open Recommendations Tracker →"}
        </button>

        {showTracker && <RecommendationsTracker findings={report.findings || []} />}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AssessmentTool() {
  const [step, setStep]             = useState(0); // 0=scope, 1=profile, 2=questions, 3=loading, 4=results
  const [selectedFrameworks, setSF] = useState([]);
  const [currentFW, setCurrentFW]   = useState(0); // index into selectedFrameworks during questions
  const [answers, setAnswers]       = useState({}); // { frameworkId: { qId: value } }
  const [profile, setProfile]       = useState({ name: "", company: "", email: "", phone: "", industry: "", size: "" });
  const [profileErrors, setPE]      = useState({});
  const [reports, setReports]       = useState({}); // { frameworkId: parsedReport }
  const [loadingMsg, setLoadingMsg] = useState("");
  const [activeReport, setAR]       = useState(null);
  const [assessmentError, setAssessmentError] = useState("");
  const topRef = useRef(null);

  function scrollTop() { topRef.current?.scrollIntoView({ behavior: "smooth" }); }

  function toggleFramework(id) {
    setSF(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }

  function setAnswer(fwId, qId, value) {
    setAnswers(prev => ({ ...prev, [fwId]: { ...(prev[fwId] || {}), [qId]: value } }));
  }

  function validateProfile() {
    const errors = {};
    if (!profile.name.trim())     errors.name     = "Required";
    if (!profile.company.trim())  errors.company  = "Required";
    if (!profile.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errors.email = "Valid email required";
    if (!profile.industry)        errors.industry = "Required";
    if (!profile.size)            errors.size     = "Required";
    setPE(errors);
    return Object.keys(errors).length === 0;
  }

  async function runAssessment() {
    setStep(3);
    setAssessmentError("");
    scrollTop();
    const completed = {};
    setLoadingMsg("Starting parallel analysis...");

    await Promise.all(
      selectedFrameworks.map(async (fwId) => {
        const fw = FRAMEWORKS.find(f => f.id === fwId);
        const fallbackReport = buildRuleBasedReport(fw, profile, answers[fwId] || {});
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 45000);
          // In dev: proxied via Vite (/api/claude -> api.anthropic.com)
          // In prod: goes to /api/assess Vercel function
          const isDev = import.meta.env.DEV;
          const endpoint = isDev
            ? "/api/claude"
            : "/api/assess";
          const body = isDev
            ? JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4000,
                system: buildSystemPrompt(fwId),
                messages: [{ role: "user", content: buildUserPrompt(fw, profile, answers[fwId] || {}) }],
              })
            : JSON.stringify({
                systemPrompt: buildSystemPrompt(fwId),
                userPrompt: buildUserPrompt(fw, profile, answers[fwId] || {}),
                profile,
                frameworkName: fw.name,
              });
          const headers = isDev
            ? {
                "Content-Type": "application/json",
                "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
              }
            : { "Content-Type": "application/json" };
          const res = await fetch(endpoint, {
            method: "POST",
            signal: controller.signal,
            headers,
            body,
          });
          clearTimeout(timeout);
          const raw = await res.text();
          const data = raw ? JSON.parse(raw) : {};
          if (!res.ok) {
            throw new Error(data?.detail || data?.error || `Request failed with status ${res.status}`);
          }
          // In prod the Vercel function wraps the report in { report: ... }
          if (!isDev && data.report) {
            completed[fwId] = data.report;
            const doneCount = Object.keys(completed).length;
            setLoadingMsg(`${doneCount} of ${selectedFrameworks.length} frameworks complete...`);
            return;
          }
          const text = data.content?.[0]?.text || "{}";
          const clean = text.replace(/```json|```/g, "").trim();
          completed[fwId] = JSON.parse(clean);
        } catch (err) {
          setAssessmentError(prev => prev || err.message || "Assessment generation failed.");
          completed[fwId] = fallbackReport;
        }
        const doneCount = Object.keys(completed).length;
        setLoadingMsg(`${doneCount} of ${selectedFrameworks.length} frameworks complete...`);
      })
    );

    setLoadingMsg("Preparing your report...");

    // Save lead in background — never block the report from showing
    saveLead(profile, selectedFrameworks, answers, completed).catch(() => {});

    setReports(completed);
    setAR(selectedFrameworks[0]);
    setStep(4);
    scrollTop();
  }

  const activeFWData = FRAMEWORKS.find(f => f.id === selectedFrameworks[currentFW]);
  const activeAnswers = answers[selectedFrameworks[currentFW]] || {};
  const allAnswered = activeFWData
    ? activeFWData.questions.every(q => activeAnswers[q.id])
    : false;

  // ── Step 0: Framework scope selector ────────────────────────────────────────
  if (step === 0) return (
    <div ref={topRef} style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ display: "inline-block", background: MATTE_GOLD, color: "#fff", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.14em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 20, marginBottom: 12 }}>
          Free Assessment
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: ROYAL_BLUE, margin: "0 0 10px" }}>
          Know where you stand before the auditors arrive.
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", maxWidth: 560, margin: "0 auto" }}>
          Select the frameworks relevant to your organisation. Your answers will generate a free, 
          audit-grade gap analysis in under 2 minutes.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 28 }}>
        {FRAMEWORKS.map(fw => {
          const sel = selectedFrameworks.includes(fw.id);
          return (
            <button key={fw.id} onClick={() => toggleFramework(fw.id)}
              style={{ background: sel ? fw.color : "#fff", color: sel ? "#fff" : "#374151",
                border: sel ? `2px solid ${fw.color}` : "2px solid #e5e7eb",
                borderRadius: 12, padding: "16px 18px", cursor: "pointer", textAlign: "left",
                transition: "all 0.15s ease" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{fw.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{fw.name}</div>
              <div style={{ fontSize: 12, opacity: sel ? 0.85 : 0.6 }}>{fw.subtitle}</div>
            </button>
          );
        })}
      </div>

      {selectedFrameworks.length > 0 && (
        <div style={{ textAlign: "center" }}>
          <button onClick={() => { setStep(1); scrollTop(); }}
            style={{ background: ROYAL_BLUE, color: "#fff", border: "none", borderRadius: 10,
              padding: "14px 36px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Continue with {selectedFrameworks.length} framework{selectedFrameworks.length > 1 ? "s" : ""} →
          </button>
        </div>
      )}
    </div>
  );

  // ── Step 1: Company profile ──────────────────────────────────────────────────
  if (step === 1) {
    const field = (label, key, type = "text", opts = null) => (
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: ROYAL_BLUE, marginBottom: 6 }}>
          {label} {["name","company","email","industry","size"].includes(key) && <span style={{ color: "#ef4444" }}>*</span>}
        </label>
        {opts ? (
          <select value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${profileErrors[key] ? "#ef4444" : "#e5e7eb"}`,
              borderRadius: 8, fontSize: 14, color: profile[key] ? "#111" : "#9ca3af" }}>
            <option value="">Select…</option>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
            placeholder={key === "email" ? "your@company.com" : key === "phone" ? "+27 xx xxx xxxx (optional)" : ""}
            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${profileErrors[key] ? "#ef4444" : "#e5e7eb"}`,
              borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}/>
        )}
        {profileErrors[key] && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{profileErrors[key]}</div>}
      </div>
    );

    return (
      <div ref={topRef} style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>
        <button onClick={() => setStep(0)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 13, marginBottom: 20 }}>
          ← Back
        </button>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: ROYAL_BLUE, marginBottom: 6 }}>Your organisation</h2>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
          Your report will be sent to your email. We'll also reach out with next steps.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div>{field("Your name", "name")}</div>
          <div>{field("Company name", "company")}</div>
        </div>
        {field("Work email", "email", "email")}
        {field("Phone number", "phone", "tel")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div>{field("Industry", "industry", "text", INDUSTRY_OPTIONS)}</div>
          <div>{field("Company size", "size", "text", SIZE_OPTIONS)}</div>
        </div>

        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#0369a1", marginBottom: 20 }}>
          🔒 Your data is stored securely and never shared. This assessment is for your benefit only.
        </div>

        <button onClick={() => { if (validateProfile()) { setStep(2); scrollTop(); } }}
          style={{ width: "100%", background: ROYAL_BLUE, color: "#fff", border: "none", borderRadius: 10,
            padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Start Assessment →
        </button>
      </div>
    );
  }

  // ── Step 2: Questions ────────────────────────────────────────────────────────
  if (step === 2 && activeFWData) {
    const progress = Math.round((Object.keys(activeAnswers).length / activeFWData.questions.length) * 100);
    const isLastFW = currentFW === selectedFrameworks.length - 1;

    return (
      <div ref={topRef} style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 700, margin: "0 auto", padding: "32px 20px" }}>
        <button onClick={() => currentFW === 0 ? setStep(1) : setCurrentFW(c => c - 1)}
          style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 13, marginBottom: 16 }}>
          ← Back
        </button>

        {/* FW progress pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {selectedFrameworks.map((fwId, i) => {
            const fw = FRAMEWORKS.find(f => f.id === fwId);
            const done = i < currentFW;
            const active = i === currentFW;
            return (
              <span key={fwId} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: done ? "#dcfce7" : active ? ROYAL_BLUE : "#f3f4f6",
                color: done ? "#166534" : active ? "#fff" : "#9ca3af" }}>
                {done ? "✓ " : ""}{fw.name}
              </span>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 24 }}>{activeFWData.icon}</span>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: ROYAL_BLUE, margin: 0 }}>{activeFWData.name}</h2>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{activeFWData.description}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: "#f3f4f6", borderRadius: 2, marginBottom: 24 }}>
          <div style={{ height: "100%", background: MATTE_GOLD, borderRadius: 2, width: `${progress}%`, transition: "width 0.3s" }}/>
        </div>

        {activeFWData.questions.map((q, qi) => (
          <div key={q.id} style={{ marginBottom: 20, padding: "16px 18px", background: "#fff",
            border: "1px solid #e5e7eb", borderRadius: 10 }}>
            <div style={{ fontSize: 14, color: "#374151", fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>
              <span style={{ color: MATTE_GOLD, fontWeight: 700 }}>Q{qi + 1}. </span>{q.text}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {ANSWER_OPTIONS.map(opt => {
                const sel = activeAnswers[q.id] === opt.value;
                return (
                  <button key={opt.value} onClick={() => setAnswer(selectedFrameworks[currentFW], q.id, opt.value)}
                    style={{ background: sel ? opt.bg : "#f9fafb", color: sel ? opt.color : "#374151",
                      border: sel ? `2px solid ${opt.color}` : "2px solid #e5e7eb",
                      borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12,
                      fontWeight: sel ? 700 : 400, textAlign: "left", transition: "all 0.1s" }}>
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
          else { setCurrentFW(c => c + 1); scrollTop(); }
        }}
          disabled={!allAnswered}
          style={{ width: "100%", background: allAnswered ? ROYAL_BLUE : "#e5e7eb",
            color: allAnswered ? "#fff" : "#9ca3af", border: "none", borderRadius: 10,
            padding: "14px", fontSize: 15, fontWeight: 700, cursor: allAnswered ? "pointer" : "not-allowed" }}>
          {isLastFW ? "Generate My Report →" : `Next: ${FRAMEWORKS.find(f => f.id === selectedFrameworks[currentFW + 1])?.name} →`}
        </button>
      </div>
    );
  }

  // ── Step 3: Loading ──────────────────────────────────────────────────────────
  if (step === 3) {
    const doneCount = parseInt(loadingMsg?.match(/^(\d+) of/)?.[1] || "0");
    const total = selectedFrameworks.length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    return (
      <div ref={topRef} style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 560, margin: "0 auto",
        padding: "80px 20px", textAlign: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 56, height: 56, border: "4px solid #e5e7eb", borderTop: `4px solid ${ROYAL_BLUE}`,
          borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 24px" }}/>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: ROYAL_BLUE, marginBottom: 8 }}>
          Analysing your controls...
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28 }}>{loadingMsg}</p>

        {assessmentError && (
          <div style={{
            background: "#fff7ed",
            border: "1px solid #fdba74",
            color: "#9a3412",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 13,
            marginBottom: 20,
          }}>
            {assessmentError}
          </div>
        )}

        {/* Progress bar */}
        <div style={{ background: "#f3f4f6", borderRadius: 4, height: 6, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ height: "100%", background: ROYAL_BLUE, borderRadius: 4,
            width: `${pct}%`, transition: "width 0.5s ease" }}/>
        </div>

        {/* Per-framework status pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 28 }}>
          {selectedFrameworks.map((fwId, i) => {
            const fw = FRAMEWORKS.find(f => f.id === fwId);
            const done = reports[fwId] !== undefined || (doneCount > i);
            return (
              <span key={fwId} style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: done ? "#dcfce7" : "#f3f4f6",
                color: done ? "#166534" : "#9ca3af",
                border: `1px solid ${done ? "#bbf7d0" : "#e5e7eb"}`
              }}>
                {done ? "✓ " : ""}{fw.name}
              </span>
            );
          })}
        </div>

        <p style={{ fontSize: 12, color: "#9ca3af" }}>
          All frameworks are being analysed in parallel.<br/>
          {total > 3 ? "With " + total + " frameworks this takes about 30–45 seconds." : "This takes about 20–30 seconds."}
        </p>
      </div>
    );
  }

  // ── Step 4: Results ──────────────────────────────────────────────────────────
  if (step === 4) {
    const activeReportData = reports[activeReport];
    return (
      <div ref={topRef} style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: "24px 20px" }}>

        {/* Results header */}
        <div style={{ background: ROYAL_BLUE, borderRadius: 14, padding: "24px 28px", marginBottom: 24, display: "flex",
          alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: LIGHT_GOLD, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", marginBottom: 6 }}>
              ARCReady Assessment Complete
            </div>
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
              {profile.company} — Control Self-Assessment
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
              {new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })} · {selectedFrameworks.length} framework{selectedFrameworks.length > 1 ? "s" : ""} assessed
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => window.print()}
              style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Booking CTA */}
        <div style={{ background: `linear-gradient(135deg, ${MATTE_GOLD}22, ${MATTE_GOLD}11)`,
          border: `2px solid ${MATTE_GOLD}`, borderRadius: 12, padding: "20px 24px", marginBottom: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: ROYAL_BLUE, marginBottom: 4 }}>
              Ready to turn these findings into action?
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", maxWidth: 480 }}>
              Book a free 30-minute consultation with Michael Mokadi CA(SA) to walk through your results 
              and build a prioritised remediation roadmap.
            </div>
          </div>
          <a href="https://www.arcready.co.za/#contact"
            style={{ background: MATTE_GOLD, color: "#fff", textDecoration: "none",
              borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700,
              whiteSpace: "nowrap", display: "inline-block" }}>
            Book Free Consultation →
          </a>
        </div>

        {assessmentError && (
          <div style={{
            background: "#fff7ed",
            border: "1px solid #fdba74",
            color: "#9a3412",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 13,
            marginBottom: 20,
          }}>
            AI enhancement is currently unavailable, so this report was generated directly from your framework responses.
          </div>
        )}

        {/* Framework tabs (if multiple) */}
        {selectedFrameworks.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {selectedFrameworks.map(fwId => {
              const fw = FRAMEWORKS.find(f => f.id === fwId);
              const r  = reports[fwId];
              const active = activeReport === fwId;
              const rColor = { "High Risk": "#991b1b", "Medium Risk": "#92400e", "Low Risk": "#166534" }[r?.overallRating] || "#374151";
              return (
                <button key={fwId} onClick={() => setAR(fwId)}
                  style={{ background: active ? ROYAL_BLUE : "#fff", color: active ? "#fff" : "#374151",
                    border: `2px solid ${active ? ROYAL_BLUE : "#e5e7eb"}`, borderRadius: 10,
                    padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 8 }}>
                  {fw.icon} {fw.name}
                  {r && (
                    <span style={{ background: active ? "rgba(255,255,255,0.2)" : rColor + "22",
                      color: active ? "#fff" : rColor, padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>
                      {r.overallScore}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Active report */}
        {activeReportData && (
          <ReportCard
            report={activeReportData}
            framework={FRAMEWORKS.find(f => f.id === activeReport)}
          />
        )}

        {/* Next step nudge */}
        {activeReportData?.nextStep && (
          <div style={{ background: OFF_WHITE, border: `1px solid ${MATTE_GOLD}44`, borderRadius: 10,
            padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: ROYAL_BLUE, marginBottom: 4 }}>ARCReady recommends</div>
              <div style={{ fontSize: 13, color: "#374151" }}>{activeReportData.nextStep}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
