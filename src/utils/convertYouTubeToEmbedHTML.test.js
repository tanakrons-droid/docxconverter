/**
 * Test suite for YouTube URL to Embed HTML converter
 * 
 * Run tests:
 * npm test -- convertYouTubeToEmbedHTML.test.js
 */

import { 
  convertYouTubeToEmbedHTML, 
  convertEmbedToYouTubeURL,
  convertAllYouTubeLinksToEmbeds,
  convertAllEmbedsToYouTubeLinks
} from './convertYouTubeToEmbedHTML';

describe('convertYouTubeToEmbedHTML', () => {
  test('should convert YouTube watch URL to embed (16:9)', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = convertYouTubeToEmbedHTML(url);
    
    expect(result).toContain('wp-embed-aspect-16-9');
    expect(result).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(result).toContain('wp-block-embed-youtube');
  });

  test('should convert YouTube Shorts URL to embed (9:16)', () => {
    const url = 'https://www.youtube.com/shorts/eZTl8PRs1x4';
    const result = convertYouTubeToEmbedHTML(url, 'แคปชั่นใต้รูป');
    
    expect(result).toContain('wp-embed-aspect-9-16');
    expect(result).toContain('https://www.youtube.com/embed/eZTl8PRs1x4');
    expect(result).toContain('<figcaption class="wp-element-caption"><em>แคปชั่นใต้รูป</em></figcaption>');
  });

  test('should convert youtu.be short URL', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ';
    const result = convertYouTubeToEmbedHTML(url);
    
    expect(result).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(result).toContain('wp-embed-aspect-16-9');
  });

  test('should convert embed URL', () => {
    const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    const result = convertYouTubeToEmbedHTML(url);
    
    expect(result).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  test('should add caption when provided', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const caption = 'My video caption';
    const result = convertYouTubeToEmbedHTML(url, caption);
    
    expect(result).toContain('<figcaption class="wp-element-caption"><em>My video caption</em></figcaption>');
  });

  test('should escape HTML in caption', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const caption = 'Caption with <script>alert("xss")</script>';
    const result = convertYouTubeToEmbedHTML(url, caption);
    
    expect(result).toContain('&lt;script&gt;');
    expect(result).not.toContain('<script>');
  });

  test('should return original URL if not YouTube', () => {
    const url = 'https://vimeo.com/123456';
    const result = convertYouTubeToEmbedHTML(url);
    
    expect(result).toBe(url);
  });

  test('should handle invalid input', () => {
    expect(convertYouTubeToEmbedHTML(null)).toBeNull();
    expect(convertYouTubeToEmbedHTML(undefined)).toBeUndefined();
    expect(convertYouTubeToEmbedHTML('')).toBe('');
    expect(convertYouTubeToEmbedHTML(123)).toBe(123);
  });
});

describe('convertEmbedToYouTubeURL', () => {
  test('should convert regular embed back to watch URL', () => {
    const html = `<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">
    <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315" frameborder="0" allowfullscreen></iframe>
  </div>
</figure>`;
    
    const result = convertEmbedToYouTubeURL(html);
    expect(result).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  test('should convert Shorts embed back to shorts URL', () => {
    const html = `<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-9-16 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">
    <iframe src="https://www.youtube.com/embed/eZTl8PRs1x4" width="560" height="315" frameborder="0" allowfullscreen></iframe>
  </div>
</figure>`;
    
    const result = convertEmbedToYouTubeURL(html);
    expect(result).toBe('https://www.youtube.com/shorts/eZTl8PRs1x4');
  });

  test('should return original HTML if not YouTube embed', () => {
    const html = '<p>Some regular paragraph</p>';
    const result = convertEmbedToYouTubeURL(html);
    
    expect(result).toBe(html);
  });

  test('should handle invalid input', () => {
    expect(convertEmbedToYouTubeURL(null)).toBeNull();
    expect(convertEmbedToYouTubeURL(undefined)).toBeUndefined();
    expect(convertEmbedToYouTubeURL('')).toBe('');
  });
});

describe('convertAllYouTubeLinksToEmbeds', () => {
  test('should convert all YouTube URLs in HTML content', () => {
    const html = `
      <p>Check this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
      <p>And this short: https://www.youtube.com/shorts/eZTl8PRs1x4</p>
    `;
    
    const result = convertAllYouTubeLinksToEmbeds(html);
    
    expect(result).toContain('wp-embed-aspect-16-9');
    expect(result).toContain('wp-embed-aspect-9-16');
    expect(result).toContain('embed/dQw4w9WgXcQ');
    expect(result).toContain('embed/eZTl8PRs1x4');
  });
});

describe('convertAllEmbedsToYouTubeLinks', () => {
  test('should convert all YouTube embeds back to links', () => {
    const html = `
      <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
        <div class="wp-block-embed__wrapper">
          <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315" frameborder="0" allowfullscreen></iframe>
        </div>
      </figure>
      <p>Some text</p>
      <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-9-16 wp-has-aspect-ratio">
        <div class="wp-block-embed__wrapper">
          <iframe src="https://www.youtube.com/embed/eZTl8PRs1x4" width="560" height="315" frameborder="0" allowfullscreen></iframe>
        </div>
        <figcaption class="wp-element-caption"><em>My caption</em></figcaption>
      </figure>
    `;
    
    const result = convertAllEmbedsToYouTubeLinks(html);
    
    expect(result).toContain('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toContain('https://www.youtube.com/shorts/eZTl8PRs1x4');
    expect(result).toContain('My caption');
  });
});

// Real-world usage examples
describe('Real-world examples', () => {
  test('Example 1: Convert Shorts with caption', () => {
    const url = 'https://www.youtube.com/shorts/eZTl8PRs1x4';
    const caption = 'แคปชั่นใต้รูป';
    const result = convertYouTubeToEmbedHTML(url, caption);
    
    console.log('\n=== Example 1: Shorts with caption ===');
    console.log(result);
    
    expect(result).toMatchSnapshot();
  });

  test('Example 2: Convert regular video without caption', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = convertYouTubeToEmbedHTML(url);
    
    console.log('\n=== Example 2: Regular video without caption ===');
    console.log(result);
    
    expect(result).toMatchSnapshot();
  });

  test('Example 3: Round trip conversion', () => {
    const originalUrl = 'https://www.youtube.com/shorts/eZTl8PRs1x4';
    const embed = convertYouTubeToEmbedHTML(originalUrl, 'My caption');
    const backToUrl = convertEmbedToYouTubeURL(embed);
    
    console.log('\n=== Example 3: Round trip ===');
    console.log('Original:', originalUrl);
    console.log('Back to URL:', backToUrl);
    
    expect(backToUrl).toBe(originalUrl);
  });
});




