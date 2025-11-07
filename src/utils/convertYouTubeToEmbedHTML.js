/**
 * Convert YouTube URL to WordPress Gutenberg Embed HTML
 * 
 * รองรับลิงก์:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * 
 * @param {string} url - YouTube URL
 * @param {string} caption - Caption text (optional)
 * @returns {string} HTML string หรือ URL เดิมถ้าไม่ใช่ YouTube
 * 
 * @example
 * convertYouTubeToEmbedHTML("https://www.youtube.com/shorts/eZTl8PRs1x4", "แคปชั่นใต้รูป")
 * convertYouTubeToEmbedHTML("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
 */
export function convertYouTubeToEmbedHTML(url, caption = '') {
  if (!url || typeof url !== 'string') {
    return url;
  }

  try {
    // Extract YouTube Video ID
    const videoId = extractYouTubeVideoId(url);
    
    if (!videoId) {
      return url; // Not a YouTube URL
    }

    // Check if it's a Shorts video
    const isShorts = url.includes('/shorts/');
    
    // Determine aspect ratio class
    const aspectRatioClass = isShorts 
      ? 'wp-embed-aspect-9-16' 
      : 'wp-embed-aspect-16-9';

    // Build embed URL
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

    // Build caption HTML
    const captionHtml = caption 
      ? `\n  <figcaption class="wp-element-caption"><em>${escapeHtml(caption)}</em></figcaption>` 
      : '';

    // Build complete HTML
    const html = `<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube ${aspectRatioClass} wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">
    <iframe src="${embedUrl}" width="560" height="315" frameborder="0" allowfullscreen></iframe>
  </div>${captionHtml}
</figure>`;

    return html;
  } catch (error) {
    console.error('Error converting YouTube URL to embed:', error);
    return url; // Return original URL on error
  }
}

/**
 * Extract YouTube Video ID from various URL formats
 * 
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null if not found
 */
function extractYouTubeVideoId(url) {
  if (!url) return null;

  // Remove whitespace
  url = url.trim();

  // Pattern 1: https://www.youtube.com/watch?v=VIDEO_ID
  // Pattern 2: https://www.youtube.com/watch?v=VIDEO_ID&feature=share
  const watchPattern = /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/;
  let match = url.match(watchPattern);
  if (match) return match[1];

  // Pattern 3: https://youtu.be/VIDEO_ID
  const shortPattern = /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  match = url.match(shortPattern);
  if (match) return match[1];

  // Pattern 4: https://www.youtube.com/embed/VIDEO_ID
  const embedPattern = /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  match = url.match(embedPattern);
  if (match) return match[1];

  // Pattern 5: https://www.youtube.com/shorts/VIDEO_ID
  const shortsPattern = /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  match = url.match(shortsPattern);
  if (match) return match[1];

  return null;
}

/**
 * Escape HTML special characters
 * 
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Convert YouTube Embed HTML back to simple URL
 * 
 * แปลง Gutenberg embed block กลับเป็นลิงก์ YouTube ปกติ
 * มีประโยชน์เวลา export กลับไป .docx
 * 
 * @param {string} html - HTML string ที่มี YouTube embed
 * @returns {string} YouTube URL หรือ HTML เดิมถ้าไม่พบ embed
 * 
 * @example
 * convertEmbedToYouTubeURL('<figure class="wp-block-embed..."><iframe src="https://www.youtube.com/embed/eZTl8PRs1x4"...')
 * // Returns: "https://www.youtube.com/watch?v=eZTl8PRs1x4"
 */
export function convertEmbedToYouTubeURL(html) {
  if (!html || typeof html !== 'string') {
    return html;
  }

  try {
    // Extract embed URL from iframe
    const iframePattern = /<iframe[^>]+src=["']https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})[^"']*["'][^>]*>/;
    const match = html.match(iframePattern);

    if (match && match[1]) {
      const videoId = match[1];
      
      // Check if original was a Shorts video
      const isShorts = html.includes('wp-embed-aspect-9-16');
      
      // Return appropriate URL format
      if (isShorts) {
        return `https://www.youtube.com/shorts/${videoId}`;
      } else {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    return html; // Not a YouTube embed, return original
  } catch (error) {
    console.error('Error converting embed to YouTube URL:', error);
    return html;
  }
}

/**
 * Batch convert: แปลงทุก YouTube links ใน HTML string เป็น embeds
 * 
 * @param {string} htmlContent - HTML content
 * @param {boolean} addCaption - เพิ่ม caption ว่างไว้หรือไม่ (default: false)
 * @returns {string} HTML content with embeds
 */
export function convertAllYouTubeLinksToEmbeds(htmlContent, addCaption = false) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent;
  }

  // Pattern to find YouTube URLs in <a> tags or plain text
  const youtubePattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s<]*)/g;

  return htmlContent.replace(youtubePattern, (match) => {
    return convertYouTubeToEmbedHTML(match, addCaption ? '' : null);
  });
}

/**
 * Batch convert: แปลงทุก YouTube embeds ใน HTML string กลับเป็น links
 * 
 * @param {string} htmlContent - HTML content with embeds
 * @returns {string} HTML content with simple links
 */
export function convertAllEmbedsToYouTubeLinks(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent;
  }

  // Pattern to find YouTube embed blocks
  const embedPattern = /<figure[^>]*class="[^"]*wp-block-embed-youtube[^"]*"[^>]*>[\s\S]*?<\/figure>/g;

  return htmlContent.replace(embedPattern, (match) => {
    const url = convertEmbedToYouTubeURL(match);
    
    // Extract caption if exists
    const captionMatch = match.match(/<figcaption[^>]*>(?:<em>)?([^<]+)(?:<\/em>)?<\/figcaption>/);
    const caption = captionMatch ? captionMatch[1].trim() : '';

    if (caption) {
      return `<p><a href="${url}">${url}</a></p>\n<p><em>${caption}</em></p>`;
    }
    
    return `<p><a href="${url}">${url}</a></p>`;
  });
}

export default convertYouTubeToEmbedHTML;




