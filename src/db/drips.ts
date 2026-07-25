import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

// ── Table: email_drips ───────────────────────────────────────────────────────

export async function createEmailDripsTable(
  sqlClient: ReturnType<typeof import("@neondatabase/serverless").neon>,
) {
  await sqlClient`create table if not exists email_drips (
    id serial primary key,
    restaurant_id integer not null references restaurants(id),
    recipient_email text not null,
    template_used text not null,
    drip_stage integer default 1, -- 1=initial, 2=followup1, 3=followup2
    sent_at timestamptz default now(),
    next_drip_at timestamptz
  )`;
}

// ── Insert drip record ───────────────────────────────────────────────────────

export async function insertEmailDrip(
  sqlClient: ReturnType<typeof import("@neondatabase/serverless").neon>,
  restaurantId: number,
  recipientEmail: string,
  templateUsed: string,
): Promise<void> {
  await sqlClient`
    insert into email_drips (restaurant_id, recipient_email, template_used, drip_stage, next_drip_at)
    values (${restaurantId}, ${recipientEmail}, ${templateUsed}, 1, now() + interval '3 days')
  `;
}

// ── Get all drips (for admin) ───────────────────────────────────────────────

export interface DripRow {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  restaurant_city: string;
  recipient_email: string;
  template_used: string;
  drip_stage: number;
  sent_at: string;
  next_drip_at: string | null;
}

export const getDrips = createServerFn({ method: "GET" }).handler(async () => {
  await createEmailDripsTable(sql());
  const rows = await sql()`
    select
      ed.id,
      ed.restaurant_id,
      ed.recipient_email,
      ed.template_used,
      ed.drip_stage,
      ed.sent_at,
      ed.next_drip_at,
      r.name as restaurant_name,
      r.city as restaurant_city
    from email_drips ed
    join restaurants r on r.id = ed.restaurant_id
    order by ed.next_drip_at asc nulls last, ed.sent_at desc
  `;
  return rows.map((row: Record<string, unknown>) => ({
    ...row,
    sent_at: String(row.sent_at),
    next_drip_at: row.next_drip_at ? String(row.next_drip_at) : null,
  })) as DripRow[];
});

// ── Process due drips ───────────────────────────────────────────────────────

export const processDrips = createServerFn({ method: "POST" }).handler(async () => {
  await createEmailDripsTable(sql());

  // Query drips that are due (next_drip_at <= now()) and still in progress (stage 1 or 2)
  const dueRows = await sql()`
    select
      ed.id,
      ed.restaurant_id,
      ed.recipient_email,
      ed.template_used,
      ed.drip_stage,
      r.name as restaurant_name
    from email_drips ed
    join restaurants r on r.id = ed.restaurant_id
    where ed.next_drip_at <= now()
      and ed.drip_stage < 3
  ` as { id: number; restaurant_id: number; recipient_email: string; template_used: string; drip_stage: number; restaurant_name: string }[];

  if (dueRows.length === 0) {
    return { processed: 0 };
  }

  // Import email functions dynamically
  const { sendDripFollowUp1, sendDripFollowUp2 } = await import("~/email");

  let processed = 0;

  for (const drip of dueRows) {
    const nextStage = drip.drip_stage + 1;

    try {
      // Send the appropriate follow-up
      if (drip.drip_stage === 1) {
        // Send follow-up #1 (Day 3)
        await sendDripFollowUp1({
          restaurantName: drip.restaurant_name,
          toEmail: drip.recipient_email,
          restaurantId: drip.restaurant_id,
        });
      } else if (drip.drip_stage === 2) {
        // Send follow-up #2 (Day 7) — final
        await sendDripFollowUp2({
          restaurantName: drip.restaurant_name,
          toEmail: drip.recipient_email,
          restaurantId: drip.restaurant_id,
        });
      }

      // Update drip_stage and set next_drip_at
      // Stage 1 → Stage 2: next drip in 4 more days (day 7 from initial)
      // Stage 2 → Stage 3 (complete): no more drips
      const nextDripAt = nextStage < 3 ? sql({ raw: `now() + interval '4 days'` }) : null;

      if (nextDripAt) {
        await sql()`
          update email_drips
          set drip_stage = ${nextStage}, next_drip_at = now() + interval '4 days', sent_at = now()
          where id = ${drip.id}
        `;
      } else {
        await sql()`
          update email_drips
          set drip_stage = ${nextStage}, next_drip_at = null, sent_at = now()
          where id = ${drip.id}
        `;
      }

      processed++;
    } catch (err) {
      console.error(`[SafePlate] Failed to process drip ${drip.id}:`, err);
    }
  }

  return { processed };
});
