/* global process */
/**
 * Vercel Serverless Function: /api/lead.js
 *
 * Required environment variables in Vercel dashboard:
 *   SUPABASE_URL               — e.g. https://<project-ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  — service role key for secure server-side inserts
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : (req.body || {});

  const {
    name,
    company,
    email,
    phone,
    industry,
    size,
    frameworks,
    answers,
    report,
  } = body;

  if (!name || !company || !email || !industry || !size) {
    return res.status(400).json({
      error: "Missing required fields",
      detail: "Expected name, company, email, industry, and size.",
    });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: "Server misconfiguration",
      detail: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in Vercel.",
    });
  }

  const insertRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/assessment_leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      name,
      company,
      email,
      phone: phone || null,
      industry,
      size,
      frameworks: frameworks || [],
      answers: answers || {},
      report: report || {},
    }),
  });

  if (!insertRes.ok) {
    const detail = await insertRes.text();
    return res.status(insertRes.status).json({
      error: "Supabase insert failed",
      detail,
    });
  }

  return res.status(200).json({ success: true });
}
