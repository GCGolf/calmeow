# AI Progress Notes (19 July 2026)

## 📌 สิ่งที่ทำเสร็จแล้วในวันนี้
1. **ระบบอัปโหลดรูปภาพ (Supabase Storage Migration):**
   - เปลี่ยนจากการบันทึกรูปภาพเป็น Base64 string ลง Database (ตาราง `food_logs` และ `favorite_foods`) โดยตรง ซึ่งทำให้ Database (ขนาด 500 MB) เต็มไว
   - สร้าง Bucket `food-images` ใน Supabase Storage (ขนาด 1 GB)
   - ปรับโค้ดฝั่ง `Dashboard.tsx` ให้อัปโหลดไฟล์รูปไปยัง Storage แทน
   - บีบอัดรูปด้วยฟอร์แมต WebP (ดีกว่า JPEG) ทำให้ไฟล์เล็กลงอีก
   - เก็บแค่ Public URL ลงใน Database ทำให้ขนาดเฉลี่ยต่อ Record ลดลงจาก ~63KB เหลือเพียงระดับ Bytes
   - โค้ดถูกออกแบบให้ Backward Compatible 100% รูปภาพ Base64 เก่ายังแสดงผลได้ปกติโดยไม่ต้องแก้โค้ดฝั่งอ่านข้อมูล

---

# AI Progress Notes (15 July 2026)

## 📌 สิ่งที่ทำเสร็จแล้วในวันนี้
1. **Refactored Health Logic (Centralized System):**
   - ดึงสูตรคำนวณที่กระจัดกระจายมารวมไว้ที่ `services/health-logic.ts` (Single Source of Truth)
   - ครอบคลุมฟังก์ชัน `calculateBMR`, `calculateTDEE`, `calculateMacros`, `calculateDaysToGoal`, และฟังก์ชัน Data Normalization 

2. **ปรับปรุง Logic การคำนวณ TDEE (Activity Multiplier):**
   - แยกการคำนวณเป็น 2 ส่วน: Base Lifestyle (พฤติกรรมประจำวัน) และ Exercise Bonus (การออกกำลังกาย)
   - ปรับการคำนวณโบนัสให้อิงตามผลรวมนาทีต่อสัปดาห์ (Frequency x Duration) 
   - เพิ่มกล่องข้อความอธิบาย UI Hint ในหน้า Onboarding เพื่อให้ผู้ใช้เข้าใจง่ายขึ้น

3. **Smart UX Enhancements (Profile & Dashboard):**
   - **ProfilePage**: เพิ่มเงื่อนไขซ่อนปุ่ม "บันทึกแผนนี้" และเมนูสลับแผน หากแคลอรี่เป้าหมายตั้งต้นมากกว่า BMR อยู่แล้ว (ป้องกันความสับสน)
   - **Dashboard**: เพิ่มป้ายประกาศ (Banner) สีม่วงด้านบน แจ้งเตือนเรื่องการอัปเดตระบบคำนวณแคลอรี่ใหม่ โดยมีปุ่ม X เพื่อปิด (บันทึกการรับรู้ลง LocalStorage)

4. **Clean Code & Bug Fixes:**
   - ทำความสะอาด Dead Code / Unused Imports ออกจาก Onboarding และ Profile
   - แก้ปัญหา Hook Stale closure และใส่ `Check` icon ที่เผลอลบกลับเข้ามา
   - ทำการ Build Check และ Push โค้ดทั้งหมดขึ้น GitHub ตามคำสั่งพิเศษ

---

# AI Progress Notes (13 July 2026)## 📌 สิ่งที่ทำเสร็จแล้วในวันนี้
1. **ระบบ AI วิเคราะห์รูปภาพ (Image Analysis):** 
   - เปลี่ยนจาก Google SDK (ที่เจอปัญหาเรื่อง Quota จำกัด) ไปใช้ **OpenRouter API** แทน
   - ใช้โมเดล `google/gemini-3.1-flash-lite` ในการสแกนรูปภาพผ่าน `fetch` แบบปกติ
   - ใช้งานได้เสถียรและเรียกใช้จาก `process.env.API_KEY` (ในไฟล์ `.env.local`) ที่เป็น Key ของ OpenRouter

2. **ระบบ AI แนะนำเมนู (Food Suggestion):**
   - เพิ่มปุ่ม "AI แนะนำเมนูวันนี้" ในหน้า Diary 
   - ผูกระบบเข้ากับ OpenRouter API (โมเดล `google/gemini-3.1-flash-lite`) แทนระบบสุ่มจากฐานข้อมูลออฟไลน์
   - มีการปรับแต่ง Prompt ให้แนบ `Random Seed` และปรับ `Temperature = 0.9` เพื่อให้ AI เสนอเมนูที่ไม่ซ้ำซากจำเจและมีความหลากหลาย
   - มีระบบ Fallback กลับไปใช้ข้อมูลออฟไลน์อัตโนมัติหากการเรียก API ล้มเหลว

3. **แก้ไขบั๊กจุกจิก:**
   - แก้ไขบั๊กหน้าแสดงผล Profile ที่แสดงเพศเป็น "ชาย" เสมอเมื่อเลือก "หญิง" (สาเหตุเพราะตอนเซฟบันทึกเป็น 'Female' แต่โค้ดเช็ค 'female' จึงได้ใส่เงื่อนไขให้เป็น Case-Insensitive แล้ว)

4. **แก้ไขปัญหา Database เต็มไว (Image Compression):**
   - เพิ่มระบบบีบอัดรูปภาพ (Client-side Canvas Image Compression) ในหน้า `Dashboard.tsx` 
   - ก่อนแปลงรูปภาพเป็น Base64 ได้ทำการย่อขนาดให้ความกว้าง/ความสูงไม่เกิน 400px และบีบอัดเป็น JPEG 60%
   - ช่วยลดขนาดรูปภาพที่จะเก็บลงฐานข้อมูลจาก 3-5 MB เหลือเพียง 10-40 KB ป้องกันปัญหาพื้นที่ Supabase 0.5 GB เต็มอย่างรวดเร็ว

5. **กฎสำคัญ (Strict Rule):**
   - ⚠️ **ห้าม Push Code ขึ้นระบบออนไลน์ (GitHub) โดยพลการเด็ดขาด จนกว่าผู้ใช้จะสั่งเท่านั้น**

## 🚀 แผนการทำงานต่อไป (สำหรับพรุ่งนี้)
- (ให้ผู้ใช้ออกคำสั่งเพิ่มเติมได้เลย ระบบตอนนี้เชื่อมต่อ API เสร็จสมบูรณ์ พร้อมรับฟีเจอร์ใหม่ๆ ครับ)
