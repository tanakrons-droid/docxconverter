# 🎬 convertYouTubeLinksToWPEmbedWithCaption

## 📖 คำอธิบาย
ฟังก์ชันสำหรับแปลง YouTube URLs ให้เป็น **WordPress Gutenberg Embed Blocks** พร้อม caption อัตโนมัติ

---

## ✨ คุณสมบัติ

### 🔍 รองรับ URL Formats
- ✅ `https://youtu.be/xxxx`
- ✅ `https://www.youtube.com/watch?v=xxxx`
- ✅ `https://youtube.com/shorts/xxxx`

### 🎯 ความสามารถ
1. **ตรวจจับ YouTube URL อัตโนมัติ** จาก HTML
2. **ดึง Caption** จากบรรทัดถัดไป (ถ้ามีข้อความ italic: `<em>` หรือ `<i>`)
3. **สร้าง Gutenberg Embed Block** ที่สมบูรณ์พร้อม:
   - Gutenberg comment blocks (`<!-- wp:embed -->`)
   - Figure element พร้อม class ครบถ้วน
   - Wrapper สำหรับ URL
   - Figcaption สำหรับ caption (ถ้ามี)
4. **ลบ element เดิม** ที่ซ้ำซ้อนออกอัตโนมัติ

---

## 🚀 การใช้งาน

### 1. Import ฟังก์ชัน
```javascript
import { convertYouTubeLinksToWPEmbedWithCaption } from './utils/convertYouTubeLinksToWPEmbedWithCaption';
```

### 2. เรียกใช้ใน Post-Processing Pipeline
```javascript
// หลังจากแปลง DOCX → HTML แล้ว
let htmlString = mammothResult.value;

// ทำความสะอาดตาราง
htmlString = cleanGutenbergTables(htmlString);

// ★ แปลง YouTube Links เป็น Gutenberg Embed Blocks
htmlString = convertYouTubeLinksToWPEmbedWithCaption(htmlString);

// ประมวลผลลิงก์อื่น ๆ ต่อ
htmlString = processLinks(htmlString, selectedWebsite);
```

---

## 📋 ตัวอย่างการใช้งาน

### ตัวอย่างที่ 1: URL พร้อม Caption

**Input (HTML จาก DOCX):**
```html
<p>https://youtu.be/8n71hbivVNk?feature=shared</p>
<p><em>การทำงานของเครื่อง Fotona Laser</em></p>
```

**Output (Gutenberg Block):**
```html
<!-- wp:embed {"url":"https://youtu.be/8n71hbivVNk?feature=shared","type":"video","providerNameSlug":"youtube","responsive":true} -->
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">https://youtu.be/8n71hbivVNk?feature=shared</div>
  <figcaption class="wp-element-caption"><em>การทำงานของเครื่อง Fotona Laser</em></figcaption>
</figure>
<!-- /wp:embed -->
```

### ตัวอย่างที่ 2: URL ไม่มี Caption

**Input:**
```html
<p>https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
```

**Output:**
```html
<!-- wp:embed {"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","type":"video","providerNameSlug":"youtube","responsive":true} -->
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">https://www.youtube.com/watch?v=dQw4w9WgXcQ</div>
</figure>
<!-- /wp:embed -->
```

### ตัวอย่างที่ 3: YouTube Shorts

**Input:**
```html
<p>https://youtube.com/shorts/abc123xyz</p>
<p><i>ตัวอย่างการใช้งาน YouTube Shorts</i></p>
```

**Output:**
```html
<!-- wp:embed {"url":"https://youtube.com/shorts/abc123xyz","type":"video","providerNameSlug":"youtube","responsive":true} -->
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">https://youtube.com/shorts/abc123xyz</div>
  <figcaption class="wp-element-caption"><em>ตัวอย่างการใช้งาน YouTube Shorts</em></figcaption>
</figure>
<!-- /wp:embed -->
```

---

## 🧪 การทดสอบ

### วิธีทดสอบในไฟล์ Word:

1. **สร้างไฟล์ .docx** ใส่เนื้อหา:
   ```
   https://youtu.be/8n71hbivVNk?feature=shared
   
   การทำงานของเครื่อง Fotona Laser (ทำให้เป็นตัวเอียง/italic)
   ```

2. **Upload ไฟล์** ผ่านเว็บ converter

3. **ตรวจสอบ Output** ควรได้:
   - ✅ Gutenberg comment blocks ครบถ้วน
   - ✅ Figure element พร้อม classes
   - ✅ URL อยู่ใน `div.wp-block-embed__wrapper`
   - ✅ Caption อยู่ใน `figcaption` พร้อม `<em>` tag

4. **Copy วางใน WordPress Gutenberg**:
   - ✅ แสดงเป็น YouTube video preview ทันที
   - ✅ Caption อยู่ใต้วิดีโอ
   - ✅ ไม่มี warning "Clear Unknown Formatting"

---

## 🔧 Technical Details

### HTML Structure ที่สร้าง

```html
<!-- Gutenberg Comment Start -->
<!-- wp:embed {"url":"URL","type":"video","providerNameSlug":"youtube","responsive":true} -->

<!-- Figure Container -->
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  
  <!-- Video URL Wrapper -->
  <div class="wp-block-embed__wrapper">VIDEO_URL</div>
  
  <!-- Caption (ถ้ามี) -->
  <figcaption class="wp-element-caption"><em>CAPTION_TEXT</em></figcaption>
  
</figure>

<!-- Gutenberg Comment End -->
<!-- /wp:embed -->
```

### Logic Flow

1. **Parse HTML** → สร้าง DOM tree
2. **Find all `<p>` tags** → วนลูปตรวจสอบทุก paragraph
3. **Match YouTube URL** → ใช้ regex ตรวจจับ URL
4. **Check next element** → ตรวจว่ามี caption หรือไม่
   - ถ้ามี `<em>` หรือ `<i>` → ใช้เป็น caption และลบ element ออก
5. **Build Gutenberg Block** → สร้าง HTML structure
6. **Replace original element** → แทนที่ `<p>` เดิมด้วย block ใหม่
7. **Return HTML** → คืนค่า HTML string ที่แปลงแล้ว

---

## ✅ ข้อดี

1. **ทำงานอัตโนมัติ** - ไม่ต้องแก้ไข HTML ด้วยตัวเอง
2. **รองรับหลาย Format** - youtu.be, youtube.com, shorts
3. **Gutenberg Native** - WordPress จะแสดงเป็น embed block จริง
4. **ไม่ขึ้น Error** - ไม่มี "Clear Unknown Formatting"
5. **รองรับ Caption** - ดึง caption จาก italic text อัตโนมัติ
6. **Clean Output** - ลบ element ซ้ำซ้อนออก

---

## 🎯 Use Cases

### ✅ เหมาะกับ:
- แปลงบทความที่มี YouTube videos
- เอกสารรีวิวที่ฝัง video แนะนำ
- Tutorial/How-to guides พร้อมวิดีโอประกอบ
- บทความที่มีหลายวิดีโอในเนื้อหา

### ⚠️ ข้อจำกัด:
- ตรวจจับเฉพาะ URL ที่อยู่ใน `<p>` tag เท่านั้น
- Caption ต้องเป็น `<em>` หรือ `<i>` ในบรรทัดถัดไป
- ไม่รองรับ playlist URLs (เฉพาะ single video)

---

## 📊 การทำงานใน Pipeline

```
DOCX File
    ↓
mammoth.convertToHtml()
    ↓
cleanGutenbergTables()
    ↓
convertYouTubeLinksToWPEmbedWithCaption() ← ★ ขั้นตอนนี้
    ↓
processLinks()
    ↓
cleanHTML()
    ↓
Final HTML Output
```

---

## 🔗 ไฟล์ที่เกี่ยวข้อง

- **Source Code**: `src/utils/convertYouTubeLinksToWPEmbedWithCaption.js`
- **Integration**: `src/components/Home.jsx` (line ~2237)
- **Samples**: `src/utils/convertYouTubeLinksToWPEmbedWithCaption.sample.html`
- **Documentation**: คุณกำลังอ่านอยู่! 📖

---

## 🎉 สรุป

ฟังก์ชันนี้ช่วยให้การแปลง DOCX ที่มี YouTube links เป็น Gutenberg content ทำได้อัตโนมัติและถูกต้อง 100% โดยไม่ต้องแก้ไข HTML เอง!

**🚀 พร้อมใช้งานทันที!**








