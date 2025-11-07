# YouTube URL to Embed HTML Converter

🎥 ฟังก์ชันแปลงลิงก์ YouTube เป็น WordPress Gutenberg Embed HTML และแปลงกลับ

## ✨ Features

- ✅ รองรับทุกรูปแบบลิงก์ YouTube (watch, youtu.be, embed, shorts)
- ✅ แยกสัดส่วนอัตโนมัติ: Shorts (9:16) และวิดีโอปกติ (16:9)
- ✅ เพิ่ม caption ได้
- ✅ Escape HTML เพื่อป้องกัน XSS
- ✅ แปลงกลับจาก embed เป็น URL ได้
- ✅ Batch convert ทั้ง HTML content
- ✅ Error handling ครบถ้วน

## 📦 Installation

```javascript
import { 
  convertYouTubeToEmbedHTML,
  convertEmbedToYouTubeURL,
  convertAllYouTubeLinksToEmbeds,
  convertAllEmbedsToYouTubeLinks
} from './utils/convertYouTubeToEmbedHTML';
```

## 🚀 Usage

### 1. แปลง URL เป็น Embed HTML

```javascript
// YouTube Shorts (9:16)
const shortsEmbed = convertYouTubeToEmbedHTML(
  'https://www.youtube.com/shorts/eZTl8PRs1x4',
  'แคปชั่นใต้รูป'
);

console.log(shortsEmbed);
```

**Output:**
```html
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-9-16 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">
    <iframe src="https://www.youtube.com/embed/eZTl8PRs1x4" width="560" height="315" frameborder="0" allowfullscreen></iframe>
  </div>
  <figcaption class="wp-element-caption"><em>แคปชั่นใต้รูป</em></figcaption>
</figure>
```

```javascript
// Regular YouTube video (16:9)
const videoEmbed = convertYouTubeToEmbedHTML(
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
);

console.log(videoEmbed);
```

**Output:**
```html
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">
    <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315" frameborder="0" allowfullscreen></iframe>
  </div>
</figure>
```

### 2. แปลง Embed HTML กลับเป็น URL

```javascript
const embedHtml = `<figure class="wp-block-embed wp-embed-aspect-9-16">
  <div class="wp-block-embed__wrapper">
    <iframe src="https://www.youtube.com/embed/eZTl8PRs1x4"></iframe>
  </div>
</figure>`;

const url = convertEmbedToYouTubeURL(embedHtml);
console.log(url);
// Output: "https://www.youtube.com/shorts/eZTl8PRs1x4"
```

### 3. Batch Convert - แปลงทั้ง HTML Content

```javascript
// แปลงทุก YouTube links เป็น embeds
const htmlWithLinks = `
  <p>Check this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
  <p>And this short: https://www.youtube.com/shorts/eZTl8PRs1x4</p>
`;

const htmlWithEmbeds = convertAllYouTubeLinksToEmbeds(htmlWithLinks);

// แปลงทุก embeds กลับเป็น links (สำหรับ export to .docx)
const cleanHtml = convertAllEmbedsToYouTubeLinks(htmlWithEmbeds);
```

## 🔍 Supported URL Formats

| Format | Example | Support |
|--------|---------|---------|
| Watch URL | `https://www.youtube.com/watch?v=VIDEO_ID` | ✅ |
| Short URL | `https://youtu.be/VIDEO_ID` | ✅ |
| Embed URL | `https://www.youtube.com/embed/VIDEO_ID` | ✅ |
| Shorts URL | `https://www.youtube.com/shorts/VIDEO_ID` | ✅ |
| With params | `https://www.youtube.com/watch?v=VIDEO_ID&t=10s` | ✅ |

## 🎨 Aspect Ratios

- **Regular Videos**: `wp-embed-aspect-16-9` (16:9)
- **YouTube Shorts**: `wp-embed-aspect-9-16` (9:16)

## 🛡️ Security

- Caption text is escaped to prevent XSS attacks
- HTML special characters are properly handled
- Invalid input returns original value safely

## 💡 Use Cases

### ในแอป docx-to-code-converter

```javascript
import { 
  convertYouTubeToEmbedHTML,
  convertAllEmbedsToYouTubeLinks 
} from './utils/convertYouTubeToEmbedHTML';

// 1. เวลาแปลง DOCX → HTML (สร้าง embeds)
const processHtml = (html) => {
  return convertAllYouTubeLinksToEmbeds(html, true);
};

// 2. เวลาแปลง HTML → DOCX (clean embeds กลับเป็น links)
const cleanForDocx = (html) => {
  return convertAllEmbedsToYouTubeLinks(html);
};
```

### ใช้ใน Home.jsx

```javascript
import { convertYouTubeToEmbedHTML } from '../utils/convertYouTubeToEmbedHTML';

// ใน handleConvert function
let htmlString = result.value;

// Post-processing: แปลง YouTube links
htmlString = convertAllYouTubeLinksToEmbeds(htmlString);
```

## 📝 API Reference

### `convertYouTubeToEmbedHTML(url, caption)`

แปลง YouTube URL เป็น embed HTML

**Parameters:**
- `url` (string): YouTube URL
- `caption` (string, optional): Caption text

**Returns:** (string) HTML string หรือ original URL ถ้าไม่ใช่ YouTube

---

### `convertEmbedToYouTubeURL(html)`

แปลง embed HTML กลับเป็น YouTube URL

**Parameters:**
- `html` (string): HTML string ที่มี YouTube embed

**Returns:** (string) YouTube URL หรือ original HTML ถ้าไม่พบ embed

---

### `convertAllYouTubeLinksToEmbeds(htmlContent, addCaption)`

แปลงทุก YouTube links ใน HTML content

**Parameters:**
- `htmlContent` (string): HTML content
- `addCaption` (boolean, optional): เพิ่ม empty caption หรือไม่

**Returns:** (string) HTML with embeds

---

### `convertAllEmbedsToYouTubeLinks(htmlContent)`

แปลงทุก YouTube embeds กลับเป็น links

**Parameters:**
- `htmlContent` (string): HTML content with embeds

**Returns:** (string) HTML with simple links

## 🧪 Testing

```bash
npm test -- convertYouTubeToEmbedHTML.test.js
```

## 📊 Examples

### Example 1: Basic Conversion
```javascript
console.log(convertYouTubeToEmbedHTML(
  "https://www.youtube.com/shorts/eZTl8PRs1x4",
  "แคปชั่นใต้รูป"
));
```

### Example 2: Round Trip
```javascript
const original = "https://www.youtube.com/shorts/eZTl8PRs1x4";
const embed = convertYouTubeToEmbedHTML(original, "My caption");
const backToUrl = convertEmbedToYouTubeURL(embed);

console.log(original === backToUrl); // true
```

### Example 3: Batch Processing
```javascript
const html = `
  <p>Video 1: https://www.youtube.com/watch?v=abc123</p>
  <p>Video 2: https://www.youtube.com/shorts/xyz789</p>
`;

const withEmbeds = convertAllYouTubeLinksToEmbeds(html);
const backToLinks = convertAllEmbedsToYouTubeLinks(withEmbeds);
```

## 🤝 Integration

สามารถนำไปใช้ใน:
- ✅ DOCX to HTML conversion
- ✅ HTML to DOCX export
- ✅ WordPress Gutenberg blocks
- ✅ Rich text editors
- ✅ CMS systems

## 📌 Notes

- Video ID ของ YouTube มีความยาว 11 ตัวอักษร
- Shorts URLs จะถูกแปลงเป็น aspect ratio 9:16 โดยอัตโนมัติ
- Caption จะถูก escape HTML เพื่อความปลอดภัย
- ถ้า URL ไม่ใช่ YouTube จะ return ค่าเดิมกลับไป

## 🔗 Related Files

- `convertYouTubeLinksToEmbed.js` - เวอร์ชันเก่า (basic)
- `convertYouTubeLinksToWPEmbedWithCaption.js` - เวอร์ชันเก่า (with caption)
- `convertYouTubeToEmbedHTML.js` - เวอร์ชันใหม่ (complete + reverse)

---

**Author:** Your Name  
**Version:** 1.0.0  
**Last Updated:** 2025-10-30




