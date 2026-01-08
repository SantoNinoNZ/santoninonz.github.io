import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import TurndownService from 'turndown';
import yaml from 'js-yaml';

async function fetchWithRetry(url, retries = 5, initialDelay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          // This tells the server you are a standard Chrome browser
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });
      
      if (res.ok) {
        return await res.json();
      } else {
        console.warn(`Fetch failed for ${url}, status: ${res.status}. Retrying...`);
        // If it's a 403, the server is blocking us specifically
        if (res.status === 403) {
           console.error("Access Forbidden (403). The server is blocking the script.");
        }
      }
    } catch (error) {
      console.error(`Fetch error for ${url}: ${error}. Retrying...`);
    }
    const delay = initialDelay * Math.pow(2, i);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries.`);
}

async function getAllPosts() {
  let allPosts = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    try {
      // Using the alternate rest_route parameter which often bypasses 404 issues
      const url = `http://santonino-nz.org/?rest_route=/wp/v2/posts&_embed&per_page=${perPage}&page=${page}`;
      const posts = await fetchWithRetry(url);
      
      if (!posts || posts.length === 0) {
        break;
      }
      allPosts = allPosts.concat(posts);
      console.log(`Fetched page ${page}, total posts: ${allPosts.length}`);
      page++;
    } catch (error) {
      console.error(`Error fetching posts: ${error.message}`);
      break;
    }
  }
  return allPosts;
}

function decodeHtmlEntities(html) {
  return html
    .replace(/&#8211;/g, '–')
    .replace(/&/g, '&') // Corrected to handle &
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/"/g, '"')
    .replace(/&hellip;/g, '...');
}

async function downloadFile(url, filepath) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download ${url}: ${response.statusText}`);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    return true;
  } catch (error) {
    console.error(`Error downloading file ${url}: ${error.message}`);
    return false;
  }
}

async function scrapePosts() {
  const posts = await getAllPosts();
  const outputDir = path.join(process.cwd(), 'public', 'posts'); // Directly write to public/posts
  const assetsDir = path.join(outputDir, 'assets'); // New directory for other assets like PDFs
  const imagesDir = path.join(assetsDir, 'images');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const turndownService = new TurndownService();
  const allPostsMetadata = [];

  for (const post of posts) {
    const slug = post.slug;
    const title = decodeHtmlEntities(post.title.rendered);
    const contentHtml = decodeHtmlEntities(post.content.rendered);
    const date = new Date(post.date);
    const formattedDate = date.toISOString(); // Store full ISO string including time

    let imageUrl = null;
    let localImageUrl = null; // To store the local path for the front matter
    const imageUrlMatch = contentHtml.match(/<img[^>]+src="([^">]+)"/);
    if (imageUrlMatch) {
      imageUrl = imageUrlMatch[1].replace(/&#038;/g, '&').replace(/\\/g, '/'); // Normalize original URL
      const imageFileName = path.basename(new URL(imageUrl).pathname);
      localImageUrl = `/posts/assets/images/${imageFileName}`; // Relative path for front matter
    } else if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'].length > 0) {
      const featuredMedia = post._embedded._embedded['wp:featuredmedia'][0];
      imageUrl = (featuredMedia.media_details?.sizes?.medium?.source_url || featuredMedia.source_url || null)?.replace(/\\/g, '/'); // Normalize original URL
      if (imageUrl) {
        const imageFileName = path.basename(new URL(imageUrl).pathname);
        localImageUrl = `/posts/assets/images/${imageFileName}`; // Relative path for front matter
      }
    }

    let processedContentHtml = contentHtml;

    // Function to normalize URL and extract filename
    const normalizeUrlAndGetFilename = (url) => {
      try {
        const urlObj = new URL(url);
        // Remove query parameters and hash for cleaner filename extraction
        urlObj.search = '';
        urlObj.hash = '';
        // Remove /wp-content/uploads/YYYY/MM/ from path if present
        let pathname = urlObj.pathname.replace(/\/wp-content\/uploads\/\d{4}\/\d{2}\//, '/');
        // Decode URI components to handle special characters in filenames
        pathname = decodeURIComponent(pathname);
        return path.basename(pathname);
      } catch (e) {
        console.warn(`Could not parse URL: ${url}. Error: ${e.message}`);
        return null;
      }
    };

    // Helper to create a robust regex for replacement
    const createReplacementRegex = (url) => {
      // Escape special regex characters and handle potential variations like &
      // Also handle the i0.wp.com subdomain for WordPress.com image optimization
      const escapedUrl = url
        .replace(/&#038;/g, '&')
        .replace(/https:\/\/i\d+\.wp\.com\//g, 'http://santonino-nz.org/') // Replace i0.wp.com with original domain
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Consider variations with and without query parameters or hashes in the original HTML
      return new RegExp(`${escapedUrl}(?:\\?|#|$)`, 'g');
    };

    const imageMatches = contentHtml.matchAll(/<img[^>]+src="([^">]+)"/g);
    for (const match of imageMatches) {
      const originalImageUrl = match[1].replace(/&#038;/g, '&'); // Decode & before processing
      const imageFileName = normalizeUrlAndGetFilename(originalImageUrl);

      if (imageFileName) {
        const localImagePath = path.join(imagesDir, imageFileName);
        const relativeImagePath = path.posix.join('/posts', 'assets', 'images', imageFileName);

        if (await downloadFile(originalImageUrl, localImagePath)) {
          processedContentHtml = processedContentHtml.replace(createReplacementRegex(originalImageUrl), relativeImagePath);
        }
      }
    }

    // Handle PDF links
    const pdfMatches = contentHtml.matchAll(/<a[^>]+href="([^">]+\.pdf)"[^>]*>/g);
    for (const match of pdfMatches) {
      const originalPdfUrl = match[1].replace(/&#038;/g, '&'); // Decode & before processing
      const pdfFileName = normalizeUrlAndGetFilename(originalPdfUrl);

      if (pdfFileName) {
        const localPdfPath = path.join(assetsDir, pdfFileName);
        const relativePdfPath = path.posix.join('/posts', 'assets', pdfFileName);

        if (await downloadFile(originalPdfUrl, localPdfPath)) {
          processedContentHtml = processedContentHtml.replace(createReplacementRegex(originalPdfUrl), relativePdfPath);
        }
      }
    }

    const markdownContent = turndownService.turndown(processedContentHtml);

    const frontMatter = `---
title: "${title}"
date: "${formattedDate}"
slug: "${slug}"
${localImageUrl ? `imageUrl: "${localImageUrl}"` : ''}
---

`;

    const fileName = path.join(outputDir, `${slug}.md`);
    fs.writeFileSync(fileName, frontMatter + markdownContent);
    console.log(`Scraped: ${title} -> ${fileName}`);

    allPostsMetadata.push({
      title: title,
      slug: slug,
      date: date.toISOString(), // Store as ISO string for consistent sorting
    });
  }

  // Sort posts by date in descending order
  allPostsMetadata.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Write index.yaml
  const indexYamlPath = path.join(outputDir, 'index.yaml');
  fs.writeFileSync(indexYamlPath, yaml.dump(allPostsMetadata));
  console.log(`Generated index.yaml at ${indexYamlPath}`);

  console.log('Scraping complete!');
}

scrapePosts();
