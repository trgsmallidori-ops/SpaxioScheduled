import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/features`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/dashboard`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/cookies`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const posts = getAllPosts();
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages];
}
