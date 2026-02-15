import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { getPostBySlug, getAllSlugs } from "@/lib/blog";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    ...pageMeta({
      title: post.title,
      description: post.description,
      path: `/blog/${slug}`,
    }),
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${SITE_URL}/blog/${slug}`,
      siteName: "SpaxioScheduled",
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

function buildArticleSchema(post: { title: string; description: string; date: string; author: string; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "SpaxioScheduled",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    url: `${SITE_URL}/blog/${post.slug}`,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const articleSchema = buildArticleSchema(post);

  return (
    <article className="mx-auto max-w-3xl bg-[var(--bg)] px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
          <li>
            <Link href="/" className="hover:text-[var(--accent)]">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/blog" className="hover:text-[var(--accent)]">
              Blog
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-[var(--text)]" aria-current="page">
            {post.title}
          </li>
        </ol>
      </nav>
      <header>
        <h1 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
          <time dateTime={post.date}>
            {format(new Date(post.date), "MMMM d, yyyy")}
          </time>
          <span>by {post.author}</span>
        </div>
      </header>
      <div className="prose prose-lg mt-8 max-w-none prose-headings:text-[var(--text)] prose-p:text-[var(--text-secondary)] prose-a:text-[var(--accent)] prose-strong:text-[var(--text)]">
        <ReactMarkdown
          components={{
            a: ({ href, children }) => {
              const isInternal = href?.startsWith("/");
              if (isInternal && href) {
                return (
                  <Link href={href} className="font-semibold hover:underline">
                    {children}
                  </Link>
                );
              }
              return (
                <a
                  href={href ?? "#"}
                  target={href?.startsWith("http") ? "_blank" : undefined}
                  rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="font-semibold hover:underline"
                >
                  {children}
                </a>
              );
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
      <footer className="mt-12 border-t border-[var(--divider)] pt-8">
        <Link
          href="/blog"
          className="text-sm font-semibold text-[var(--accent)] hover:underline"
        >
          ← Back to Blog
        </Link>
        <div className="mt-6">
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white no-underline transition hover:bg-[var(--accent-hover)]"
          >
            Try SpaxioScheduled free
          </Link>
        </div>
      </footer>
    </article>
  );
}
