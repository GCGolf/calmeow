-- ============================================================
-- Migration: Fix Streak Calculation (Definitive Fix v3)
-- วันที่: 2026-08-02
-- ============================================================
-- ปัญหา:
--   Query แบบเดิมดึง created_at ทุก record จาก food_logs แล้วมา dedup ฝั่ง JS
--   Supabase PostgREST มี default max_rows = 1000 rows ต่อ request
--   → User ที่มีข้อมูลเยอะ (เช่น 91+ entries/วัน) จะได้ข้อมูลแค่ ~11 วันล่าสุด
--   → Streak แสดงผิด ทั้งที่ User บันทึกครบทุกวัน
--
-- วิธีแก้:
--   ใช้ RPC Function ที่ทำ DISTINCT บน DB โดยตรง
--   ผลลัพธ์สูงสุด 90 rows (1 row ต่อ 1 วัน) ไม่ถูก row limit ตัด
--   พร้อมแปลง Timezone เป็น Asia/Bangkok ถูกต้อง 100%
--
-- วิธีใช้งาน:
--   1. เปิด Supabase Dashboard → SQL Editor
--   2. วาง SQL ทั้งหมดนี้แล้วกด Run
-- ============================================================

-- ลบ function เก่าถ้ามี (safe to re-run)
DROP FUNCTION IF EXISTS public.get_streak_dates(uuid, integer);

-- สร้าง RPC Function สำหรับคำนวณ Streak
CREATE OR REPLACE FUNCTION public.get_streak_dates(
  p_user_id uuid,
  p_days_back integer DEFAULT 90
)
RETURNS TABLE(log_date text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    TO_CHAR(
      (created_at AT TIME ZONE 'Asia/Bangkok')::date,
      'YYYY-MM-DD'
    ) AS log_date
  FROM food_logs
  WHERE
    user_id = p_user_id
    AND created_at >= NOW() - (p_days_back || ' days')::interval
  ORDER BY log_date DESC;
$$;

-- ให้สิทธิ์ authenticated users เรียก function ได้
GRANT EXECUTE ON FUNCTION public.get_streak_dates(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_streak_dates(uuid, integer) TO service_role;

-- ============================================================
-- ทดสอบ (เปลี่ยน YOUR_USER_ID เป็น UUID จริง):
-- SELECT * FROM get_streak_dates('YOUR_USER_ID'::uuid, 90);
-- ============================================================
