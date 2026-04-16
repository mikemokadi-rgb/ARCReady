/* global process */
/**
 * Vercel Serverless Function: /api/assess.js
 *
 * Place this file at: api/assess.js in your Vite project root.
 *
 * Required environment variables in Vercel dashboard:
 *   ANTHROPIC_API_KEY   — your Anthropic key (server-side, not exposed to browser)
 *   RESEND_API_KEY      — your Resend key for email delivery
 *   NOTIFY_EMAIL        — your email address to receive lead notifications
 *
 * This function:
 *   1. Calls Anthropic API with the skill prompt (keeps key server-side)
 *   2. Sends the report to the prospect via Resend
 *   3. Sends a lead notification to you
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : (req.body || {});

  const { systemPrompt, userPrompt, profile, frameworkName } = body;

  if (!systemPrompt || !userPrompt || !profile?.email) {
    return res.status(400).json({
      error: "Missing required fields",
      detail: "Expected systemPrompt, userPrompt, and profile.email in the request body.",
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: "Server misconfiguration",
      detail: "ANTHROPIC_API_KEY is not configured in the deployment environment.",
    });
  }

  // ── 1. Call Anthropic API ────────────────────────────────────────────────────
  let reportJson = null;
  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await anthropicRes.json();
    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({
        error: "Anthropic request failed",
        detail: data?.error?.message || "The model API rejected the assessment request.",
      });
    }

    const text = data.content?.[0]?.text || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    reportJson = JSON.parse(clean);
  } catch (err) {
    return res.status(500).json({ error: "Assessment generation failed", detail: err.message });
  }

  // ── 2. Email report to prospect ──────────────────────────────────────────────
  if (process.env.RESEND_API_KEY && reportJson) {
    const criticalFindings = reportJson.findings?.filter(f => f.priority === "Critical") || [];
    const findingRows = (reportJson.findings || []).slice(0, 10).map(f => `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 8px 10px; font-weight: 600; color: #1B3A6B; font-size: 12px;">${f.controlId}</td>
        <td style="padding: 8px 10px; font-size: 13px;">${f.controlName}</td>
        <td style="padding: 8px 10px;">
          <span style="background: ${f.priority === "Critical" ? "#fecdd3" : f.priority === "High" ? "#fee2e2" : f.priority === "Medium" ? "#fef3c7" : "#dcfce7"};
            color: ${f.priority === "Critical" ? "#9f1239" : f.priority === "High" ? "#991b1b" : f.priority === "Medium" ? "#92400e" : "#166534"};
            padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
            ${f.priority}
          </span>
        </td>
        <td style="padding: 8px 10px; font-size: 12px; color: #374151;">${f.status}</td>
      </tr>
    `).join("");

    const prospectEmail = {
      from: "ARCReady Assessments <hello@arcready.co.za>",
      to: profile.email,
      subject: `Your ${frameworkName} Gap Analysis — ${profile.company}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'DM Sans', Arial, sans-serif; background: #f8f6f1; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

            <!-- Header -->
            <div style="background: #1B3A6B; padding: 28px 32px;">
              <div style="color: #B8963E; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px;">
                ARCReady · Audit. Risk. Compliance.
              </div>
              <div style="color: #fff; font-size: 22px; font-weight: 800; margin-bottom: 4px;">
                Your ${frameworkName} Gap Analysis
              </div>
              <div style="color: rgba(255,255,255,0.6); font-size: 13px;">
                ${profile.company} · ${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>

            <div style="padding: 28px 32px;">

              <!-- Score + Rating -->
              <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                <div style="background: #f8f6f1; border-radius: 10px; padding: 16px 20px; flex: 1; text-align: center;">
                  <div style="font-size: 32px; font-weight: 800; color: #1B3A6B;">${reportJson.overallScore}</div>
                  <div style="font-size: 12px; color: #6b7280;">Overall Score</div>
                </div>
                <div style="background: #f8f6f1; border-radius: 10px; padding: 16px 20px; flex: 1; text-align: center;">
                  <div style="font-size: 18px; font-weight: 700; color: ${reportJson.overallRating === "High Risk" ? "#991b1b" : reportJson.overallRating === "Medium Risk" ? "#92400e" : "#166534"};">
                    ${reportJson.overallRating}
                  </div>
                  <div style="font-size: 12px; color: #6b7280;">Risk Rating</div>
                </div>
                <div style="background: #f8f6f1; border-radius: 10px; padding: 16px 20px; flex: 1; text-align: center;">
                  <div style="font-size: 32px; font-weight: 800; color: #9f1239;">${criticalFindings.length}</div>
                  <div style="font-size: 12px; color: #6b7280;">Critical Findings</div>
                </div>
              </div>

              <!-- Summary -->
              <div style="background: #f8f6f1; border-left: 4px solid #B8963E; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; color: #B8963E; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">Executive Summary</div>
                <p style="font-size: 14px; color: #374151; margin: 0; line-height: 1.6;">${reportJson.executiveSummary}</p>
              </div>

              <!-- Top 5 Actions -->
              <div style="margin-bottom: 24px;">
                <div style="font-size: 14px; font-weight: 700; color: #1B3A6B; margin-bottom: 10px;">Top 5 Priority Actions</div>
                <ol style="margin: 0; padding-left: 20px;">
                  ${(reportJson.top5Actions || []).map(a => `<li style="font-size: 13px; color: #374151; margin-bottom: 6px; line-height: 1.5;">${a}</li>`).join("")}
                </ol>
              </div>

              <!-- Findings table -->
              <div style="margin-bottom: 24px;">
                <div style="font-size: 14px; font-weight: 700; color: #1B3A6B; margin-bottom: 10px;">
                  Key Findings ${reportJson.findings?.length > 10 ? "(top 10 shown)" : ""}
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <thead>
                    <tr style="background: #1B3A6B; color: #fff;">
                      <th style="padding: 8px 10px; text-align: left; font-weight: 500; font-size: 12px;">Control</th>
                      <th style="padding: 8px 10px; text-align: left; font-weight: 500; font-size: 12px;">Name</th>
                      <th style="padding: 8px 10px; text-align: left; font-weight: 500; font-size: 12px;">Priority</th>
                      <th style="padding: 8px 10px; text-align: left; font-weight: 500; font-size: 12px;">Status</th>
                    </tr>
                  </thead>
                  <tbody>${findingRows}</tbody>
                </table>
              </div>

              <!-- CTA -->
              <div style="background: #fff8ec; border: 2px solid #B8963E; border-radius: 10px; padding: 20px 24px; text-align: center;">
                <div style="font-size: 16px; font-weight: 700; color: #1B3A6B; margin-bottom: 6px;">
                  Turn these findings into action
                </div>
                <p style="font-size: 13px; color: #6b7280; margin: 0 0 16px;">
                  Book a free 30-minute consultation with Michael Mokadi CA(SA) to build your remediation roadmap.
                </p>
                <a href="https://www.arcready.co.za/#contact"
                  style="background: #1B3A6B; color: #fff; text-decoration: none; border-radius: 8px;
                    padding: 12px 28px; font-size: 14px; font-weight: 700; display: inline-block;">
                  Book Free Consultation →
                </a>
              </div>

            </div>

            <!-- Footer -->
            <div style="background: #f8f6f1; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <div style="font-size: 12px; color: #9ca3af;">
                ARCReady · hello@arcready.co.za · arcready.co.za<br/>
                "Know where you stand before they arrive."
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Notification to Michael
    const notifyEmail = {
      from: "ARCReady Assessments <hello@arcready.co.za>",
      to: process.env.NOTIFY_EMAIL || "hello@arcready.co.za",
      subject: `🔔 New Lead: ${profile.company} — ${frameworkName} Assessment`,
      html: `
        <p><strong>New assessment completed</strong></p>
        <table style="border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Name</td><td><strong>${profile.name}</strong></td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Company</td><td>${profile.company}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Email</td><td><a href="mailto:${profile.email}">${profile.email}</a></td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Phone</td><td>${profile.phone || "—"}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Industry</td><td>${profile.industry}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Size</td><td>${profile.size}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Framework</td><td>${frameworkName}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Risk Rating</td><td><strong style="color: ${reportJson.overallRating === "High Risk" ? "#991b1b" : reportJson.overallRating === "Medium Risk" ? "#92400e" : "#166534"};">${reportJson.overallRating}</strong></td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Score</td><td>${reportJson.overallScore}/100</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Critical findings</td><td>${criticalFindings.length}</td></tr>
        </table>
        <p style="margin-top: 16px; font-size: 13px; color: #374151;">
          <strong>Executive summary:</strong><br/>${reportJson.executiveSummary}
        </p>
      `,
    };

    const resendBase = "https://api.resend.com/emails";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
    };

    await Promise.allSettled([
      fetch(resendBase, { method: "POST", headers, body: JSON.stringify(prospectEmail) }),
      fetch(resendBase, { method: "POST", headers, body: JSON.stringify(notifyEmail) }),
    ]);
  }

  return res.status(200).json({ report: reportJson });
}
