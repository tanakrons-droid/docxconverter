// src/utils/cleanGutenbergTables.test.js
// วิธีทดสอบ: เปิดไฟล์นี้ใน browser console หรือรันใน Node.js
// หรือเรียกใช้จาก React DevTools Console

import { cleanGutenbergTables } from './cleanGutenbergTables';

const sampleInput = `<figure class="wp-block-table"><table class="has-fixed-layout"><thead><tr><th><p><strong>คุณสมบัติ</strong></p></th><th><p><strong>Fotona 4D (Er:YAG+Nd:YAG)</strong></p></th><th><p><strong>IPL</strong></p></th><th><p><strong>CO2 Laser</strong></p></th><th><p><strong>Q-Switched</strong></p></th></tr><tr><th><p><strong>ประเภทพลังงาน</strong></p></th><th><p>เลเซอร์ (2 ความยาวคลื่น)</p></th><th><p>แสงความเข้มข้นสูง (ไม่ใช่เลเซอร์แท้)</p></th><th><p>เลเซอร์คาร์บอนไดออกไซด์</p></th><th><p>เลเซอร์สำหรับเม็ดสี</p></th></tr><tr><th><p><strong>จุดเด่น</strong></p></th><th><p>ยกกระชับ ฟื้นฟูผิว ปรับรูปหน้าในโปรแกรมเดียว</p></th><th><p>ลดเม็ดสี ลดรอยแดง กำจัดขน </p></th><th><p>ลอกผิว ผลัดเซลล์ผิวใหม่</p></th><th><p>ลบรอยสัก เม็ดสี ฝ้า กระ</p></th></tr></thead></table></figure>`;

// ทดสอบฟังก์ชัน
const result = cleanGutenbergTables(sampleInput);

console.log('=== INPUT ===');
console.log(sampleInput);

console.log('\n=== OUTPUT ===');
console.log(result);

// ตรวจสอบผลลัพธ์
console.log('\n=== VALIDATION ===');

// Test 1: ต้องมี <thead> เพียงแถวเดียว
const theadRows = (result.match(/<thead>[\s\S]*?<\/thead>/g) || [])
  .join('')
  .match(/<tr>/g);
console.log('✓ จำนวนแถวใน <thead>:', theadRows ? theadRows.length : 0, '(ควรเป็น 1)');

// Test 2: ต้องมี <tbody>
const hasTbody = /<tbody>/i.test(result);
console.log('✓ มี <tbody>:', hasTbody ? 'YES' : 'NO');

// Test 3: ไม่มี <p> ใน cell
const hasPInCells = /<(?:th|td)[^>]*>[\s\S]*?<p>/i.test(result);
console.log('✓ ไม่มี <p> ในเซลล์:', !hasPInCells ? 'YES' : 'NO (ยังมีอยู่)');

// Test 4: ไม่มี <th> ใน <tbody>
const hasThInTbody = /<tbody>[\s\S]*?<th>/i.test(result);
console.log('✓ ไม่มี <th> ใน <tbody>:', !hasThInTbody ? 'YES' : 'NO (ยังมีอยู่)');

// Test 5: คง figure และ class
const hasFigure = /figure class="wp-block-table"/.test(result);
const hasFixedLayout = /class="[^"]*has-fixed-layout[^"]*"/.test(result);
console.log('✓ คง figure.wp-block-table:', hasFigure ? 'YES' : 'NO');
console.log('✓ คง class has-fixed-layout:', hasFixedLayout ? 'YES' : 'NO');

// Test 6: Idempotent (รันซ้ำได้ผลลัพธ์เดิม)
const result2 = cleanGutenbergTables(result);
const isIdempotent = result === result2;
console.log('✓ Idempotent (รันซ้ำได้ผลเดิม):', isIdempotent ? 'YES' : 'NO');

console.log('\n=== SUMMARY ===');
const allPassed = 
  theadRows?.length === 1 && 
  hasTbody && 
  !hasPInCells && 
  !hasThInTbody && 
  hasFigure && 
  hasFixedLayout && 
  isIdempotent;

if (allPassed) {
  console.log('🎉 ALL TESTS PASSED! ✅');
} else {
  console.log('⚠️ SOME TESTS FAILED - CHECK OUTPUT');
}

export { sampleInput, result };









