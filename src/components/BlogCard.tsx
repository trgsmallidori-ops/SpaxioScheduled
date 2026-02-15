import Link from "next/link";
import type { BlogPost } from "@/lib/blog";
import { format } from "date-fns";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="rounded-2xl bg-[var(--surface)] shadow-soft p-6 transition hover:shadow-md">
      <Link href={`/blog/${post.slug}`} className="block no-underline group">
        <time
          dateTime={post.date}
          className="text-sm font-medium text-[var(--muted)]"
        >
          {format(new Date(post.date), "MMMM d, yyyy")}
        </time>
        <h2 className="mt-2 text-xl font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition">
          {post.title}
        </h2>
        <p className="mt-2 text-base text-[var(--text-secondary)] line-clamp-2">
          {post.description}
        </p>
        <span className="mt-3 inline-block text-sm font-semibold text-[var(--accent)]">
          Read more →
        </span>
      </Link>
    </article>
  );
}
