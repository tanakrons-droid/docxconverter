// ฟังก์ชันหลัก: แปลง YouTube Links เป็น WordPress Gutenberg Embed Blocks
export function convertYouTubeLinksToEmbed(html) {
  if (!html || typeof html !== "string") return html;

  const container = document.createElement("div");
  container.innerHTML = html;

  // รองรับ YouTube URLs ทุกรูปแบบ: youtu.be, watch?v=, shorts
  const YT_REGEX =
    /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})(?:[^\s<]*))/i;

  // ตรวจสอบว่า element อยู่ใน embed block หรือไม่ (ป้องกันแปลงซ้ำ)
  const isInsideEmbed = (el) => {
    // ตรวจจับ figure.wp-block-embed
    if (el.closest("figure.wp-block-embed")) return true;
    
    // ตรวจจับ Gutenberg comment <!-- wp:embed -->
    let node = el;
    while (node) {
      const prev = node.previousSibling;
      if (prev && prev.nodeType === 8 && prev.textContent.includes("wp:embed")) {
        return true;
      }
      node = node.parentNode;
      if (node === container) break;
    }
    return false;
  };

  const nextElement = (node) => {
    let n = node?.nextSibling;
    while (n && n.nodeType === 3 && !n.textContent.trim()) n = n.nextSibling;
    return n && n.nodeType === 1 ? n : null;
  };

  const extractUrl = (el) => {
    if (!el) return null;
    const a = el.querySelector('a[href*="youtu"]');
    if (a && YT_REGEX.test(a.href)) return a.href.trim();
    const text = (el.textContent || "").trim();
    const m = text.match(YT_REGEX);
    return m ? m[1] : null;
  };

  // Helper: escape HTML characters
  const escapeHtml = (str) => {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  };

  const extractCaptionAndConsume = (el) => {
    // 1) อยู่บรรทัดเดียวกันหลัง <br> และเป็น <em>/<i>
    const brCap = el.innerHTML.match(/<br\s*\/?>\s*(?:<em>|<i>)([\s\S]*?)(?:<\/em>|<\/i>)/i);
    if (brCap && brCap[1]?.trim()) {
      el.innerHTML = el.innerHTML.replace(/<br\s*\/?>\s*(?:<em>|<i>)[\s\S]*?(?:<\/em>|<\/i>)/i, "");
      return brCap[1].trim();
    }
    // 2) element ถัดไปเป็น p/em/i
    const nx = nextElement(el);
    if (nx) {
      const em = nx.querySelector("em, i");
      if (em && em.textContent.trim()) {
        const cap = em.textContent.trim();
        nx.remove();
        return cap;
      }
      // 3) element ถัดไปเป็นข้อความสั้น ๆ (ไม่ใช่ URL)
      const txt = (nx.textContent || "").trim();
      const looksUrl = /(https?:\/\/|youtu\.be|youtube\.com)/i.test(txt);
      if (txt && !looksUrl && txt.length >= 3 && txt.length <= 180) {
        nx.remove();
        return txt;
      }
    }
    return "";
  };

  // ผู้สมัครที่มักเป็นลิงก์: p, div, li
  const candidates = Array.from(container.querySelectorAll("p, div, li"));

  candidates.forEach((el) => {
    if (isInsideEmbed(el)) return; // ★ กันห่อซ้ำ

    const url = extractUrl(el);
    if (!url) return;

    // ถ้าไม่ได้เป็นลิงก์เดี่ยว ๆ ให้ข้าม (กันกรณีมีประโยคอื่นปน)
    const innerNoTags = el.innerHTML
      .replace(/<a[\s\S]*?>|<\/a>/gi, "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/?[^>]+>/g, "")
      .trim();
    const words = innerNoTags.split(/\s+/).filter(Boolean);
    if (words.length > 1 && !/^https?:\/\//.test(innerNoTags)) return;

    // ดึง caption (ข้อความ italic ใต้ลิ้ง)
    const caption = extractCaptionAndConsume(el);

    // สร้าง Gutenberg Comment Block สำหรับ YouTube Embed
    const blockStart = `<!-- wp:embed {"url":"${url}","type":"video","providerNameSlug":"youtube","responsive":true} -->`;
    const blockEnd = `<!-- /wp:embed -->`;

    // สร้าง figure embed ตามรูปแบบ WordPress Gutenberg
    let figureHTML;
    
    if (caption) {
      // กรณีมี caption (ต้องมี <em> ครอบตามมาตรฐาน Gutenberg)
      figureHTML = `<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">${url}</div>
  <figcaption class="wp-element-caption"><em>${escapeHtml(caption)}</em></figcaption>
</figure>`;
    } else {
      // กรณีไม่มี caption
      figureHTML = `<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">${url}</div>
</figure>`;
    }

    // รวม Gutenberg comment blocks กับ HTML
    const completeBlock = `${blockStart}\n${figureHTML}\n${blockEnd}`;

    // แทนที่ element เดิมด้วย complete block
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = completeBlock;
    
    // ย้าย child nodes ทั้งหมด (รวม text nodes ของ comments)
    const fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    el.replaceWith(fragment);
  });

  // ★ DEDUPE PASS: ล้าง figure ที่ซ้อนกันและรวมเนื้อหาไว้ชั้นเดียว
  // 1) ถ้าเจอ figure.wp-block-embed ภายในอีก figure.wp-block-embed ให้ย้าย child ออกแล้วลบ inner
  container.querySelectorAll("figure.wp-block-embed figure.wp-block-embed").forEach((inner) => {
    const outer = inner.parentElement.closest("figure.wp-block-embed");
    if (!outer || outer === inner) return;
    const kids = Array.from(inner.childNodes);
    kids.forEach((n) => outer.appendChild(n));
    inner.remove();
  });

  // 2) ถ้ามี wrapper ซ้ำภายใน figure ให้เก็บตัวแรก ลบตัวถัดไป
  container.querySelectorAll("figure.wp-block-embed").forEach((fig) => {
    const wrappers = fig.querySelectorAll(":scope > div.wp-block-embed__wrapper");
    wrappers.forEach((w, i) => {
      if (i > 0) w.remove();
    });
  });

  return container.innerHTML;
}

// Alias export สำหรับชื่อที่ยาวกว่า (สื่อความหมายชัดเจน)
export const convertYouTubeLinksToWPEmbedWithCaption = convertYouTubeLinksToEmbed;
