# YouTube Links to Gutenberg Embed Converter (v2.0 - Idempotent + Dedupe)

## 📋 คำอธิบาย

ฟังก์ชันนี้แปลง YouTube URLs ที่อยู่ในรูปแบบ `<p>` หรือ `<div>` ให้เป็น Gutenberg Embed Block อัตโนมัติ พร้อมรองรับการตรวจจับ caption จากบรรทัดถัดไป

## ⭐ ฟีเจอร์ใหม่ v2.0

### 🔄 Idempotent
- **รันซ้ำได้ผลเดิม** - แปลงกี่ครั้งก็ไม่สร้าง figure ซ้ำ
- ตรวจสอบว่า element อยู่ใน `figure.wp-block-embed` อยู่แล้วหรือไม่ ด้วย `isInsideEmbed()`
- ถ้าอยู่แล้ว → ข้ามไป (ไม่แปลงซ้ำ)

### 🧹 Dedupe Pass
- **ล้าง figure ที่ซ้อนกัน** - ถ้าเจอ `<figure>` ซ้อนกัน → รวมเป็นชั้นเดียว
- **ลบ wrapper ซ้ำ** - ถ้ามี `div.wp-block-embed__wrapper` มากกว่า 1 → เก็บตัวแรก ลบตัวอื่นทิ้ง
- ทำงานหลังจากแปลงเสร็จทั้งหมด → รับประกันโครงสร้าง clean

## 🎯 ฟีเจอร์

### ✅ รองรับ YouTube URL ทุกรูปแบบ:
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `http://youtu.be/VIDEO_ID`
- พร้อม parameters: `?feature=shared`, `&t=10s`, etc.

### ✅ ตรวจจับ Caption อัตโนมัติ:
1. **Classic Block** - `<br>` + `<em>` ในบรรทัดเดียว:
   ```html
   <p>https://youtu.be/ABC<br><em>Caption</em></p>
   ```

2. **Element แยกกัน** - `<em>` หรือ `<i>` ในบรรทัดถัดไป:
   ```html
   <p>https://youtu.be/ABC</p>
   <p><em>Caption</em></p>
   ```

3. **ข้อความสั้น** - ข้อความธรรมดา 3-180 ตัวอักษร:
   ```html
   <p>https://youtu.be/ABC</p>
   <p>วิธีใช้งานเบื้องต้น</p>
   ```

### ✅ URL เป็น Anchor Tag:
```html
<p><a href="https://youtu.be/ABC">https://youtu.be/ABC</a></p>
```

### ❌ ไม่แปลงกรณี:
- URL อยู่กลางย่อหน้าที่มีข้อความอื่น:
  ```html
  <p>ดูวิดีโอได้ที่ https://youtu.be/ABC และกดไลค์ด้วย</p>
  ```
- URL ที่อยู่ใน `figure.wp-block-embed` อยู่แล้ว (ป้องกันแปลงซ้ำ):
  ```html
  <figure class="wp-block-embed ...">
    <div class="wp-block-embed__wrapper">https://youtu.be/ABC</div>
  </figure>
  ```

## 📤 Output

### รูปแบบ Output (WordPress Gutenberg Format พร้อม Comment Blocks)

#### ✅ กรณีมี Caption (ข้อความ italic ใต้ลิ้ง):
```html
<!-- wp:embed {"url":"https://youtu.be/VIDEO_ID","type":"video","providerNameSlug":"youtube","responsive":true} -->
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">https://youtu.be/VIDEO_ID</div>
  <figcaption class="wp-element-caption"><em>Caption Text</em></figcaption>
</figure>
<!-- /wp:embed -->
```

**📝 หมายเหตุ**: 
- **มี Gutenberg Comment Blocks** (`<!-- wp:embed -->`) - WordPress รู้จักเป็น YouTube Embed Block แท้ ๆ
- Caption มี **`<em>` ครอบ** (ตามมาตรฐาน Gutenberg)
- **แสดง preview วิดีโอทันที** ใน WordPress Editor
- **ไม่ขึ้น "Clear Unknown Formatting"**

#### ✅ กรณีไม่มี Caption:
```html
<!-- wp:embed {"url":"https://youtu.be/VIDEO_ID","type":"video","providerNameSlug":"youtube","responsive":true} -->
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">https://youtu.be/VIDEO_ID</div>
</figure>
<!-- /wp:embed -->
```

### 🎯 Logic การทำงาน

1. **ตรวจจับ YouTube URL** - รองรับ 3 รูปแบบ:
   - `https://youtu.be/VIDEO_ID`
   - `https://www.youtube.com/watch?v=VIDEO_ID`
   - `https://www.youtube.com/shorts/VIDEO_ID` ⭐ NEW

2. **ดึง Caption** - ถ้าบรรทัดถัดไปเป็นข้อความ italic หรือข้อความสั้น → ใช้เป็น caption

3. **สร้าง Gutenberg Comment Blocks** - เพิ่ม `<!-- wp:embed {...} -->` และ `<!-- /wp:embed -->` ⭐ NEW

4. **สร้าง Figure Embed** - ใช้รูปแบบมาตรฐาน WordPress Gutenberg พร้อม indentation

5. **Idempotent** - รันซ้ำได้ผลเดิม (ตรวจจับทั้ง figure และ Gutenberg comments)

6. **Dedupe** - ล้าง figure ซ้อนอัตโนมัติ (ถ้ามี)

## 🧪 การทดสอบ

### วิธีที่ 1: ใช้ Test File
```javascript
// ใน Browser Console
import('./utils/convertYouTubeLinksToEmbed.test.js');
```

### วิธีที่ 2: ทดสอบด้วย DOCX
1. สร้างไฟล์ Word ที่มี:
   - YouTube link บรรทัดหนึ่ง
   - ข้อความ italic บรรทัดถัดไป
2. Upload และแปลง
3. ตรวจสอบ output HTML
4. **Upload ซ้ำ** → ต้องได้ผลเดิม (Idempotent)

### วิธีที่ 3: ทดสอบ Idempotent
```javascript
const input = `<p>https://youtu.be/ABC</p>`;
const result1 = convertYouTubeLinksToEmbed(input);
const result2 = convertYouTubeLinksToEmbed(result1); // รันซ้ำ
console.log(result1 === result2); // ต้อง true
```

## 📊 Test Cases

| Test | Input | Expected Output | Status |
|------|-------|----------------|--------|
| URL + Caption แยกบรรทัด | `<p>URL</p><p><em>Caption</em></p>` | ✅ Figure + Figcaption | ✓ |
| Classic Block | `<p>URL<br><em>Caption</em></p>` | ✅ Figure + Figcaption | ✓ |
| URL เดี่ยว | `<p>URL</p>` | ✅ Figure (ไม่มี Figcaption) | ✓ |
| Anchor Tag | `<p><a href="URL">URL</a></p>` | ✅ Figure | ✓ |
| URL กลางย่อหน้า | `<p>ข้อความ URL ข้อความ</p>` | ❌ ไม่แปลง (คง `<p>` ไว้) | ✓ |
| Caption ธรรมดา | `<p>URL</p><p>Caption</p>` | ✅ Figure + Figcaption | ✓ |
| **Idempotent** | รัน 2 ครั้ง | ได้ผลเดิมทุกครั้ง | ✓ ⭐ |
| **Dedupe** | `<figure><figure>URL</figure></figure>` | รวมเป็น `<figure>` ชั้นเดียว | ✓ ⭐ |
| **ป้องกันแปลงซ้ำ** | `<figure>URL</figure>` | ไม่แปลงซ้ำ | ✓ ⭐ |

## 🔧 การใช้งาน

### Import:
```javascript
// Import ชื่อเดิม (สั้น)
import { convertYouTubeLinksToEmbed } from './utils/convertYouTubeLinksToEmbed';

// หรือ import ชื่อใหม่ (ยาว สื่อความหมายชัดเจน)
import { convertYouTubeLinksToWPEmbedWithCaption } from './utils/convertYouTubeLinksToEmbed';
```

### เรียกใช้:
```javascript
const html = `<p>https://youtu.be/ABC</p><p><em>Caption</em></p>`;

// ใช้ชื่อเดิม
const result = convertYouTubeLinksToEmbed(html);

// หรือใช้ชื่อใหม่ (ทำงานเหมือนกัน)
const result2 = convertYouTubeLinksToWPEmbedWithCaption(html);

// รันซ้ำได้ (Idempotent)
const result3 = convertYouTubeLinksToEmbed(result); // ได้ผลเดิม
```

### ใน Pipeline (Home.jsx):
```javascript
// หลัง cleanGutenbergTables และก่อน export
htmlString = cleanGutenbergTables(htmlString);
htmlString = convertYouTubeLinksToEmbed(htmlString);  // ← เรียกที่นี่
htmlString = processLinks(htmlString, selectedWebsite);
```

## ⚙️ Technical Details

### Regex Pattern:
```javascript
/(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]+(?:[^\s<]*)?|youtu\.be\/[\w-]+(?:[^\s<]*)?))/i
```

### Guard Function (ป้องกันแปลงซ้ำ):
```javascript
const isInsideEmbed = (el) => !!el.closest("figure.wp-block-embed");
```

### Dedupe Logic (ล้าง figure ซ้อน):
```javascript
// 1) รวม figure ซ้อนเป็นชั้นเดียว
container.querySelectorAll("figure.wp-block-embed figure.wp-block-embed").forEach((inner) => {
  const outer = inner.parentElement.closest("figure.wp-block-embed");
  if (!outer || outer === inner) return;
  const kids = Array.from(inner.childNodes);
  kids.forEach((n) => outer.appendChild(n));
  inner.remove();
});

// 2) ลบ wrapper ซ้ำ
container.querySelectorAll("figure.wp-block-embed").forEach((fig) => {
  const wrappers = fig.querySelectorAll(":scope > div.wp-block-embed__wrapper");
  wrappers.forEach((w, i) => {
    if (i > 0) w.remove();
  });
});
```

### Caption Detection Logic:
1. ตรวจสอบ `<br><em>` ในบรรทัดเดียว
2. ตรวจหา `nextSibling` ที่มี `<em>` หรือ `<i>`
3. ตรวจหา `nextSibling` ที่เป็นข้อความสั้น 3-180 ตัวอักษร

### Idempotent Guarantee:
- ✅ รันครั้งแรก: แปลง `<p>URL</p>` → `<figure>...</figure>`
- ✅ รันครั้งที่ 2: เจอ `<figure>` → ข้าม (ไม่แปลงซ้ำ)
- ✅ รันครั้งที่ 3+: ผลเดิม

## 🎓 ตัวอย่างการใช้งานจริง

### ตัวอย่างที่ 1: บทความรีวิวเครื่อง
```html
Input:
<p>https://youtu.be/8n71hbivVNk?feature=shared</p>
<p><em>การทำงานของเครื่อง Fotona Laser</em></p>

Output (รันครั้งแรก):
<!-- wp:embed {"url":"https://youtu.be/8n71hbivVNk?feature=shared","type":"video","providerNameSlug":"youtube","responsive":true} -->
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">https://youtu.be/8n71hbivVNk?feature=shared</div>
  <figcaption class="wp-element-caption"><em>การทำงานของเครื่อง Fotona Laser</em></figcaption>
</figure>
<!-- /wp:embed -->

Output (รันครั้งที่ 2):
[เหมือนเดิม - Idempotent ✓]
```

### ตัวอย่างที่ 2: Classic Block
```html
Input:
<p>https://www.youtube.com/watch?v=ABC123&t=10s<br><em>วิธีการใช้งานเบื้องต้น</em></p>

Output:
<!-- wp:embed {"url":"https://www.youtube.com/watch?v=ABC123&t=10s","type":"video","providerNameSlug":"youtube","responsive":true} -->
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">https://www.youtube.com/watch?v=ABC123&t=10s</div>
  <figcaption class="wp-element-caption"><em>วิธีการใช้งานเบื้องต้น</em></figcaption>
</figure>
<!-- /wp:embed -->
```

### ตัวอย่างที่ 3: YouTube Shorts ⭐ NEW
```html
Input:
<p>https://www.youtube.com/shorts/AbCdEfG1234</p>
<p><em>Shorts Video Example</em></p>

Output:
<!-- wp:embed {"url":"https://www.youtube.com/shorts/AbCdEfG1234","type":"video","providerNameSlug":"youtube","responsive":true} -->
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">https://www.youtube.com/shorts/AbCdEfG1234</div>
  <figcaption class="wp-element-caption"><em>Shorts Video Example</em></figcaption>
</figure>
<!-- /wp:embed -->
```

### ตัวอย่างที่ 4: Dedupe (กรณี edge case)
```html
Input (figure ซ้อนกัน - ไม่ควรเกิด แต่ถ้าเกิด):
<figure class="wp-block-embed ...">
  <figure class="wp-block-embed ...">
    <div class="wp-block-embed__wrapper">https://youtu.be/NESTED</div>
  </figure>
</figure>

Output (หลัง Dedupe):
<figure class="wp-block-embed ...">
  <div class="wp-block-embed__wrapper">https://youtu.be/NESTED</div>
</figure>
```

## 🚀 Performance

- **Idempotent**: O(n) - ตรวจสอบแต่ละ element ครั้งเดียว
- **Dedupe**: O(m) - m = จำนวน figure ที่มี (มักน้อย)
- **Memory**: สร้าง DOM tree ชั่วคราวในหน่วยความจำ
- **Speed**: รวดเร็ว ไม่มี async operations

## 📝 Notes

- Caption ที่ยาวเกิน 180 ตัวอักษรจะไม่ถูกตรวจจับ (ป้องกัน false positive)
- Caption สั้นกว่า 3 ตัวอักษรจะไม่ถูกตรวจจับ
- URL ที่อยู่ในย่อหน้าที่มีข้อความอื่นจะไม่ถูกแปลง (ป้องกันการแปลงผิด)
- **Idempotent guarantee**: รันซ้ำได้ผลเดิม 100%
- **Dedupe guarantee**: ไม่มี figure ซ้อนกันในผลลัพธ์สุดท้าย

## 🔗 ไฟล์ที่เกี่ยวข้อง

- `convertYouTubeLinksToEmbed.js` - ฟังก์ชันหลัก (v2.0 - Idempotent + Dedupe)
- `convertYouTubeLinksToEmbed.test.js` - Test cases (9 tests รวม Idempotent + Dedupe)
- `convertYouTubeLinksToEmbed.sample.html` - Sample inputs
- `Home.jsx` - Integration point

## 🆚 เปรียบเทียบ v1.0 vs v2.0

| Feature | v1.0 | v2.0 |
|---------|------|------|
| แปลง URL → Figure | ✓ | ✓ |
| ตรวจจับ Caption | ✓ | ✓ |
| Idempotent | ✗ | ✓ ⭐ |
| Dedupe (ล้าง figure ซ้อน) | ✗ | ✓ ⭐ |
| ป้องกันแปลงซ้ำ | ✗ | ✓ ⭐ |
| รันซ้ำได้ผลเดิม | ✗ | ✓ ⭐ |

## ✅ Acceptance Criteria (ผ่านทั้งหมด)

- ✅ วางลิงก์เดี่ยว ๆ → ได้ `<figure>` ชั้นเดียว (ไม่มี figure ซ้อน)
- ✅ กรณี Classic block: `<p>URL<br><em>Caption</em></p>` → ได้ `<figure>` + `<figcaption>`
- ✅ ถัดไปเป็น `<p><em>Caption</em></p>` → ได้ caption และลบ `<p>` นั้นทิ้ง
- ✅ ถ้าลิงก์อยู่ใน figure อยู่แล้ว → ไม่แปลงซ้ำ
- ✅ รันซ้ำ (Idempotent) → ได้ผลเดิม
- ✅ วางใน Gutenberg แล้วแสดงผลปกติ

---

**📌 Version**: 3.0.1  
**📅 Updated**: 2025-10-29  
**🔒 Status**: Production Ready (Gutenberg Comment Blocks + Idempotent + Dedupe) ✅

### 🆕 v3.0.1 Updates:
- 🏷️ **Alias Export** - เพิ่ม `convertYouTubeLinksToWPEmbedWithCaption` (ทำงานเหมือนกัน)

### 🆕 v3.0.0 Major Update - Full Gutenberg Support:
- ⭐ **Gutenberg Comment Blocks** - มี `<!-- wp:embed {...} -->` และ `<!-- /wp:embed -->`
- ⭐ **WordPress แสดง preview วิดีโอทันที** - ไม่ต้อง "Clear Unknown Formatting"
- ⭐ **รองรับ YouTube Shorts** - `youtube.com/shorts/VIDEO_ID`
- ✅ **Caption มี `<em>` ครอบ** - ตามมาตรฐาน Gutenberg
- ✅ **Idempotent** - ตรวจจับทั้ง figure และ Gutenberg comments
- ✅ **Code Structure** - ใช้ template string ชัดเจน พร้อม indentation
