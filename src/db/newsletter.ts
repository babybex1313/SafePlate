import { createServerFn } from "@tanstack/react-start";
import { Resend } from "resend";
import { sql } from "~/db";
import { wrapEmail, BRAND } from "~/email";

/**
 * Server function: sends a newsletter blast to all subscribers.
 * Gets all subscribers from the DB and sends individual emails via Resend
 * using the branded email layout.
 */
export const sendNewsletterBlast = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { subject: string; body: string } }) => {
    const { subject, body } = data;

    if (!subject?.trim()) {
      return { success: false, error: "Subject is required." };
    }
    if (!body?.trim()) {
      return { success: false, error: "Body is required." };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { success: false, error: "RESEND_API_KEY is not set." };
    }

    // Ensure the subscribers table exists
    await sql()`create table if not exists subscribers (
      id serial primary key,
      name text not null,
      email text not null unique,
      created_at timestamptz default now()
    )`;

    // Get all subscribers
    const subscribers = await sql()`select id, name, email from subscribers order by created_at asc` as {
      id: number;
      name: string;
      email: string;
    }[];

    if (subscribers.length === 0) {
      return { success: false, error: "No subscribers to send to." };
    }

    // Convert plain-text newlines to <br> for HTML email
    const bodyHtml = body.replace(/\n/g, "<br>");

    const content = `
      <h1 style="font-size:22px;font-weight:700;color:${BRAND.headline};margin:0 0 16px 0;">
        ${subject}
      </h1>

      <div style="background-color:${BRAND.subtle};border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:8px;">
        <p style="font-size:15px;line-height:1.7;color:${BRAND.body};margin:0;">
          ${bodyHtml}
        </p>
      </div>

      <p style="font-size:13px;line-height:1.6;color:${BRAND.footer};margin:16px 0 0 0;">
        You're receiving this because you signed up at safeplate.company.
        <br>
        <a href="https://safeplate.company/unsubscribe" style="color:${BRAND.footer};text-decoration:underline;">Unsubscribe</a> anytime.
      </p>`;

    const html = wrapEmail(content);
    const resend = new Resend(apiKey);

    let sent = 0;
    let failed = 0;

    // Send individually (Resend free tier sends one at a time per API call)
    for (const sub of subscribers) {
      try {
        const { error } = await resend.emails.send({
          from: "SafePlate <hello@safeplate.company>",
          to: [sub.email],
          subject: `SafePlate — ${subject}`,
          html,
          replyTo: "safe.platecompany@gmail.com",
          track_opens: true,
        });

        if (error) {
          console.error(
            `[SafePlate] Failed to send newsletter to ${sub.email}:`,
            error,
          );
          failed++;
        } else {
          sent++;
          console.log(`[SafePlate] Newsletter sent to ${sub.email}`);
        }
      } catch (err) {
        console.error(
          `[SafePlate] Unexpected error sending newsletter to ${sub.email}:`,
          err,
        );
        failed++;
      }
    }

    return {
      success: true,
      sent,
      failed,
      total: subscribers.length,
    };
  },
);

/**
 * Server function: returns all subscribers for the admin panel.
 */
export const listSubscribers = createServerFn({ method: "GET" }).handler(async () => {
  await sql()`create table if not exists subscribers (
    id serial primary key,
    name text not null,
    email text not null unique,
    created_at timestamptz default now()
  )`;

  const rows = await sql()`select id, name, email, created_at from subscribers order by created_at desc` as {
    id: number;
    name: string;
    email: string;
    created_at: string;
  }[];

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    created_at: String(r.created_at),
  }));
});
