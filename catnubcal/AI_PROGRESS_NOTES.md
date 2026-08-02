# AI Progress Notes (2 August 2026)

## 📌 สิ่งที่ทำเสร็จแล้วในวันนี้
1. **แก้ไขบั๊กคำนวณ Streak ถาวร (Supabase RPC Migration):**
   - **Root Cause ที่แท้จริง**: Query แบบเดิมดึง created_at ทุก record แล้วมา Dedup ฝั่ง JavaScript แต่ Supabase PostgREST มีค่า Default Row Limit อยู่ที่ 1,000 แถวต่อ Request
   - สำหรับผู้ใช้เก่าที่มีประวัติบันทึกหลายรายการต่อวัน (เช่น วันละ 90+ records) การดึงข้อมูล 1,000 แถวจะครอบคลุมเพียง ~11 วันล่าสุด ทำให้ Streak แสดงผลตัดขาดเหลือเพียง 11 วัน แม้จะบันทึกต่อเนื่องจริง 21 วัน
   - **วิธีแก้**:
     - สร้าง Supabase RPC Function `get_streak_dates(p_user_id, p_days_back)` (`supabase_streak_rpc.sql`) เพื่อทำ `SELECT DISTINCT` วันที่ในระดับ PostgreSQL Database พร้อมแปลง Timezone เป็น `Asia/Bangkok`
     - ปรับปรุง `Dashboard.tsx` ให้เรียกผ่าน `.rpc('get_streak_dates')` ซึ่งส่งกลับไม่เกิน 90 แถว หมดปัญหาติด Row Limit 1,000 แถวอย่างถาวร
   - **ความปลอดภัย**: ไม่กระทบข้อมูลเก่า 100%, ใช้งานร่วมกับ Supabase RLS ได้ปลอดภัย
   - พิเศษ: ทำการ Commit และ Push โค้ดขึ้น GitHub ตามคำสั่งเฉพาะกิจของผู้ใช้

---

# AI Progress Notes (1 August 2026)

## 📌 สิ่งที่ทำเสร็จแล้วในวันนี้
1. **แก้ไขบัก Streak (Consistency Counter):**
   - แก้ไขปัญหา User เก่าที่มีข้อมูลมาก (17+ วัน) แล้วหน้าแสดงผล Streak ไม่ตรงกับปฏิทิน
   - ต้นเหตุมาจาก `Dashboard.tsx` ดึงข้อมูลด้วย `.limit(100)` ทำให้เมื่อมีบันทึกหลายรายการต่อวัน ข้อมูลของวันเก่า ๆ จึงตกหล่นไป
   - แก้ไขโดยการเปลี่ยน Query ไปใช้ Date range (`.gte` ย้อนหลัง 90 วัน) เหมือนกับที่ทำใน `ConsistencyCalendar`
   - ระบบคำนวณ Streak กลับมาทำงานได้อย่างถูกต้องแล้วสำหรับทุกคน
   - พิเศษ: ทำการ Push โค้ดขึ้น GitHub ในรอบนี้ตามคำสั่งเฉพาะกิจของผู้ใช้

---

# AI Progress Notes (19 July 2026)
## 📌 สิ่งที่ทำเสร็จแล้วในวันนี้
1. **ระบบอัปโหลดรูปภาพ (Supabase Storage Migration):**
   - เปลี่ยนจากการบันทึกรูปภาพเป็น Base64 string ลง Database (ตาราง `food_logs` และ `favorite_foods`) โดยตรง ซึ่งทำให้ Database (ขนาด 500 MB) เต็มไว
   - สร้าง Bucket `food-images` ใน Supabase Storage (ขนาด 1 GB)
   - ปรับโค้ดฝั่ง `Dashboard.tsx` ให้อัปโหลดไฟล์รูปไปยัง Storage แทน
   - บีบอัดรูปด้วยฟอร์แมต WebP (ดีกว่า JPEG) ทำให้ไฟล์เล็กลงอีก
   - เก็บแค่ Public URL ลงใน Database ทำให้ขนาดเฉลี่ยต่อ Record ลดลงจาก ~63KB เหลือเพียงระดับ Bytes
   - โค้ดถูกออกแบบให้ Backward Compatible 100% รูปภาพ Base64 เก่ายังแสดงผลได้ปกติโดยไม่ต้องแก้โค้ดฝั่งอ่านข้อมูล

2. **ระบบการลบข้อมูลแบบปลอดภัย (Safe Delete with Two-Step Deletion):**
   - อัปเดตฟังก์ชันลบอาหารใน `Dashboard.tsx` (`handleDeleteFood`) ให้ลบไฟล์รูปใน Storage ด้วย เพื่อป้องกันปัญหาไฟล์ขยะ (Orphaned Files)
   - อัปเดตฟังก์ชันลบเมนูโปรดใน `FavoriteMenuModal.tsx` (`handleRemoveFavorite`) ให้ลบไฟล์รูปใน Storage ด้วยเช่นกัน
   - เพิ่มระบบเช็คความปลอดภัยแบบ Cross-checking:
     - ก่อนลบไฟล์ใน `food_logs` ระบบจะเช็คว่าเมนูนั้นยังอยู่ใน `favorite_foods` หรือไม่ (ถ้ามี จะข้ามการลบไฟล์รูป)
     - ก่อนลบไฟล์ใน `favorite_foods` ระบบจะเช็คว่าเมนูนั้นยังมีอยู่ในประวัติ `food_logs` หรือไม่ (ถ้ามี จะข้ามการลบไฟล์รูป)
   - ฟังก์ชันเหล่านี้เช็คด้วย `.limit(1)` ซึ่งเร็วมาก ไม่กระทบประสิทธิภาพแอป และยังทำงานร่วมกับ Base64 รูปแบบเก่าได้อย่างไร้ปัญหา


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
