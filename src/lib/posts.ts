import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { supabase } from './supabase';

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  imageUrl?: string;
  contentHtml: string;
  source?: 'supabase' | 'static'; // Track source for debugging
}

export async function getSortedPostsData(): Promise<Post[]> {
  const posts: Post[] = [];

  // 1. Fetch published posts from Supabase (if configured)
  if (supabase) {
    try {
      const { data: supabasePosts, error } = await supabase
        .from('posts')
        .select('slug, title, published_at, excerpt, image_url, content')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (!error && supabasePosts) {
        posts.push(...supabasePosts.map(post => ({
          slug: post.slug,
          title: post.title,
          date: post.published_at || new Date().toISOString(),
          excerpt: post.excerpt || undefined,
          imageUrl: post.image_url || undefined,
          contentHtml: '', // Will be populated when needed
          source: 'supabase' as const,
        })));
      }
    } catch (error) {
      console.error('Error fetching from Supabase:', error);
    }
  }

  // 2. Fetch static posts from YAML file
  try {
    const indexPath = path.join(process.cwd(), 'public', 'posts-index.yaml');
    const fileContent = await fs.readFile(indexPath, 'utf8');
    const staticPosts: Post[] = yaml.load(fileContent) as Post[];

    // Add static posts that don't conflict with Supabase posts
    const supabaseSlugs = new Set(posts.map(p => p.slug));
    staticPosts.forEach(post => {
      if (!supabaseSlugs.has(post.slug)) {
        posts.push({
          ...post,
          source: 'static' as const,
        });
      }
    });
  } catch (error) {
    console.error('Error reading static posts:', error);
  }

  // 3. Sort all posts by date in descending order
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
