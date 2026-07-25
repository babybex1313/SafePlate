import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

// ── Table creation (idempotent) ──────────────────────────────────────────────

export async function createBlogSubmissionsTable(
  sqlClient: ReturnType<typeof import("@neondatabase/serverless").neon>,
) {
  await sqlClient`create table if not exists blog_submissions (
    id serial primary key,
    title text not null,
    content text not null,
    author_name text not null,
    author_email text not null,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamptz default now(),
    reviewed_at timestamptz,
    review_notes text,
    slug text
  )`;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface BlogSubmission {
  id: number;
  title: string;
  content: string;
  author_name: string;
  author_email: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  slug: string | null;
}

export interface BlogPost {
  slug: string;
  title: string;
  content: string;
  author_name: string;
  published_at: string;
}

// ── Submit a blog post (public, no auth required) ────────────────────────────

export const submitBlogPost = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: {
      title: string;
      content: string;
      author_name: string;
      author_email: string;
    };
  }) => {
    const { title, content, author_name, author_email } = data;

    if (!title?.trim()) return { success: false, error: "Title is required." };
    if (!content?.trim()) return { success: false, error: "Content is required." };
    if (!author_name?.trim()) return { success: false, error: "Your name is required." };
    if (!author_email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author_email)) {
      return { success: false, error: "A valid email address is required." };
    }

    await createBlogSubmissionsTable(sql());

    await sql()`
      insert into blog_submissions (title, content, author_name, author_email)
      values (${title.trim()}, ${content.trim()}, ${author_name.trim()}, ${author_email.trim().toLowerCase()})
    `;

    return { success: true };
  },
);

// ── Admin: get all submissions ───────────────────────────────────────────────

export const getBlogSubmissions = createServerFn({ method: "GET" }).handler(
  async () => {
    await createBlogSubmissionsTable(sql());

    const rows = await sql()`
      select id, title, content, author_name, author_email, status,
             created_at, reviewed_at, review_notes, slug
      from blog_submissions
      order by created_at desc
    `;

    return rows.map((row: Record<string, unknown>) => ({
      ...row,
      created_at: String(row.created_at),
      reviewed_at: row.reviewed_at ? String(row.reviewed_at) : null,
    })) as BlogSubmission[];
  },
);

// ── Admin: approve a submission ──────────────────────────────────────────────

export const approveBlogPost = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { id: number; slug: string };
  }) => {
    const { id, slug } = data;

    if (!id) return { success: false, error: "Submission ID is required." };
    if (!slug?.trim()) return { success: false, error: "A slug is required for the blog post URL." };

    const trimmedSlug = slug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    await createBlogSubmissionsTable(sql());

    // Check slug uniqueness (only among approved)
    const existing = await sql()`
      select id from blog_submissions where slug = ${trimmedSlug} and status = 'approved' limit 1
    `;
    if (existing.length > 0) {
      return { success: false, error: `Slug "${trimmedSlug}" is already in use. Choose a different one.` };
    }

    const rows = await sql()`
      select id, status from blog_submissions where id = ${id} limit 1
    `;
    if (rows.length === 0) return { success: false, error: "Submission not found." };
    if (rows[0].status !== "pending") {
      return { success: false, error: "Submission is not pending — it's already " + rows[0].status + "." };
    }

    await sql()`
      update blog_submissions
      set status = 'approved', reviewed_at = now(), slug = ${trimmedSlug}
      where id = ${id}
    `;

    return { success: true, slug: trimmedSlug };
  },
);

// ── Admin: reject a submission ───────────────────────────────────────────────

export const rejectBlogPost = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { id: number; notes?: string };
  }) => {
    const { id, notes } = data;

    if (!id) return { success: false, error: "Submission ID is required." };

    await createBlogSubmissionsTable(sql());

    const rows = await sql()`
      select id, status from blog_submissions where id = ${id} limit 1
    `;
    if (rows.length === 0) return { success: false, error: "Submission not found." };
    if (rows[0].status !== "pending") {
      return { success: false, error: "Submission is not pending — it's already " + rows[0].status + "." };
    }

    await sql()`
      update blog_submissions
      set status = 'rejected', reviewed_at = now(), review_notes = ${notes?.trim() ?? null}
      where id = ${id}
    `;

    return { success: true };
  },
);

// ── Public: get approved blog post by slug (for the blog page) ──────────────

export const getApprovedBlogPostBySlug = createServerFn({ method: "GET" }).handler(
  async ({
    data,
  }: {
    data: { slug: string };
  }) => {
    const { slug } = data;

    if (!slug?.trim()) return null;

    await createBlogSubmissionsTable(sql());

    const rows = await sql()`
      select id, title, content, author_name, author_email, status,
             created_at, reviewed_at, review_notes, slug
      from blog_submissions
      where slug = ${slug.trim()}
        and status = 'approved'
      limit 1
    `;

    if (rows.length === 0) return null;

    const row = rows[0] as Record<string, unknown>;
    return {
      id: row.id as number,
      title: row.title as string,
      content: row.content as string,
      author_name: row.author_name as string,
      author_email: row.author_email as string,
      status: row.status as string,
      created_at: String(row.created_at),
      reviewed_at: row.reviewed_at ? String(row.reviewed_at) : null,
      review_notes: row.review_notes as string | null,
      slug: row.slug as string | null,
    } as BlogSubmission;
  },
);

// ── Public: get all approved blog posts (for index/catalog) ──────────────────

export const getApprovedBlogPosts = createServerFn({ method: "GET" }).handler(
  async () => {
    await createBlogSubmissionsTable(sql());

    const rows = await sql()`
      select slug, title, content, author_name, created_at
      from blog_submissions
      where status = 'approved'
      order by created_at desc
    `;

    return rows.map((row: Record<string, unknown>) => ({
      slug: row.slug as string,
      title: row.title as string,
      content: row.content as string,
      author_name: row.author_name as string,
      published_at: String(row.created_at),
    })) as BlogPost[];
  },
);
