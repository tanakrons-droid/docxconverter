/**
 * convertYouTubeLinksToWPEmbedWithCaption
 * 
 * แปลง YouTube URLs เป็น WordPress Gutenberg Embed Blocks พร้อม caption อัตโนมัติ
 * 
 * รองรับ URL formats:
 * - https://youtu.be/xxxx
 * - https://www.youtube.com/watch?v=xxxx
 * - https://youtube.com/shorts/xxxx
 * 
 * @param {string} html - HTML string จาก DOCX conversion
 * @returns {string} HTML พร้อม Gutenberg embed blocks
 */
export function convertYouTubeLinksToWPEmbedWithCaption(html) {
  if (!html || typeof html !== "string") return html;
  
  const container = document.createElement("div");
  container.innerHTML = html;

  const youtubeRegex =
    /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[A-Za-z0-9_-]{6,})/i;

  const paragraphs = [...container.querySelectorAll("p")];
  
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const match = p.textContent.trim().match(youtubeRegex);
    
    if (!match) continue;
    
    const url = match[1];

    // ตรวจหาบรรทัด caption (ข้อความ italic ถัดไป)
    const next = p.nextElementSibling;
    let caption = "";
    
    if (next && /<em>|<i>/i.test(next.innerHTML)) {
      caption = next.textContent.trim();
      next.remove(); // ลบ element caption ออก
    }

    // สร้าง Gutenberg comment blocks
    const blockStart = `<!-- wp:embed {"url":"${url}","type":"video","providerNameSlug":"youtube","responsive":true} -->`;
    const blockEnd = `<!-- /wp:embed -->`;

    // สร้าง figure element
    const figure = document.createElement("figure");
    figure.className =
      "wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio";

    // สร้าง wrapper สำหรับ URL
    const wrapper = document.createElement("div");
    wrapper.className = "wp-block-embed__wrapper";
    wrapper.textContent = url;
    figure.appendChild(wrapper);

    // เพิ่ม caption ถ้ามี
    if (caption) {
      const figcaption = document.createElement("figcaption");
      figcaption.className = "wp-element-caption";
      figcaption.innerHTML = `<em>${caption}</em>`;
      figure.appendChild(figcaption);
    }

    // แทนที่ paragraph เดิมด้วย Gutenberg block
    p.outerHTML = `${blockStart}${figure.outerHTML}${blockEnd}`;
  }

  return container.innerHTML;
}
