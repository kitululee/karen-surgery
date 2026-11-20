import nodemailer from "nodemailer";
import { config } from "../config.js";
import { type DbClient, getDb } from "../db/database.js";

export interface EmailDeliveryResult {
  status: "sent" | "queued_unconfigured" | "failed";
  recipient: string;
  error?: string;
}

export function isSmtpConfigured(): boolean {
  return Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);
}

/**
 * Resolves appointment notification recipient following strict routing priority:
 * 1. Approved practitioner-specific email (strictly from verified DB record)
 * 2. Approved service-specific email (if configured in DB)
 * 3. Default Reception fallback (Receptionist@KarenSurgery.com)
 */
export async function resolveAppointmentRecipient(
  serviceSlug: string,
  practitionerId: number | null,
  db: DbClient = getDb()
): Promise<string> {
  if (practitionerId) {
    const prac = await db.get<{ email: string | null }>(
      "SELECT email FROM practitioners WHERE id = $1 AND is_active = 1 AND is_approved = 1 AND is_archived = 0",
      [practitionerId]
    );
    if (prac?.email && prac.email.includes("@")) {
      return prac.email.trim();
    }
  }

  if (serviceSlug) {
    const svc = await db.get<{ contact_email: string | null }>(
      "SELECT contact_email FROM services WHERE slug = $1 AND is_published = 1",
      [serviceSlug]
    );
    if (svc?.contact_email && svc.contact_email.includes("@")) {
      return svc.contact_email.trim();
    }
  }

  return config.receptionEmail;
}

/**
 * Privacy-minimised email sender:
 * Sends ONLY reference metadata and a link to the protected Admin Portal so
 * sensitive patient disclosures or internal notes never travel over ordinary email.
 */
async function sendMinimalEmail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<EmailDeliveryResult> {
  if (!isSmtpConfigured()) {
    console.info(
      `[email:queued_unconfigured] SMTP credentials not configured. Would notify ${opts.to} | Subject: ${opts.subject}`
    );
    return { status: "queued_unconfigured", recipient: opts.to };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });

    await transporter.sendMail({
      from: config.smtp.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
    return { status: "sent", recipient: opts.to };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[email:failed] To=${opts.to} Error=${msg}`);
    return { status: "failed", recipient: opts.to, error: msg };
  }
}

export async function notifyAppointmentRequest(params: {
  to: string;
  referenceCode: string;
  serviceLabel: string;
  practitionerName?: string | null;
  preferredDate: string;
  preferredTime: string;
  preferredContact: string;
}) {
  const subject = `[Karen Surgery] New Appointment Request ${params.referenceCode}`;
  const text = [
    "A new appointment request has been submitted through the Karen Surgery website.",
    "",
    `Reference: ${params.referenceCode}`,
    `Service: ${params.serviceLabel}`,
    params.practitionerName ? `Preferred Practitioner: ${params.practitionerName}` : "Preferred Practitioner: Any available",
    `Preferred Date: ${params.preferredDate}${params.preferredTime ? ` (${params.preferredTime})` : ""}`,
    `Preferred Contact Method: ${params.preferredContact}`,
    "",
    "For patient privacy, full contact details and optional notes are stored in the protected Administration Portal:",
    `${config.adminPortalUrl}/?tab=appointments&ref=${encodeURIComponent(params.referenceCode)}`,
    "",
    "Reminder: This is a request only — appointments are confirmed solely by authorised staff.",
  ].join("\n");

  return sendMinimalEmail({ to: params.to, subject, text });
}

export async function notifyGeneralEnquiry(params: {
  to: string;
  referenceCode: string;
  category: string;
  source: "contact_form" | "chatbot";
  preferredContact: string;
}) {
  const sourceLabel = params.source === "chatbot" ? "Website Assistant (Chatbot)" : "Contact Form";
  const subject = `[Karen Surgery] New ${sourceLabel} Enquiry ${params.referenceCode}`;
  const text = [
    `A new website enquiry has been received via ${sourceLabel}.`,
    "",
    `Reference: ${params.referenceCode}`,
    `Category: ${params.category}`,
    `Preferred Contact Method: ${params.preferredContact}`,
    "",
    "For privacy, full enquiry details and message contents are available inside the protected Administration Portal:",
    `${config.adminPortalUrl}/?tab=enquiries&ref=${encodeURIComponent(params.referenceCode)}`,
  ].join("\n");

  return sendMinimalEmail({ to: params.to, subject, text });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}) {
  const subject = "[Karen Surgery Admin] Password Reset Request";
  const text = [
    "A password reset was requested for your Karen Surgery Administration Portal account.",
    "",
    `Reset link (valid for 30 minutes): ${params.resetUrl}`,
    "",
    "If you did not request this reset, you can safely ignore this message.",
  ].join("\n");
  return sendMinimalEmail({ to: params.to, subject, text });
}
