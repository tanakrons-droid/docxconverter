/**
 * 🎯 Examples & Quick Reference
 * Copy-paste these examples to test the functions
 */

import { 
  convertYouTubeToEmbedHTML,
  convertEmbedToYouTubeURL,
  convertAllYouTubeLinksToEmbeds,
  convertAllEmbedsToYouTubeLinks
} from './convertYouTubeToEmbedHTML';

console.log('='.repeat(80));
console.log('🎥 YouTube to Embed HTML Converter - Examples');
console.log('='.repeat(80));

// ========================================
// Example 1: YouTube Shorts → Embed (9:16)
// ========================================
console.log('\n📱 Example 1: YouTube Shorts (9:16)');
console.log('-'.repeat(80));

const shorts1 = convertYouTubeToEmbedHTML(
  'https://www.youtube.com/shorts/eZTl8PRs1x4',
  'แคปชั่นใต้รูป'
);

console.log(shorts1);

// ========================================
// Example 2: Regular YouTube Video → Embed (16:9)
// ========================================
console.log('\n🎬 Example 2: Regular YouTube Video (16:9)');
console.log('-'.repeat(80));

const video1 = convertYouTubeToEmbedHTML(
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
);

console.log(video1);

// ========================================
// Example 3: Short URL (youtu.be)
// ========================================
console.log('\n🔗 Example 3: Short URL (youtu.be)');
console.log('-'.repeat(80));

const shortUrl = convertYouTubeToEmbedHTML(
  'https://youtu.be/dQw4w9WgXcQ',
  'Never gonna give you up'
);

console.log(shortUrl);

// ========================================
// Example 4: URL with parameters
// ========================================
console.log('\n⚙️ Example 4: URL with Parameters');
console.log('-'.repeat(80));

const withParams = convertYouTubeToEmbedHTML(
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s&feature=share'
);

console.log(withParams);

// ========================================
// Example 5: Reverse - Embed → URL
// ========================================
console.log('\n🔄 Example 5: Reverse Conversion (Embed → URL)');
console.log('-'.repeat(80));

const embedHtml = `<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-9-16 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">
    <iframe src="https://www.youtube.com/embed/eZTl8PRs1x4" width="560" height="315" frameborder="0" allowfullscreen></iframe>
  </div>
  <figcaption class="wp-element-caption"><em>แคปชั่นใต้รูป</em></figcaption>
</figure>`;

const backToUrl = convertEmbedToYouTubeURL(embedHtml);
console.log('Original Embed → URL:', backToUrl);

// ========================================
// Example 6: Round Trip Test
// ========================================
console.log('\n🔁 Example 6: Round Trip (URL → Embed → URL)');
console.log('-'.repeat(80));

const originalUrl = 'https://www.youtube.com/shorts/eZTl8PRs1x4';
const embed = convertYouTubeToEmbedHTML(originalUrl, 'Test caption');
const finalUrl = convertEmbedToYouTubeURL(embed);

console.log('Original URL:', originalUrl);
console.log('Final URL:', finalUrl);
console.log('Match:', originalUrl === finalUrl ? '✅' : '❌');

// ========================================
// Example 7: Batch Convert - Links to Embeds
// ========================================
console.log('\n📦 Example 7: Batch Convert (All Links → Embeds)');
console.log('-'.repeat(80));

const htmlWithLinks = `
<h2>My Favorite Videos</h2>
<p>Check out this amazing video: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
<p>And this cool short: https://www.youtube.com/shorts/eZTl8PRs1x4</p>
<p>Also see: https://youtu.be/abc12345678</p>
<p>Not a video: https://example.com/page</p>
`;

const htmlWithEmbeds = convertAllYouTubeLinksToEmbeds(htmlWithLinks);
console.log(htmlWithEmbeds);

// ========================================
// Example 8: Batch Convert - Embeds to Links
// ========================================
console.log('\n📤 Example 8: Batch Convert (All Embeds → Links)');
console.log('-'.repeat(80));

const htmlWithEmbedsContent = `
<h2>My Videos</h2>
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">
    <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315" frameborder="0" allowfullscreen></iframe>
  </div>
  <figcaption class="wp-element-caption"><em>Rick Astley - Never Gonna Give You Up</em></figcaption>
</figure>
<p>Some text here</p>
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-9-16 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">
    <iframe src="https://www.youtube.com/embed/eZTl8PRs1x4" width="560" height="315" frameborder="0" allowfullscreen></iframe>
  </div>
</figure>
`;

const cleanedHtml = convertAllEmbedsToYouTubeLinks(htmlWithEmbedsContent);
console.log(cleanedHtml);

// ========================================
// Example 9: Error Handling
// ========================================
console.log('\n⚠️ Example 9: Error Handling');
console.log('-'.repeat(80));

console.log('Non-YouTube URL:', convertYouTubeToEmbedHTML('https://vimeo.com/123456'));
console.log('Invalid URL:', convertYouTubeToEmbedHTML('not-a-url'));
console.log('Null:', convertYouTubeToEmbedHTML(null));
console.log('Empty:', convertYouTubeToEmbedHTML(''));

// ========================================
// Example 10: HTML Escaping
// ========================================
console.log('\n🛡️ Example 10: HTML Escaping (Security)');
console.log('-'.repeat(80));

const xssAttempt = convertYouTubeToEmbedHTML(
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  '<script>alert("XSS")</script>'
);

console.log(xssAttempt);
console.log('✅ Script tags are escaped:', xssAttempt.includes('&lt;script&gt;'));

// ========================================
// Example 11: Use in React Component
// ========================================
console.log('\n⚛️ Example 11: React Component Example');
console.log('-'.repeat(80));

const reactExample = `
import { convertYouTubeToEmbedHTML } from './utils/convertYouTubeToEmbedHTML';

function VideoPreview({ url, caption }) {
  const embedHtml = convertYouTubeToEmbedHTML(url, caption);
  
  return (
    <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
  );
}

// Usage:
<VideoPreview 
  url="https://www.youtube.com/shorts/eZTl8PRs1x4" 
  caption="My awesome video"
/>
`;

console.log(reactExample);

// ========================================
// Example 12: Integration with Home.jsx
// ========================================
console.log('\n🏠 Example 12: Integration with Home.jsx (docx-to-code-converter)');
console.log('-'.repeat(80));

const integrationExample = `
// In Home.jsx - handleConvert function

import { convertAllYouTubeLinksToEmbeds } from '../utils/convertYouTubeToEmbedHTML';

const handleConvert = async () => {
  // ... existing code ...
  
  let htmlString = result.value;
  
  // Post-processing: Convert YouTube links to embeds
  htmlString = convertAllYouTubeLinksToEmbeds(htmlString);
  
  // ... rest of your code ...
};
`;

console.log(integrationExample);

console.log('\n' + '='.repeat(80));
console.log('✅ All examples completed!');
console.log('='.repeat(80));




