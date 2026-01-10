import { notFound } from 'next/navigation';
import { remark } from 'remark';
import html from 'remark-html';
import yaml from 'js-yaml';
import Image from 'next/image';
import Link from 'next/link';
import Header from "@/components/Header";
import { getSortedPostsData, Post } from '@/lib/posts';
import { supabase } from '@/lib/supabase';
import path from 'path';
import { promises as fs } from 'fs';

// Helper function to safely format dates
function formatPostDate(dateString: string): string {
  try {
    // Attempt to parse dd/mm/yyyy format
    const parts = dateString.split('/');
    let date: Date;
    if (parts.length === 3) {
      // Reassemble to YYYY-MM-DD for consistent parsing
      const isoDateString = `${parts[2]}-${parts[1]}-${parts[0]}`;
      date = new Date(isoDateString);
    } else {
      // Fallback for other formats or if it's already YYYY-MM-DD
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return 'N/A'; // Return 'N/A' for invalid dates
    }
    return date.toLocaleString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'N/A';
  }
}

async function getPostContent(slug: string): Promise<Post | null> {
  // 1. Try fetching from Supabase first
  if (supabase) {
    try {
      const { data: post, error } = await supabase
        .from('posts')
        .select('slug, title, published_at, excerpt, image_url, content')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (!error && post) {
        // Convert markdown content to HTML
        const processedContent = await remark().use(html).process(post.content);
        const contentHtml = processedContent.toString();

        return {
          slug: post.slug,
          title: post.title,
          date: post.published_at || new Date().toISOString(),
          excerpt: post.excerpt || undefined,
          imageUrl: post.image_url || undefined,
          contentHtml,
          source: 'supabase',
        };
      }
    } catch (error) {
      console.error(`Error fetching post from Supabase:`, error);
    }
  }

  // 2. Fall back to static markdown file
  const filePath = path.join(process.cwd(), 'public', 'posts', `${slug}.md`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf8');

    const frontMatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
    interface FrontMatter {
      title: string;
      date: string;
      imageUrl?: string;
      [key: string]: unknown;
    }

    let frontMatter: FrontMatter = { title: '', date: '' };
    let markdownContent = fileContent;

    if (frontMatterMatch && frontMatterMatch[1]) {
      frontMatter = yaml.load(frontMatterMatch[1]) as FrontMatter;
      markdownContent = fileContent.substring(frontMatterMatch[0].length);
    }

    const processedContent = await remark().use(html).process(markdownContent);
    const contentHtml = processedContent.toString();

    let imageUrl = (frontMatter.imageUrl as string) || undefined;

    // Ensure local image URLs are correctly prefixed for static assets
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
      imageUrl = `/posts/${imageUrl}`;
    }

    return {
      slug,
      title: frontMatter.title || slug,
      date: frontMatter.date || '',
      contentHtml,
      imageUrl: imageUrl || undefined,
      source: 'static',
    };
  } catch (error) {
    console.error(`Error reading or parsing post ${slug}:`, error);
    return null;
  }
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const allPosts = await getSortedPostsData();
  return allPosts.map(post => ({ slug: post.slug }));
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const slug = params.slug as string;
  const post = await getPostContent(slug);

  if (!post) {
    notFound();
  }

  const allPosts = await getSortedPostsData();
  const currentIndex = allPosts.findIndex(p => p.slug === slug);
  const previousPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-24">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-screen-xl bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl md:text-5xl font-lora font-bold mb-4 text-[#2B1E1A] leading-tight">
        {post.title}
      </h1>
      <p className="text-gray-600 text-sm mb-6 font-roboto">Published on: {formatPostDate(post.date)}</p>
      <div
        className="prose prose-lg max-w-none text-[#2B1E1A] font-roboto"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      {/* Next/Previous Post Navigation */}
      <nav className="flex justify-between mt-12 pt-8 border-t border-gray-200">
        {previousPost && (
          <Link href={`/posts/${previousPost.slug}`} className="text-[#861D1D] hover:text-[#F4B34C] transition-colors duration-300 font-semibold">
            &larr; Previous Post
          </Link>
        )}
        {nextPost && (
          <Link href={`/posts/${nextPost.slug}`} className="text-[#861D1D] hover:text-[#F4B34C] transition-colors duration-300 font-semibold ml-auto">
            Next Post &rarr;
          </Link>
        )}
      </nav>
    </div>
    </main>
  );
}
