import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, User, Ruler, Weight, Calendar, Activity, Target, Flame, TrendingDown, TrendingUp, Heart, Dumbbell } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { supabase } from '../services/supabaseClient';

interface UserProfile {
    display_name: string;
    weight: number;
    height: number;
    age: number;
    gender: 'male' | 'female';
    activity_level: string;
    tdee: number;
    bmr: number;
    target_weight: number;
    goal_type: string;
    target_end_date: string;
    daily_calorie_target: number;
    protein_target: number;
    carbs_target: number;
    fat_target: number;
    created_at: string;
}

const ProfilePage: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                if (data) {
                    setProfile({
                        display_name: data.display_name || data.username || 'Anonymous User',
                        weight: data.weight || data.current_weight || 0,
                        height: data.height || 0,
                        age: data.age || 0,
                        gender: data.gender || 'male',
                        activity_level: data.activity_level || 'sedentary',
                        tdee: data.tdee || 0,
                        bmr: data.bmr || 0,
                        target_weight: data.target_weight || 0,
                        goal_type: data.goal_type || 'maintain',
                        target_end_date: data.target_end_date || '',
                        daily_calorie_target: data.daily_calorie_target || data.tdee || 0,
                        protein_target: data.protein_target || 0,
                        carbs_target: data.carbs_target || 0,
                        fat_target: data.fat_target || 0,
                        created_at: data.created_at || ''
                    });
                }
            } catch (error) {
                console.warn('Error fetching profile, trying offline backup:', error);
            } finally {
                const offlineDataStr = localStorage.getItem('offline_profile');
                if (offlineDataStr) {
                    try {
                        const offlineData = JSON.parse(offlineDataStr);
                        setProfile(prev => ({
                            display_name: prev?.display_name || offlineData.display_name || offlineData.username || 'Anonymous User',
                            weight: prev?.weight || offlineData.weight || offlineData.current_weight || 0,
                            height: prev?.height || offlineData.height || 0,
                            age: prev?.age || offlineData.age || 0,
                            gender: prev?.gender || offlineData.gender || 'male',
                            activity_level: prev?.activity_level || offlineData.activity_level || 'sedentary',
                            tdee: prev?.tdee || offlineData.tdee || 0,
                            bmr: prev?.bmr || offlineData.bmr || 0,
                            target_weight: prev?.target_weight || offlineData.target_weight || 0,
                            goal_type: prev?.goal_type || offlineData.goal_type || 'maintain',
                            target_end_date: prev?.target_end_date || offlineData.target_end_date || '',
                            daily_calorie_target: prev?.daily_calorie_target || offlineData.daily_calorie_target || offlineData.tdee || 0,
                            protein_target: prev?.protein_target || offlineData.protein_target || 0,
                            carbs_target: prev?.carbs_target || offlineData.carbs_target || 0,
                            fat_target: prev?.fat_target || offlineData.fat_target || 0,
                            created_at: prev?.created_at || offlineData.created_at || ''
                        } as UserProfile));
                    } catch (e) {
                        console.error("Error parsing offline profile", e);
                    }
                }
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/auth');
    };

    const getActivityLabel = (level: string) => {
        const labels: { [key: string]: string } = {
            'sedentary': '🪑 นั่งทำงาน (แทบไม่ออกกำลังกาย)',
            'light': '🚶 ออกกำลังกายเบาๆ (1-3 วัน/สัปดาห์)',
            'moderate': '🏃 ออกกำลังกายปานกลาง (3-5 วัน/สัปดาห์)',
            'active': '💪 ออกกำลังกายหนัก (6-7 วัน/สัปดาห์)',
            'very_active': '🏋️ นักกีฬา / งานใช้แรงหนักมาก'
        };
        return labels[level] || level;
    };

    const getGoalLabel = (goal: string) => {
        const labels: { [key: string]: { text: string; icon: React.ReactNode; color: string } } = {
            'lose': { text: 'ลดน้ำหนัก', icon: <TrendingDown className="w-5 h-5" />, color: 'text-green-600 bg-green-50' },
            'maintain': { text: 'รักษาน้ำหนัก', icon: <Target className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
            'gain': { text: 'เพิ่มน้ำหนัก', icon: <TrendingUp className="w-5 h-5" />, color: 'text-orange-600 bg-orange-50' }
        };
        return labels[goal] || { text: goal, icon: <Target className="w-5 h-5" />, color: 'text-slate-600 bg-slate-50' };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    const goalInfo = getGoalLabel(profile?.goal_type || 'maintain');

    return (
        <div className="max-w-md mx-auto min-h-screen relative pb-10">
            {/* Header */}
            <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/30 backdrop-blur-xl z-20 border-b border-white/50">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-10 h-10 bg-white/40 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/60 text-slate-600 shadow-sm hover:bg-white/60 transition-all"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-black text-slate-800">โปรไฟล์ของฉัน</h1>
                <div className="w-10" />
            </header>

            <div className="px-6 space-y-6 pt-4">
                {/* Profile Card - Glass */}
                <div className="bg-white/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/60 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-orange-100/30 to-transparent -z-10" />
                    <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-4xl mb-4 border-4 border-white/80 shadow-lg">
                        {profile?.gender === 'female' ? '👩' : '👨'}
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-1">{profile?.display_name}</h2>
                    <p className="text-sm font-medium text-slate-400">สมาชิกตั้งแต่ {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                </div>

                {/* Goal Section - Glass */}
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">🎯 เป้าหมายของฉัน</h3>
                    <div className={`p-5 rounded-[2rem] border border-white/50 backdrop-blur-md flex items-center gap-4 ${goalInfo.color.replace('bg-', 'bg-').replace('50', '50/50')}`}>
                        <div className="w-12 h-12 rounded-2xl bg-white/60 flex items-center justify-center border border-white/40">
                            {goalInfo.icon}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-lg">{goalInfo.text}</h4>
                            <p className="text-sm opacity-80">
                                {profile?.weight} kg → {profile?.target_weight} kg
                                {profile?.target_end_date && ` (ภายใน ${new Date(profile.target_end_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body Stats - Glass */}
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">📊 ข้อมูลร่างกาย</h3>
                    <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-sm divide-y divide-white/40">
                        {[
                            { icon: '👤', label: 'เพศ', value: profile?.gender === 'female' ? 'หญิง' : 'ชาย' },
                            { icon: '🎂', label: 'อายุ', value: `${profile?.age} ปี` },
                            { icon: '📏', label: 'ส่วนสูง', value: `${profile?.height} ซม.` },
                            { icon: '⚖️', label: 'น้ำหนักปัจจุบัน', value: `${profile?.weight} กก.` },
                            { icon: '🎯', label: 'น้ำหนักเป้าหมาย', value: `${profile?.target_weight} กก.` },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="text-sm font-semibold text-slate-600">{item.label}</span>
                                </div>
                                <span className="text-base font-black text-slate-800">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Level - Glass */}
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">🏃 กิจกรรมประจำวัน</h3>
                    <div className="bg-white/40 backdrop-blur-xl p-5 rounded-[2rem] border border-white/60 shadow-sm">
                        <p className="text-base font-bold text-slate-700">{getActivityLabel(profile?.activity_level || 'sedentary')}</p>
                    </div>
                </div>

                {/* Metabolism Stats - Glass */}
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">🔥 การเผาผลาญ</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-orange-50/60 backdrop-blur-md p-4 rounded-[1.5rem] border border-orange-100/60">
                            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">TDEE</p>
                            <p className="text-2xl font-black text-orange-700 drop-shadow-sm">{Math.round(profile?.tdee || 0)}</p>
                            <p className="text-[10px] text-orange-500">แคลอรี่/วัน</p>
                        </div>
                        <div className="bg-blue-50/60 backdrop-blur-md p-4 rounded-[1.5rem] border border-blue-100/60">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">BMR</p>
                            <p className="text-2xl font-black text-blue-700 drop-shadow-sm">{Math.round(profile?.bmr || 0)}</p>
                            <p className="text-[10px] text-blue-500">แคลอรี่/วัน</p>
                        </div>
                    </div>
                </div>

                {/* Daily Targets - Glass */}
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">🍽️ เป้าหมายรายวัน</h3>
                    <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-sm divide-y divide-white/40">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🔥</span>
                                <span className="text-sm font-semibold text-slate-600">แคลอรี่เป้าหมาย</span>
                            </div>
                            <span className="text-base font-black text-orange-600">{Math.round(profile?.daily_calorie_target || 0)} kcal</span>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🥩</span>
                                <span className="text-sm font-semibold text-slate-600">โปรตีน</span>
                            </div>
                            <span className="text-base font-black text-cyan-600">{Math.round(profile?.protein_target || 0)} g</span>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🌾</span>
                                <span className="text-sm font-semibold text-slate-600">คาร์โบไฮเดรต</span>
                            </div>
                            <span className="text-base font-black text-amber-600">{Math.round(profile?.carbs_target || 0)} g</span>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">💧</span>
                                <span className="text-sm font-semibold text-slate-600">ไขมัน</span>
                            </div>
                            <span className="text-base font-black text-lime-600">{Math.round(profile?.fat_target || 0)} g</span>
                        </div>
                    </div>
                </div>

                {/* Sign Out */}
                <button
                    onClick={handleSignOut}
                    className="w-full bg-slate-800 text-white p-5 rounded-[2rem] font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all mt-8"
                >
                    <LogOut className="w-5 h-5" />
                    ออกจากระบบ
                </button>

                <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-4">
                    CalMeow v1.0.0
                </p>
            </div>
        </div>
    );
};

export default ProfilePage;

