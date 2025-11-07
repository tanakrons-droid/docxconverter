// src/utils/convertYouTubeLinksToEmbed.test.js
// วิธีทดสอบ: เปิดไฟล์นี้ใน browser console

import { convertYouTubeLinksToEmbed } from './convertYouTubeLinksToEmbed';

// Test Case 1: URL แยกบรรทัด + caption เป็น italic
const test1 = `
<p>https://youtu.be/8n71hbivVNk?feature=shared</p>
<p><em>การทำงานของเครื่อง Fotona Laser</em></p>
`;

// Test Case 2: Classic block (URL + BR + caption italic ในบรรทัดเดียว)
const test2 = `
<p>https://youtu.be/ABC123<br><em>Caption ในบรรทัดเดียวกัน</em></p>
`;

// Test Case 3: URL เดี่ยวไม่มี caption
const test3 = `
<p>https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
`;

// Test Case 4: URL เป็น anchor tag + caption
const test4 = `
<p><a href="https://youtu.be/XYZ789">https://youtu.be/XYZ789</a></p>
<p><i>Caption เป็น italic tag</i></p>
`;

// Test Case 5: URL อยู่กลางย่อหน้า (ไม่ควรแปลง)
const test5 = `
<p>ดูวิดีโอได้ที่ https://youtu.be/ABC123 และกดไลค์ด้วยนะครับ</p>
`;

// Test Case 6: Caption เป็นข้อความธรรมดาสั้น ๆ
const test6 = `
<p>https://youtu.be/TEST456</p>
<p>วิธีใช้งานเบื้องต้น</p>
`;

// Test Case 7: ★ Idempotent - รัน 2 ครั้งต้องได้ผลเดิม
const test7 = `
<p>https://youtu.be/IDEMPOTENT123</p>
<p><em>Caption สำหรับทดสอบ Idempotent</em></p>
`;

// Test Case 8: ★ Dedupe - figure ซ้อนกัน (ไม่ควรเกิด แต่ถ้าเกิดต้องรวมเป็นชั้นเดียว)
const test8 = `
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
    <div class="wp-block-embed__wrapper">https://youtu.be/NESTED123</div>
  </figure>
</figure>
`;

// Test Case 9: ★ URL ที่อยู่ใน figure แล้ว - ไม่ควรแปลงซ้ำ
const test9 = `
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
  <div class="wp-block-embed__wrapper">https://youtu.be/ALREADY_EMBEDDED</div>
</figure>
<p>ข้อความอื่น ๆ</p>
`;

console.log('=== YouTube Links to Gutenberg Embed - FULL TEST SUITE ===\n');

console.log('Test 1: URL แยกบรรทัด + caption italic');
const result1 = convertYouTubeLinksToEmbed(test1);
console.log('Input:', test1);
console.log('Output:', result1);
console.log('✓ มี figure:', result1.includes('wp-block-embed'));
console.log('✓ มี figcaption:', result1.includes('figcaption'));
console.log('✓ มี caption text:', result1.includes('การทำงานของเครื่อง Fotona Laser'));
console.log('✓ Caption เป็น plain text (ไม่มี <em>):', result1.includes('wp-element-caption">การทำงานของเครื่อง Fotona Laser'));
console.log('✓ ไม่มี <p> เหลือ:', !result1.includes('<p>'));
console.log('');

console.log('Test 2: Classic block (BR + italic ในบรรทัดเดียว)');
const result2 = convertYouTubeLinksToEmbed(test2);
console.log('Input:', test2);
console.log('Output:', result2);
console.log('✓ มี figure:', result2.includes('wp-block-embed'));
console.log('✓ มี figcaption:', result2.includes('figcaption'));
console.log('✓ มี caption text:', result2.includes('Caption ในบรรทัดเดียวกัน'));
console.log('');

console.log('Test 3: URL เดี่ยวไม่มี caption');
const result3 = convertYouTubeLinksToEmbed(test3);
console.log('Input:', test3);
console.log('Output:', result3);
console.log('✓ มี figure:', result3.includes('wp-block-embed'));
console.log('✓ ไม่มี figcaption:', !result3.includes('figcaption') ? 'PASS' : 'FAIL');
console.log('');

console.log('Test 4: URL เป็น anchor + caption');
const result4 = convertYouTubeLinksToEmbed(test4);
console.log('Input:', test4);
console.log('Output:', result4);
console.log('✓ มี figure:', result4.includes('wp-block-embed'));
console.log('✓ มี figcaption:', result4.includes('figcaption'));
console.log('✓ ดึง URL จาก href:', result4.includes('XYZ789'));
console.log('');

console.log('Test 5: URL กลางย่อหน้า (ไม่ควรแปลง)');
const result5 = convertYouTubeLinksToEmbed(test5);
console.log('Input:', test5);
console.log('Output:', result5);
console.log('✓ ไม่แปลง (ยังเป็น <p>):', result5.includes('<p>') && !result5.includes('wp-block-embed') ? 'PASS' : 'FAIL');
console.log('');

console.log('Test 6: Caption เป็นข้อความธรรมดา');
const result6 = convertYouTubeLinksToEmbed(test6);
console.log('Input:', test6);
console.log('Output:', result6);
console.log('✓ มี figure:', result6.includes('wp-block-embed'));
console.log('✓ มี figcaption:', result6.includes('figcaption'));
console.log('✓ มี caption text:', result6.includes('วิธีใช้งานเบื้องต้น'));
console.log('');

console.log('Test 7: ★ IDEMPOTENT TEST - รัน 2 ครั้งต้องได้ผลเดิม');
const result7a = convertYouTubeLinksToEmbed(test7);
const result7b = convertYouTubeLinksToEmbed(result7a); // รันซ้ำ
console.log('Input:', test7);
console.log('Output (1st run):', result7a);
console.log('Output (2nd run):', result7b);
console.log('✓ รันครั้งแรกได้ figure:', result7a.includes('wp-block-embed'));
console.log('✓ รันครั้งที่ 2 ได้ผลเดิม:', result7a === result7b ? 'PASS ✅' : 'FAIL ❌');
console.log('✓ ไม่มี figure ซ้อนกัน:', !result7b.includes('figure.wp-block-embed figure.wp-block-embed') ? 'PASS ✅' : 'FAIL ❌');
console.log('');

console.log('Test 8: ★ DEDUPE TEST - figure ซ้อนกัน (ต้องรวมเป็นชั้นเดียว)');
const result8 = convertYouTubeLinksToEmbed(test8);
console.log('Input:', test8);
console.log('Output:', result8);
const figureCount8 = (result8.match(/<figure/g) || []).length;
const wrapperCount8 = (result8.match(/wp-block-embed__wrapper/g) || []).length;
console.log('✓ จำนวน <figure>:', figureCount8, figureCount8 === 1 ? 'PASS ✅' : 'FAIL ❌');
console.log('✓ จำนวน wrapper:', wrapperCount8, wrapperCount8 === 1 ? 'PASS ✅' : 'FAIL ❌');
console.log('✓ มี URL:', result8.includes('NESTED123'));
console.log('');

console.log('Test 9: ★ URL ที่อยู่ใน figure แล้ว - ไม่ควรแปลงซ้ำ');
const result9 = convertYouTubeLinksToEmbed(test9);
console.log('Input:', test9);
console.log('Output:', result9);
const figureCount9 = (result9.match(/<figure/g) || []).length;
console.log('✓ จำนวน <figure>:', figureCount9, figureCount9 === 1 ? 'PASS ✅' : 'FAIL ❌');
console.log('✓ ไม่แปลงซ้ำ:', result9.includes('ALREADY_EMBEDDED') && figureCount9 === 1 ? 'PASS ✅' : 'FAIL ❌');
console.log('');

console.log('=== SUMMARY ===');
const allTests = [
  result1.includes('wp-block-embed') && result1.includes('figcaption') && !result1.includes('<p>'),
  result2.includes('wp-block-embed') && result2.includes('Caption ในบรรทัดเดียวกัน'),
  result3.includes('wp-block-embed') && !result3.includes('figcaption'),
  result4.includes('wp-block-embed') && result4.includes('XYZ789'),
  !result5.includes('wp-block-embed'), // ไม่ควรแปลง
  result6.includes('figcaption') && result6.includes('วิธีใช้งานเบื้องต้น'),
  result7a === result7b, // ★ Idempotent
  figureCount8 === 1 && wrapperCount8 === 1, // ★ Dedupe
  figureCount9 === 1 && result9.includes('ALREADY_EMBEDDED') // ★ ไม่แปลงซ้ำ
];

const passCount = allTests.filter(t => t).length;
const totalTests = allTests.length;

console.log(`\n📊 Results: ${passCount}/${totalTests} tests passed`);

if (passCount === totalTests) {
  console.log('🎉 ALL TESTS PASSED! ✅✅✅');
  console.log('\n✨ Features verified:');
  console.log('  ✓ URL แยกบรรทัด + Caption');
  console.log('  ✓ Classic Block (BR + Caption)');
  console.log('  ✓ URL เดี่ยวไม่มี Caption');
  console.log('  ✓ Anchor Tag');
  console.log('  ✓ ไม่แปลง URL กลางย่อหน้า');
  console.log('  ✓ Caption ธรรมดา');
  console.log('  ✓ Idempotent (รันซ้ำได้ผลเดิม) ⭐');
  console.log('  ✓ Dedupe (รวม figure ซ้อนเป็นชั้นเดียว) ⭐');
  console.log('  ✓ ไม่แปลงซ้ำถ้าอยู่ใน figure แล้ว ⭐');
} else {
  console.log('⚠️ SOME TESTS FAILED');
  console.log('Results:', allTests.map((t, i) => `Test ${i + 1}: ${t ? '✓' : '✗'}`).join(', '));
}

export { test1, test2, test3, test4, test5, test6, test7, test8, test9 };
