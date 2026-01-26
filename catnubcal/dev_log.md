# Developer Log - NekoFit Project
**Last Updated:** 2026-01-25 12:45
**Status:** Gamification Complete, Performance Refactored (GPU), Ready for QA

---

## ✅ Completed Today (Session 9 - Jan 25)

### 1. Gamification & Pet Features (การเล่นและสัตว์เลี้ยง)
- **Feeding Animation (ป้อนอาหาร) 🐟**:
    - **Trigger**: Happens automatically when logging food.
    - **Reaction**: Cat plays "Eating" animation and says "ง่ำๆ อร่อยจัง! 😋".
- **Streak Rewards (รางวัลวินัย) 🧶📦**:
    - **Interactive Yarn**:
        - Streak 7+ Days: **Yarn Ball** (🧶).
        - **Click Action**: Bounces smoothly, Cat walks to it and Meows/Anger response.
    - **Visual Box**:
        - Streak 14+ Days: **Cardboard Box** (📦) (Changed from 30).
    - **Dual Cat Mode**:
        - Streak 30+ Days: **Friend Cat** joins the walk! 🐱🐱
        - **Sync Movement**: Second cat walks together with the main cat (no collision).
    - **Cafe Theme (Streak 45+)**:
        - Unlocks a "Cat Cafe" background wallpaper (Kawaii Pastel style).
        - Hides the default rug to show the cafe floor.
### 3. Performance Optimization (The "Butter Smooth" Update) 🚀
- **Animation Refactor**: Switched `PetSmartWalk` from `left` property (Layout thrashing) to `transform: translateX` (GPU Composited).
- **Result**: Significant smoothness improvement, especially on mobile devices.
- **Asset Optimization**: Implemented lazy loading for new assets (Dual Cat, Cafe BG).
- **Heart Health**: Added **Recovery Guide Tooltip** 🩺.
    - Suggests daily intake targets when Cholesterol/Sodium exceeds limits.
    - Premium Card UI with centered alignment.
- **UI Fixes**: 
    - Fixed Yarn Ball overlapping menus (Stacking Context Isolation z-60/z-0).
    - Fixed Heart Health Card clipping (overflow-visible).
- **Date Picker Fixes**: Resolved crash in `Dashboard.tsx`.
- **Diary Tab Polish**: Removed redundant calendar header.

---

## ✅ Completed Today (Session 8 - Jan 22)

### 1. Editable Macros on Food Preview (Custom Nutrition)
- **Feature**: Users can now manually edit Protein, Carbs, and Fat values in the Food Detail modal.
- **Logic**:
    - **Toggle System**: Added an "Edit" (pencil) button to unlock the input fields.
    - **Auto-Calculation**: Editing any macro automatically recalculates total Calories (P*4 + C*4 + F*9).
    - **Smart Saving**: Fixed save logic to respect manual overrides even if the portion multiplier (1.0) didn't change.
- **UI**:
    - **Clean Inputs**: Removed browser-default number spinners.
    - **Inline Units**: "g" unit displayed inline with the number for a cohesive look.
    - **Typography**: Maintained large, readable fonts.

### 2. Branding & Polish
- **Loading Screen**: Replaced generic emoji with custom `@headcat.png` animation (Bouncing Cat).
- **Logos**: Updated app icons (`logo192.png`, `logo512.png`).
- **Refinement**: General cleanup of input states and button transitions.

### 3. Deployment
- **Status**: All changes pushed to `main`.
- **Docs**: Updated `task.md` and `walkthrough.md`.

---

## ✅ Completed Today (Session 7 - Jan 21)

### 1. Health Grade Calendar Integration (ปฏิทินวินัย)
- **Feature**: Integrated daily health grades into the calendar.
- **Logic**: Calculates daily grade (A/B/C/F) based on Calories, Protein, Sugar, and Sodium.
- **Visuals**:
    - **Uniform Colors**: Uses Green for all logged days (A/B/C/F) to maintain cleanliness.
    - **Tooltip**: Added [?] icon with hover tooltip explaining the 4 grading criteria.
    - **Daily vs Weekly**: Clarified that Calendar = Daily Grade, Main Card = Weekly Average.

### 2. UI Polish & Refinement
- **Compact Water Tracker**:
    - Reduced padding and element heights.
    - Updated label to "250 มล. / แก้ว".
- **Chatty Cat (PetSmartWalk)**:
    - Added **10+ Random Messages** for the cat to speak while walking.
    - Messages range from health reminders to encouragement.
- **Header Refinement**:
    - Removed redundant elements (ring, settings, dot).
    - Changed "Remaining" to "Consumed" calories.

### 3. Documentation
- Updated `walkthrough.md` with new features.
- Updated `task.md` status.

---

## ✅ Completed Today (Session 6 - Jan 20)

### 4. iOS Performance Optimization (Pending Verification)
- **Problem**: Laggy performance on iPhone/Chrome due to heavy CSS effects.
- **Fixes Applied**:
    - **MovingBackground**: Disabled infinite animation on mobile devices.
    - **PetSmartWalk**: Reduced animation frequency (0.5s -> 0.8s) and intensity. Added `prefers-reduced-motion` support.
    - **Images**: Added `loading="lazy"` and `decoding="async"`.
- **Next Step**: Detailed verification on actual device.

### 1. Favorite Menu Feature (เมนูที่ถูกใจ)
- **Feature**: Added "Favorite Menu" system for quick logging.
- **Components**:
    - `FavoriteMenuModal`: Displays list of favorites with preview images.
    - **Toggle System**: Heart icon (❤️/🤍) on food detail modal to add/remove favorites.
    - **Integration**: Added "Favorite Menu" button to the Add Food modal.
- **Database**: efficient `favorite_foods` table with RLS and UNIQUE constraints.
- **UX**: Automatic data mapping (saves macros, calories, image) for instant logging.

### 2. UI/UX Improvements
- **Manual Entry Form**: Hidden by default to declutter UI. Toggles via "เพิ่มรูปภาพและกรอกข้อมูลเอง" button.
- **Heart Icon**: Moved to prominent position next to food name.
- **Real-time Feedback**: Immediate heart state updates.
- **Preview Images**: Correctly mapped from DB (`snake_case` -> `camelCase`) to ensure images show up.

### 3. Critical Bug Fixes
- **Portion Control Fix**: Fixed `invalid input syntax for type integer` error by forcing `Math.round()` on all nutritional values before saving.
- **Duplicate Favorites**: Added UNIQUE constraint on `(user_id, name)` to prevent duplicate entries.
- **Z-Index Fixes**: Fixed modal layering issues where Favorite modal appeared behind Add modal.

### 4. iOS Performance Optimization (In Progress)
- **Problem**: Significant UI lag reported on iPhone (Chrome/Safari).
- **Analysis**: Caused by heavy `backdrop-blur` usage (CPU-bound on iOS) and infinite CSS animations.
- **Fixes Applied (localy - not pushed)**:
    - **MovingBackground**: Disabled infinite pattern animation on mobile devices.
    - **PetSmartWalk**: Reduced animation frequency (0.5s -> 0.8s) and usage of `prefers-reduced-motion`.
    - **Images**: Added `loading="lazy"` and `decoding="async"` to heavy resources.
- **Pending**: Monitoring `backdrop-blur` impact. If lag persists, will implement GPU forcing or disable blur on mobile.

### 4. iOS Performance Optimization (In Progress)
- **Problem**: Significant UI lag reported on iPhone (Chrome/Safari).
- **Analysis**: Caused by heavy `backdrop-blur` usage (CPU-bound on iOS) and infinite CSS animations.
- **Fixes Applied (localy - not pushed)**:
    - **MovingBackground**: Disabled infinite pattern animation on mobile devices.
    - **PetSmartWalk**: Reduced animation frequency (0.5s -> 0.8s) and intensity. Added `prefers-reduced-motion` support.
    - **Images**: Added `loading="lazy"` and `decoding="async"` to heavy resources.
- **Pending**: Monitoring `backdrop-blur` impact. If lag persists, will implement GPU forcing or disable blur on mobile.

## ✅ Completed Today (Session 5 - Jan 19)

### 1. AI Food Recognition Optimization (Prompt Engineering)
- **Problem**: AI failed to recognize simple foods (e.g., Rice, Bread) and hallucinated complex dishes.
- **Solution**:
    - **Persona**: Added "Expert Thai Nutritionist" persona.
    - **Logic Split**: Instructed AI to differentiate between "Simple Foods" (identify directly) and "Complex Dishes" (scan for toppings).
    - **Model**: Retained `gemini-3-flash-preview` per user request.
    - **Result**: AI now correctly handles both simple items and complex meals.

### 2. UI Refinement (Portion Control)
- **Problem**: "Plate" visualization was too large and cluttered the UI.
- **Solution**:
    - **New Design**: Moved portion control to the Header (Compact 4-Quadrant Icon).
    - **Interaction**: Users click quadrants (25%, 50%, 75%, 100%) to adjust.
    - **Simplified**: Removed the bottom button row.

### 3. Deployment (Vercel)
- **Config**: Added `vercel.json` and set Root Directory to `catnubcal`.
- **Status**: Code pushed to GitHub (`eecef4e`) and watching for Vercel deployment.

---

## ✅ Completed Today (Session 4 - Jan 14)

### 1. Deep Insights Refinement (Clean & Simple)
User requested a strictly cleaner look, removing complexity and gamification attempts.
- **[DeepInsights.tsx](./components/DeepInsights.tsx)**:
    - **Removed**: "30-Day Trend" (Weight Projection) due to lack of meaningful data.
    - **Removed**: "Meal Timing" (Last meal/Fasting) per user request.
    - **Removed**: "Nutrient Score Breakdown" & "Health Score" (complex sub-scores) per user request.
    - **Retained**:
        - Weekly Calorie Balance (Deficit/Surplus).
        - Macro Balance Analysis (Protein/Carbs/Fat bars).
        - Metabolic Split Education (BMR vs Activity visual).
        - Consistency Score (Logging discipline).

### 2. Feature Experiments (Attempted & Reverted)
- **Neko Companion**: Implemented a gamified cat avatar reacting to calorie balance. User reviewed and requested removal.
- **Detailed Health Score**: Implemented detailed progress bars for score breakdown. User requested removal to keep it simple.

### 3. New Features (Implemented)
- **Menu Roulette / "Blind Box" Food (กล่องจุ่มอาหาร)**:
    - Added to Diary tab.
    - **Randomizer**: Suggests Thai dishes based on remaining calories.
    - **Smart Logic**: Disables spin if calorie limit exceeded (shows 'Target Reached' message).
    - **UI**: "Blind Box" style (initially hidden) -> Reveals food on click.
    - **Performance**: High performance, instant load (static data), no lag.

### 3. Current Code State
- Codebase is returned to a "Clean Slate".
- No unused components (deleted `NekoCompanion.tsx`).
- No unused logic (cleaned `nutritionScience.ts`).

---

## ✅ Completed Today (Session 2)

### 1. User Authentication System
- **[AuthContext.tsx](./services/AuthContext.tsx)** - Global auth state (signIn, signUp, signOut)
- **[AuthPage.tsx](./components/AuthPage.tsx)** - Login/Signup UI (Thai)
- **[App.tsx](./App.tsx)** - Protected routes with auth guards
- Updated: OnboardingWizard, Dashboard, Analytics → use `user.id` from auth

### 2. Bug Fixes (Critical)
- **Food Delete Fix**: Now deletes correctly from Database + LocalStorage + UI.
- **Image Preview Fixes**:
    - **Database Save**: Images now saved to `image_url` column.
    - **Async Capture**: Fixed timing issue where image save ran before FileReader completed.
    - **State Clearing**: Added `setPreviewImage(null)` to clear image after submission (prevents old image persisting).
    - **Column Mapping**: Fixed `name` → `food_name` mismatch.

---

## ✅ Completed Previously (Session 1)

- Real Data Integration (Supabase)
- Expert Nutrition Logic (Mifflin-St Jeor, TDEE, Macros)
- Offline Mode Fallback (localStorage)
- Navigation & Bug Fixes

---

## 📝 Next Steps

### 1. Test Authentication
```
1. Go to http://localhost:3000
2. Sign up with email/password
3. Complete onboarding → Dashboard
4. Sign out → Returns to login
```

### 2. Disable Email Confirmation (Optional)
In Supabase Dashboard:
`Authentication > Settings > Disable "Confirm email"`

### 3. Future Enhancements
- [ ] Pet Evolution (XP & Leveling)
- [ ] Social Features / Leaderboards
- [ ] Meal Type Selection (มื้อเช้า/กลางวัน/เย็น)
- [ ] Profile Settings Page

---

## ⚠️ Known Issues

1. **RLS Policy** - Database writes may fail if RLS is enabled. Run SQL to disable:
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs DISABLE ROW LEVEL SECURITY;
```

2. **Old Food Items** - Items created before image fix show mockup image (expected)

---

## ✅ Completed Recently (Jan 12 - Session 3)

### 1. UI Refinement & Simplification
- **Stats Revert**:
    - Removed `TiltCard` & 3D effects to improve performance and cleanliness.
    - Removed "Dynamic Mood Themes" to focus on core usability.
    - Restored clean, modern flat design for Dashboard.
