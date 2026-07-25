import { Resend } from "resend";

const SITE_URL =
  process.env.SITE_URL || "https://safeplate.company";

// ─── Shared layout helpers ───────────────────────────────────────────

const BRAND = {
  primary: "#0ea5e9",
  headline: "#1e293b",
  body: "#475569",
  bg: "#ffffff",
  subtle: "#f8fafc",
  footer: "#94a3b8",
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
} as const;

/** A styled call-to-action button. Links include UTM params for click attribution. */
function emailButton(text: string, url: string): string {
  const trackedUrl = addUtmParams(url);
  return `
    <table cellpadding="0" cellspacing="0" style="margin-top:24px;margin-bottom:24px;">
      <tr>
        <td align="center" style="background-color:${BRAND.primary};border-radius:8px;padding:14px 32px;">
          <a href="${trackedUrl}" target="_blank" rel="noopener noreferrer"
             style="color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;display:inline-block;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

/** Appends UTM tracking params to a URL for email click attribution. */
function addUtmParams(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=safeplate&utm_medium=email`;
}

/** Wraps body content in the full branded email layout (header + content + footer). */
function wrapEmail(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>SafePlate</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.subtle};font-family:${BRAND.font};-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${BRAND.subtle};">
    <tr>
      <td align="center" style="padding:24px 16px 40px 16px;">
        <!-- Main card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background-color:${BRAND.bg};border-radius:12px;overflow:hidden;">

          <!-- Sky accent bar -->
          <tr>
            <td style="background-color:${BRAND.primary};height:4px;line-height:4px;font-size:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <div style="font-size:26px;font-weight:700;color:${BRAND.headline};margin-bottom:4px;">
                &#127860;&#65039; SafePlate
              </div>
              <div style="font-size:14px;color:${BRAND.footer};">
                Dine with confidence, anywhere.
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <div style="border-top:1px solid #e2e8f0;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:${BRAND.subtle};border-top:1px solid #e2e8f0;margin-top:8px;">
              <div style="font-size:14px;font-weight:600;color:${BRAND.headline};margin-bottom:2px;">SafePlate</div>
              <div style="font-size:12px;color:${BRAND.footer};margin-bottom:2px;">safeplate.company</div>
              <div style="font-size:12px;color:${BRAND.footer};">Dine with confidence, anywhere.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Email functions ─────────────────────────────────────────────────

/**
 * Sends the SafePlate welcome email to a newly signed-up subscriber.
 *
 * If RESEND_API_KEY is not set, logs a warning and skips the send — signups
 * still succeed, just without the welcome email.
 *
 * Call this fire-and-forget (don't await) so signup latency isn't affected.
 */
export async function sendWelcomeEmail({
  name,
  email,
}: {
  name: string;
  email: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[SafePlate] RESEND_API_KEY is not set — skipping welcome email.",
    );
    return;
  }

  const resend = new Resend(apiKey);

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${BRAND.headline};margin:0 0 16px 0;">
      Welcome to SafePlate, ${name}!
    </h1>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 16px 0;">
      Thank you so much for joining the SafePlate early-access waitlist!
    </p>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 16px 0;">
      SafePlate was born out of a deeply personal mission. After watching my stepmom navigate the exhausting daily minefield of living with Celiac disease, I realized that standard restaurant apps just don&rsquo;t cut it. For anyone dealing with severe allergies or autoimmune conditions, a &ldquo;gluten-friendly&rdquo; label on a menu means absolutely nothing if the kitchen uses a shared fryer or doesn&rsquo;t train its staff.
    </p>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 24px 0;">
      We are building SafePlate to look past the menu and track the real kitchen protocols &mdash; like dedicated equipment and strict isolation zones &mdash; that keep you safe.
    </p>

    <!-- What We're Building -->
    <div style="background-color:${BRAND.subtle};border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <h2 style="font-size:17px;font-weight:700;color:${BRAND.headline};margin:0 0 16px 0;">
        &#128640; What We&rsquo;re Building For You
      </h2>
      <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tr>
          <td style="padding-bottom:12px;vertical-align:top;width:24px;">
            <span style="font-size:16px;">&#128640;</span>
          </td>
          <td style="padding-bottom:12px;font-size:15px;line-height:1.5;color:${BRAND.body};">
            <strong style="color:${BRAND.headline};">Verified Safety Tiers</strong><br>
            Clear color-coding mapping out 100% dedicated facilities versus shared kitchens with strict separation protocols.
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;vertical-align:top;">
            <span style="font-size:16px;">&#128506;&#65039;</span>
          </td>
          <td style="padding-bottom:12px;font-size:15px;line-height:1.5;color:${BRAND.body};">
            <strong style="color:${BRAND.headline};">Safe Journey Route Planner</strong><br>
            Input your road trip route and instantly see safe dining stops located within minutes of highway exits.
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;vertical-align:top;">
            <span style="font-size:16px;">&#127758;</span>
          </td>
          <td style="padding-bottom:12px;font-size:15px;line-height:1.5;color:${BRAND.body};">
            <strong style="color:${BRAND.headline};">Allergen Translation Cards</strong><br>
            Beautifully designed digital cards for your phone wallet, translated by native speakers, so you can safely explain your medical needs anywhere in the world.
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:0;vertical-align:top;">
            <span style="font-size:16px;">&#128680;</span>
          </td>
          <td style="padding-bottom:0;font-size:15px;line-height:1.5;color:${BRAND.body};">
            <strong style="color:${BRAND.headline};">Live Safety Alerts</strong><br>
            A community-powered notification shield that instantly flags sudden ingredient or supplier changes at local spots.
          </td>
        </tr>
      </table>
    </div>

    <!-- Help Us Map -->
    <h2 style="font-size:17px;font-weight:700;color:${BRAND.headline};margin:0 0 12px 0;">
      &#128506;&#65039; Help Us Map Your City First!
    </h2>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 12px 0;">
      We want to make sure your area is flooded with safe options the second we launch the app.
    </p>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 4px 0;">
      Simply reply directly to this email and tell us:
    </p>

    <ul style="font-size:15px;line-height:1.8;color:${BRAND.body};margin:0 0 20px 0;padding-left:20px;">
      <li>What city are you in?</li>
      <li>What is your #1 most trusted restaurant that always keeps you safe?</li>
    </ul>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 8px 0;">
      We will reach out to them first to verify their protocols and place them at the top of your local map.
    </p>

    ${emailButton("Explore SafePlate →", SITE_URL)}

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0;">
      Thank you for trusting us with your plate and joining our family. We can&rsquo;t wait to share what we&rsquo;ve been working on!
    </p>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:8px 0 0 0;">
      With care,<br>
      The SafePlate Team
    </p>`;

  const html = wrapEmail(content);

  try {
    const { error } = await resend.emails.send({
      from: "SafePlate <hello@safeplate.company>",
      to: [email],
      subject: "Welcome to SafePlate! 🛡️ Let's protect your plate together.",
      html,
      replyTo: "safe.platecompany@gmail.com",
      track_opens: true,
    });

    if (error) {
      console.error("[SafePlate] Failed to send welcome email:", error);
      return;
    }

    console.log(`[SafePlate] Welcome email sent to ${email}`);
  } catch (err) {
    console.error("[SafePlate] Unexpected error sending welcome email:", err);
  }
}

/**
 * Sends a confirmation email to a restaurant after they submit their venue.
 *
 * Fire-and-forget (don't await) so submission latency isn't affected.
 */
export async function sendVenueConfirmation({
  name,
  email,
  tier,
}: {
  name: string;
  email: string;
  tier: number;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[SafePlate] RESEND_API_KEY is not set — skipping venue confirmation email.",
    );
    return;
  }

  const resend = new Resend(apiKey);

  const tierEmoji = tier === 1 ? "🟢" : tier === 2 ? "🟡" : "🔵";
  const tierLabel = `Tier ${tier}`;

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${BRAND.headline};margin:0 0 16px 0;">
      Your venue is listed on SafePlate!
    </h1>

    <div style="background-color:${BRAND.subtle};border-radius:8px;padding:16px 20px;margin-bottom:20px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">${tierEmoji}</div>
      <div style="font-size:20px;font-weight:700;color:${BRAND.headline};">${tierLabel}</div>
    </div>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 16px 0;">
      Thanks for listing <strong style="color:${BRAND.headline};">${name}</strong> on SafePlate! Your venue has been assigned <strong>${tierLabel}</strong> safety status and is now visible in our search results.
    </p>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 8px 0;">
      We may reach out to verify your protocols. Questions? Reply to this email &mdash; we&rsquo;re happy to help.
    </p>

    ${emailButton("View Your Listing →", `${SITE_URL}/search`)}`;

  const html = wrapEmail(content);

  try {
    const { error } = await resend.emails.send({
      from: "SafePlate <hello@safeplate.company>",
      to: [email],
      subject: `SafePlate Listing Confirmed — Tier ${tier} Status for ${name}`,
      html,
      replyTo: "safe.platecompany@gmail.com",
      track_opens: true,
    });

    if (error) {
      console.error("[SafePlate] Failed to send venue confirmation email:", error);
      return;
    }

    console.log(`[SafePlate] Venue confirmation email sent to ${email} (Tier ${tier})`);
  } catch (err) {
    console.error("[SafePlate] Unexpected error sending venue confirmation email:", err);
  }
}

/**
 * Sends a notification to the owner when a restaurant owner submits an update.
 *
 * Fire-and-forget (don't await) so submission latency isn't affected.
 */
export async function sendUpdateNotification({
  restaurantName,
  submitterEmail,
  submitterName,
  changes,
  notes,
  autoApproved,
}: {
  restaurantName: string;
  submitterEmail: string;
  submitterName?: string;
  changes: Record<string, unknown>;
  notes?: string;
  autoApproved?: boolean;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[SafePlate] RESEND_API_KEY is not set — skipping update notification email.",
    );
    return;
  }

  const resend = new Resend(apiKey);

  const changesRows = Object.entries(changes)
    .map(([key, val]) => {
      const value = Array.isArray(val) ? (val as string[]).join(", ") : String(val);
      return `
        <tr>
          <td style="padding:8px 12px;font-size:14px;font-weight:600;color:${BRAND.headline};border-bottom:1px solid #e2e8f0;background-color:${BRAND.subtle};width:180px;">
            ${key}
          </td>
          <td style="padding:8px 12px;font-size:14px;color:${BRAND.body};border-bottom:1px solid #e2e8f0;">
            ${value}
          </td>
        </tr>`;
    })
    .join("");

  const autoApprovedBadge = autoApproved
    ? `
      <div style="background-color:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
        <span style="font-size:15px;color:#065f46;font-weight:600;">&#10003; Auto-Approved</span>
        <span style="font-size:14px;color:#065f46;display:block;margin-top:4px;">
          This update was auto-approved via domain match (submitter email domain matches restaurant website domain). No manual review is needed &mdash; changes have already been applied to the live listing.
        </span>
      </div>`
    : "";

  const headline = autoApproved
    ? `Auto-Approved: Update for ${restaurantName}`
    : `New Restaurant Update for ${restaurantName}`;

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${BRAND.headline};margin:0 0 16px 0;">
      ${headline}
    </h1>

    ${autoApprovedBadge}

    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin-bottom:12px;">
      <tr>
        <td style="padding:4px 0;font-size:14px;font-weight:600;color:${BRAND.headline};width:100px;">Restaurant</td>
        <td style="padding:4px 0;font-size:14px;color:${BRAND.body};">${restaurantName}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:14px;font-weight:600;color:${BRAND.headline};">Submitter</td>
        <td style="padding:4px 0;font-size:14px;color:${BRAND.body};">${submitterName ?? "N/A"} (${submitterEmail})</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:14px;font-weight:600;color:${BRAND.headline};">Notes</td>
        <td style="padding:4px 0;font-size:14px;color:${BRAND.body};">${notes ?? "N/A"}</td>
      </tr>
    </table>

    <!-- Changes table -->
    <div style="margin-bottom:8px;">
      <div style="font-size:14px;font-weight:700;color:${BRAND.headline};margin-bottom:8px;">Proposed Changes</div>
      ${changesRows
        ? `<table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
            ${changesRows}
           </table>`
        : `<p style="font-size:14px;color:${BRAND.body};margin:0;">(none specified)</p>`
      }
    </div>

    ${emailButton("Review in Admin →", `${SITE_URL}/admin/restaurants`)}`;

  const html = wrapEmail(content);

  const subject = autoApproved
    ? `Auto-approved: New restaurant update for ${restaurantName}`
    : `New restaurant update for ${restaurantName}`;

  try {
    const { error } = await resend.emails.send({
      from: "SafePlate <hello@safeplate.company>",
      to: ["safe.platecompany@gmail.com"],
      subject,
      html,
      replyTo: submitterEmail,
      track_opens: true,
    });

    if (error) {
      console.error("[SafePlate] Failed to send update notification email:", error);
      return;
    }

    console.log(`[SafePlate] Update notification email sent for ${restaurantName}${autoApproved ? " (auto-approved)" : ""}`);
  } catch (err) {
    console.error("[SafePlate] Unexpected error sending update notification email:", err);
  }
}

/**
 * Sends a notification to the owner when a community member submits a safety alert.
 *
 * Fire-and-forget (don't await) so submission latency isn't affected.
 */
export async function sendAlertNotification({
  restaurantName,
  alertType,
  description,
  submitterEmail,
}: {
  restaurantName: string;
  alertType: string;
  description: string;
  submitterEmail?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[SafePlate] RESEND_API_KEY is not set — skipping alert notification email.",
    );
    return;
  }

  const resend = new Resend(apiKey);

  const typeLabels: Record<string, string> = {
    ingredient_change: "Ingredient change",
    menu_change: "Menu item removed/changed",
    protocol_change: "Protocol change",
    other: "Other",
  };
  const typeLabel = typeLabels[alertType] ?? alertType;

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${BRAND.headline};margin:0 0 16px 0;">
      &#9888;&#65039; New Safety Alert
    </h1>

    <!-- Warning box -->
    <div style="background-color:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tr>
          <td style="padding:4px 0;font-size:14px;font-weight:600;color:${BRAND.headline};width:90px;">Restaurant</td>
          <td style="padding:4px 0;font-size:14px;color:${BRAND.body};font-weight:600;">${restaurantName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;font-weight:600;color:${BRAND.headline};">Alert Type</td>
          <td style="padding:4px 0;font-size:14px;color:${BRAND.body};">${typeLabel}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;font-weight:600;color:${BRAND.headline};">Submitter</td>
          <td style="padding:4px 0;font-size:14px;color:${BRAND.body};">${submitterEmail ?? "Anonymous"}</td>
        </tr>
      </table>

      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #fde68a;">
        <div style="font-size:13px;font-weight:600;color:${BRAND.headline};margin-bottom:4px;">Description</div>
        <div style="font-size:14px;line-height:1.6;color:${BRAND.body};">${description}</div>
      </div>
    </div>

    ${emailButton("Manage Alerts →", `${SITE_URL}/admin/restaurants`)}`;

  const html = wrapEmail(content);

  try {
    const { error } = await resend.emails.send({
      from: "SafePlate <hello@safeplate.company>",
      to: ["safe.platecompany@gmail.com"],
      subject: `New safety alert for ${restaurantName}`,
      html,
      replyTo: submitterEmail ?? undefined,
      track_opens: true,
    });

    if (error) {
      console.error("[SafePlate] Failed to send alert notification email:", error);
      return;
    }

    console.log(`[SafePlate] Alert notification email sent for ${restaurantName}`);
  } catch (err) {
    console.error("[SafePlate] Unexpected error sending alert notification email:", err);
  }
}

/**
 * Sends a notification when a restaurant owner claims a paid product
 * (Featured Listing, Verified Badge, or Premium Profile).
 */
export async function sendPaymentClaimNotification({
  restaurantName,
  email,
  product,
}: {
  restaurantName: string;
  email: string;
  product: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[SafePlate] RESEND_API_KEY is not set — skipping payment claim email.");
    return;
  }

  const resend = new Resend(apiKey);

  const productLabel =
    product === "featured"
      ? "Featured Listing ($29/mo)"
      : product === "verified"
        ? "Verified Badge ($49 one-time)"
        : "Premium Profile ($4.99/mo)";

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${BRAND.headline};margin:0 0 16px 0;">
      &#128176; Payment Claim Received
    </h1>

    <!-- Summary card -->
    <div style="background-color:${BRAND.subtle};border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tr>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:${BRAND.headline};width:90px;">Restaurant</td>
          <td style="padding:6px 0;font-size:14px;color:${BRAND.body};">${restaurantName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:${BRAND.headline};">Contact</td>
          <td style="padding:6px 0;font-size:14px;color:${BRAND.body};">${email}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:${BRAND.headline};">Product</td>
          <td style="padding:6px 0;font-size:14px;color:${BRAND.body};font-weight:600;">${productLabel}</td>
        </tr>
      </table>
    </div>

    <div style="background-color:#eff6ff;border-left:4px solid ${BRAND.primary};border-radius:4px;padding:12px 16px;margin-bottom:8px;">
      <p style="font-size:14px;line-height:1.6;color:${BRAND.body};margin:0;">
        <strong style="color:${BRAND.headline};">Action required:</strong> Verify the payment in Stripe, then activate the feature in the admin panel.
      </p>
    </div>

    ${emailButton("Go to Admin →", `${SITE_URL}/admin/restaurants`)}`;

  const html = wrapEmail(content);

  try {
    const { error } = await resend.emails.send({
      from: "SafePlate <hello@safeplate.company>",
      to: ["safe.platecompany@gmail.com"],
      subject: `Payment claim: ${productLabel} — ${restaurantName}`,
      html,
      replyTo: email,
      track_opens: true,
    });

    if (error) {
      console.error("[SafePlate] Failed to send payment claim email:", error);
      return;
    }

    console.log(`[SafePlate] Payment claim email sent for ${restaurantName} (${product})`);
  } catch (err) {
    console.error("[SafePlate] Unexpected error sending payment claim email:", err);
  }
}

/**
 * Sends a notification to the owner when a community member suggests a restaurant.
 *
 * Fire-and-forget (don't await) so submission latency isn't affected.
 */
export async function sendCommunitySuggestionNotification({
  restaurantName,
  city,
}: {
  restaurantName: string;
  city: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[SafePlate] RESEND_API_KEY is not set — skipping community suggestion notification email.",
    );
    return;
  }

  const resend = new Resend(apiKey);

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${BRAND.headline};margin:0 0 16px 0;">
      &#127860;&#65039; New Restaurant Suggestion
    </h1>

    <!-- Summary card -->
    <div style="background-color:${BRAND.subtle};border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tr>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:${BRAND.headline};width:90px;">Restaurant</td>
          <td style="padding:6px 0;font-size:14px;color:${BRAND.body};font-weight:600;">${restaurantName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:${BRAND.headline};">City</td>
          <td style="padding:6px 0;font-size:14px;color:${BRAND.body};">${city}</td>
        </tr>
      </table>
    </div>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 16px 0;">
      A community member suggested <strong style="color:${BRAND.headline};">${restaurantName}</strong> in <strong style="color:${BRAND.headline};">${city}</strong>. Review and verify this listing in the admin panel.
    </p>

    ${emailButton("Review in Admin →", `${SITE_URL}/admin/restaurants`)}`;

  const html = wrapEmail(content);

  try {
    const { error } = await resend.emails.send({
      from: "SafePlate <hello@safeplate.company>",
      to: ["safe.platecompany@gmail.com"],
      subject: `New Restaurant Suggestion: ${restaurantName} in ${city}`,
      html,
      track_opens: true,
    });

    if (error) {
      console.error("[SafePlate] Failed to send community suggestion notification email:", error);
      return;
    }

    console.log(`[SafePlate] Community suggestion notification email sent for ${restaurantName} in ${city}`);
  } catch (err) {
    console.error("[SafePlate] Unexpected error sending community suggestion notification email:", err);
  }
}

/**
 * Sends an admin-composed email to a restaurant.
 *
 * Fire-and-forget (don't await) so the admin UI isn't blocked.
 */
export async function sendAdminRestaurantEmail({
  restaurantName,
  toEmail,
  subject,
  body,
  restaurantId,
}: {
  restaurantName: string;
  toEmail: string;
  subject: string;
  body: string;
  restaurantId?: number;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[SafePlate] RESEND_API_KEY is not set — skipping admin restaurant email.",
    );
    return;
  }

  const resend = new Resend(apiKey);

  // Convert plain-text newlines to <br> for HTML email
  const bodyHtml = body.replace(/\n/g, "<br>");

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${BRAND.headline};margin:0 0 16px 0;">
      A message about ${restaurantName}
    </h1>

    <div style="background-color:${BRAND.subtle};border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:8px;">
      <p style="font-size:15px;line-height:1.7;color:${BRAND.body};margin:0;">
        ${bodyHtml}
      </p>
    </div>

    <p style="font-size:14px;line-height:1.6;color:${BRAND.footer};margin:16px 0 0 0;">
      Reply directly to this email if you have questions.
    </p>`;

  // Insert sent-event tracking if restaurantId provided
  if (restaurantId) {
    try {
      const { sql } = await import("~/db");
      const { createEmailTrackingTable, insertEmailTracking } = await import("~/db/restaurants");
      await createEmailTrackingTable(sql());
      await insertEmailTracking(sql(), restaurantId, toEmail);
    } catch (err) {
      console.error("[SafePlate] Failed to insert email tracking:", err);
    }
  }

  const html = wrapEmail(content);

  try {
    const { error } = await resend.emails.send({
      from: "SafePlate <hello@safeplate.company>",
      to: [toEmail],
      subject: `SafePlate — ${subject}`,
      html,
      replyTo: "safe.platecompany@gmail.com",
      track_opens: true,
    });

    if (error) {
      console.error("[SafePlate] Failed to send admin restaurant email:", error);
      return;
    }

    console.log(
      `[SafePlate] Admin email sent to ${toEmail} about ${restaurantName}`,
    );
  } catch (err) {
    console.error(
      "[SafePlate] Unexpected error sending admin restaurant email:",
      err,
    );
  }
}

/**
 * Sends an alert notification to premium users who have saved the restaurant
 * where a safety alert was just filed.
 *
 * Fire-and-forget (don't await). Called from submitSafetyAlert.
 */
export async function sendPremiumAlertNotification({
  restaurantId,
  restaurantName,
  alertType,
  description,
}: {
  restaurantId: number;
  restaurantName: string;
  alertType: string;
  description: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[SafePlate] RESEND_API_KEY is not set — skipping premium alert emails.",
    );
    return;
  }

  // Dynamically import sql to query premium users who saved this restaurant
  const { sql } = await import("~/db");
  const rows = await sql()`
    select distinct up.email
    from user_profiles up
    join saved_restaurants sr on sr.user_email = up.email
    where sr.restaurant_id = ${restaurantId}
      and up.premium_until > now()
  ` as { email: string }[];

  if (rows.length === 0) return;

  const typeLabels: Record<string, string> = {
    ingredient_change: "Ingredient change",
    menu_change: "Menu item change",
    protocol_change: "Protocol change",
    other: "Other",
  };
  const typeLabel = typeLabels[alertType] ?? alertType;

  const resend = new Resend(apiKey);
  const subject = `⚠️ Safety Alert: ${restaurantName}`;

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${BRAND.headline};margin:0 0 16px 0;">
      &#9888;&#65039; Safety Alert: ${restaurantName}
    </h1>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 16px 0;">
      A safety alert was filed for <strong style="color:${BRAND.headline};">${restaurantName}</strong>, a restaurant you&rsquo;ve saved on SafePlate.
    </p>

    <!-- Warning box -->
    <div style="background-color:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
        <tr>
          <td style="padding:4px 0;font-size:14px;font-weight:600;color:${BRAND.headline};width:90px;">Alert Type</td>
          <td style="padding:4px 0;font-size:14px;color:${BRAND.body};">${typeLabel}</td>
        </tr>
      </table>

      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #fde68a;">
        <div style="font-size:13px;font-weight:600;color:${BRAND.headline};margin-bottom:4px;">Description</div>
        <div style="font-size:14px;line-height:1.6;color:${BRAND.body};">${description}</div>
      </div>
    </div>

    ${emailButton("View on SafePlate →", `${SITE_URL}/search`)}

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0;">
      Stay safe,<br>
      The SafePlate Team
    </p>`;

  const html = wrapEmail(content);

  // Send to each premium user individually (batching would be ideal but Resend free tier limits)
  for (const row of rows) {
    try {
      const { error } = await resend.emails.send({
        from: "SafePlate <hello@safeplate.company>",
        to: [row.email],
        subject,
        html,
        track_opens: true,
      });
      if (error) {
        console.error(`[SafePlate] Failed to send premium alert to ${row.email}:`, error);
      }
    } catch (err) {
      console.error(`[SafePlate] Unexpected error sending premium alert to ${row.email}:`, err);
    }
  }

  console.log(`[SafePlate] Premium alert notifications sent to ${rows.length} users for ${restaurantName}`);
}

// ─── Drip Campaign Follow-Up Emails ──────────────────────────────────────

/**
 * Follow-up #1 (Day 3) — "Quick follow-up"
 * Sent 3 days after the initial email if no response.
 */
export async function sendDripFollowUp1({
  restaurantName,
  toEmail,
  restaurantId,
}: {
  restaurantName: string;
  toEmail: string;
  restaurantId: number;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[SafePlate] RESEND_API_KEY is not set — skipping drip follow-up #1.");
    return;
  }

  const resend = new Resend(apiKey);

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${BRAND.headline};margin:0 0 16px 0;">
      Quick follow-up about ${restaurantName}
    </h1>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 16px 0;">
      Hi there,
    </p>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 16px 0;">
      I wanted to quickly follow up on my email from a few days ago about <strong style="color:${BRAND.headline};">${restaurantName}</strong>'s SafePlate listing.
    </p>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 16px 0;">
      No pressure at all — just wanted to make sure it didn&rsquo;t get buried in your inbox. If you have any questions about how SafePlate works or what claiming your listing involves, I&rsquo;m happy to help.
    </p>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 8px 0;">
      You can claim your listing in under 2 minutes at:
    </p>

    ${emailButton("Claim Your Listing →", `${SITE_URL}/claim`)}

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:8px 0 0 0;">
      Best,<br>
      The SafePlate Team
    </p>`;

  const html = wrapEmail(content);

  // Track the send
  if (restaurantId) {
    try {
      const { sql } = await import("~/db");
      const { createEmailTrackingTable, insertEmailTracking } = await import("~/db/restaurants");
      await createEmailTrackingTable(sql());
      await insertEmailTracking(sql(), restaurantId, toEmail);
    } catch (err) {
      console.error("[SafePlate] Failed to insert email tracking for drip #1:", err);
    }
  }

  try {
    const { error } = await resend.emails.send({
      from: "SafePlate <hello@safeplate.company>",
      to: [toEmail],
      subject: `Re: SafePlate — ${restaurantName}`,
      html,
      replyTo: "safe.platecompany@gmail.com",
      track_opens: true,
    });

    if (error) {
      console.error("[SafePlate] Failed to send drip follow-up #1:", error);
      return;
    }

    console.log(`[SafePlate] Drip follow-up #1 sent to ${toEmail} for ${restaurantName}`);
  } catch (err) {
    console.error("[SafePlate] Unexpected error sending drip follow-up #1:", err);
  }
}

/**
 * Follow-up #2 (Day 7) — "Last chance for free upgrade"
 * Sent 7 days after the initial email if no response.
 */
export async function sendDripFollowUp2({
  restaurantName,
  toEmail,
  restaurantId,
}: {
  restaurantName: string;
  toEmail: string;
  restaurantId: number;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[SafePlate] RESEND_API_KEY is not set — skipping drip follow-up #2.");
    return;
  }

  const resend = new Resend(apiKey);

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${BRAND.headline};margin:0 0 16px 0;">
      Free Tier 1 upgrade opportunity for ${restaurantName}
    </h1>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 16px 0;">
      Hi there,
    </p>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 16px 0;">
      I&rsquo;ve reached out a couple times about <strong style="color:${BRAND.headline};">${restaurantName}</strong>'s listing on SafePlate. I wanted to make sure you knew — if you verify your kitchen protocols, we can upgrade you to Tier 1 (Medical-Grade) for free. This gives you:
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin-bottom:20px;">
      <tr>
        <td style="padding-bottom:10px;vertical-align:top;width:24px;">
          <span style="font-size:16px;">&#x1F7E2;</span>
        </td>
        <td style="padding-bottom:10px;font-size:15px;line-height:1.5;color:${BRAND.body};">
          <strong style="color:${BRAND.headline};">Green &ldquo;Medical-Grade&rdquo; badge</strong> in search results
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:10px;vertical-align:top;">
          <span style="font-size:16px;">&#x1F3C6;</span>
        </td>
        <td style="padding-bottom:10px;font-size:15px;line-height:1.5;color:${BRAND.body};">
          <strong style="color:${BRAND.headline};">Top placement</strong> over Tier 2 and Tier 3 restaurants
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:0;vertical-align:top;">
          <span style="font-size:16px;">&#x1F4F0;</span>
        </td>
        <td style="padding-bottom:0;font-size:15px;line-height:1.5;color:${BRAND.body};">
          <strong style="color:${BRAND.headline};">Featured in our city guides</strong> and blog content
        </td>
      </tr>
    </table>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 16px 0;">
      All we need is confirmation of your protocols. Claim your listing here:
    </p>

    ${emailButton("Claim Your Listing →", `${SITE_URL}/claim`)}

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:16px 0 8px 0;">
      This is our final automated check-in. If you&rsquo;re not interested, no worries at all — we&rsquo;ll keep your current listing as-is.
    </p>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:8px 0 0 0;">
      Best,<br>
      The SafePlate Team
    </p>`;

  const html = wrapEmail(content);

  // Track the send
  if (restaurantId) {
    try {
      const { sql } = await import("~/db");
      const { createEmailTrackingTable, insertEmailTracking } = await import("~/db/restaurants");
      await createEmailTrackingTable(sql());
      await insertEmailTracking(sql(), restaurantId, toEmail);
    } catch (err) {
      console.error("[SafePlate] Failed to insert email tracking for drip #2:", err);
    }
  }

  try {
    const { error } = await resend.emails.send({
      from: "SafePlate <hello@safeplate.company>",
      to: [toEmail],
      subject: `${restaurantName} — Free Tier 1 upgrade opportunity`,
      html,
      replyTo: "safe.platecompany@gmail.com",
      track_opens: true,
    });

    if (error) {
      console.error("[SafePlate] Failed to send drip follow-up #2:", error);
      return;
    }

    console.log(`[SafePlate] Drip follow-up #2 sent to ${toEmail} for ${restaurantName}`);
  } catch (err) {
    console.error("[SafePlate] Unexpected error sending drip follow-up #2:", err);
  }
}

// ─── Password Reset Email ──────────────────────────────────────────────

/**
 * Sends a password reset email with a secure link.
 *
 * Fire-and-forget (don't await) so the password reset request responds quickly.
 */
export async function sendPasswordResetEmail({
  email,
  resetLink,
}: {
  email: string;
  resetLink: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[SafePlate] RESEND_API_KEY is not set — skipping password reset email.",
    );
    return;
  }

  const resend = new Resend(apiKey);

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${BRAND.headline};margin:0 0 16px 0;">
      Reset your SafePlate password
    </h1>

    <p style="font-size:15px;line-height:1.6;color:${BRAND.body};margin:0 0 16px 0;">
      You requested a password reset for your SafePlate account. Click the button below to set a new password.
    </p>

    ${emailButton("Reset Your Password →", resetLink)}

    <p style="font-size:13px;line-height:1.6;color:${BRAND.footer};margin:0;">
      This link will expire in 1 hour. If you didn&rsquo;t request this reset, you can safely ignore this email.
    </p>`;

  const html = wrapEmail(content);

  try {
    const { error } = await resend.emails.send({
      from: "SafePlate <hello@safeplate.company>",
      to: [email],
      subject: "Reset your SafePlate password",
      html,
      track_opens: true,
    });

    if (error) {
      console.error("[SafePlate] Failed to send password reset email:", error);
      return;
    }

    console.log(`[SafePlate] Password reset email sent to ${email}`);
  } catch (err) {
    console.error("[SafePlate] Unexpected error sending password reset email:", err);
  }
}
