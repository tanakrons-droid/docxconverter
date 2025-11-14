// แปลงลิงก์ "อ่านบทความเพิ่มเติม" เป็น Gutenberg Paragraph Block พิเศษ
// รองรับรูปแบบ: อ่านบทความเพิ่มเติม :, อ่านเพิ่มเติม :, Read more :

export function convertReadMoreLinks(html) {
  if (!html || typeof html !== 'string') return html;

  const container = document.createElement('div');
  container.innerHTML = html;

  // Find all paragraphs that might contain read more links
  const paragraphs = Array.from(container.querySelectorAll('p'));
  
  paragraphs.forEach(paragraph => {
    const text = paragraph.textContent.trim();
    
    // Check if paragraph starts with read more patterns
    if (isReadMoreParagraph(text)) {
      const convertedBlock = convertToReadMoreBlock(paragraph);
      if (convertedBlock) {
        paragraph.outerHTML = convertedBlock;
      }
    }
  });

  return container.innerHTML;
}

// Helper function to check if paragraph starts with read more patterns
function isReadMoreParagraph(text) {
  const readMorePatterns = [
    /^อ่านบทความเพิ่มเติม\s*:/i,
    /^อ่านเพิ่มเติม\s*:/i,
    /^Read\s+more\s*:/i
  ];

  return readMorePatterns.some(pattern => pattern.test(text));
}

// Helper function to convert paragraph to read more block
function convertToReadMoreBlock(paragraph) {
  // Find the link within the paragraph
  const link = paragraph.querySelector('a');
  if (!link) return null;

  const href = link.getAttribute('href') || '';
  const linkText = link.innerHTML.trim();
  
  if (!linkText) return null;

  // Determine rel attribute based on domain
  const rel = determineRelAttribute(href);

  // Create the Gutenberg Paragraph Block with vsq-readmore class
  const readMoreBlock = `<!-- wp:paragraph {"className":"vsq-readmore"} -->
<p class="vsq-readmore">
  <strong>อ่านบทความเพิ่มเติม :</strong>
  <a href="${escapeHtml(href)}" target="_blank" rel="${rel}">${linkText}</a>
</p>
<!-- /wp:paragraph -->`;

  return readMoreBlock;
}

// Helper function to determine rel attribute based on domain
function determineRelAttribute(href) {
  if (!href) return 'noreferrer noopener nofollow';
  
  try {
    const url = new URL(href);
    const domain = url.hostname.toLowerCase();
    
    // Check for vsquareclinic domains
    if (domain.includes('vsquareclinic.com') || domain.includes('vsquareclinic.co')) {
      return 'noreferrer noopener';
    }
    
    return 'noreferrer noopener nofollow';
  } catch (error) {
    // If URL parsing fails, treat as external link
    return 'noreferrer noopener nofollow';
  }
}

// Helper function to escape HTML attributes
function escapeHtml(text) {
  if (!text) return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}