import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "@/components/BlogCard";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Blog",
    description:
      "Tips and guides for students: syllabus calendar, course outline calendar, school calendar management, and academic planning. Learn how SpaxioScheduled helps you stay organized.",
    path: "/blog",
  }),
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-4xl bg-[var(--bg)] px-6 py-12">
      <h1 className="text-3xl font-bold text-[var(--text)]">
        Blog
      </h1>
      <p className="mt-3 text-lg text-[var(--text-secondary)]">
        Tips, guides, and resources for students on syllabus calendars, course planning, and academic organization.
      </p>
      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        {posts.length === 0 ? (
          <p className="col-span-2 text-[var(--text-secondary)]">
            No posts yet. Check back soon!
          </p>
        ) : (
          posts.map((post) => <BlogCard key={post.slug} post={post} />)
        )}
      </div>
      <div className="mt-12 text-center">
        <Link
          href="/signup"
          className="inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white no-underline transition hover:bg-[var(--accent-hover)]"
        >
          Get started with SpaxioScheduled
        </Link>
      </div>
    </div>
  );
}
