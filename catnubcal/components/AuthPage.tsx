import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { motion } from 'framer-motion';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!email || !password) {
            setError('กรุณากรอกอีเมลและรหัสผ่าน');
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            return;
        }

        if (password.length < 6) {
            setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error.message || 'เข้าสู่ระบบไม่สำเร็จ');
                } else {
                    navigate('/dashboard');
                }
            } else {
                const { error } = await signUp(email, password);
                if (error) {
                    setError(error.message || 'สมัครสมาชิกไม่สำเร็จ');
                } else {
                    setMessage('สมัครสมาชิกสำเร็จ! กำลังนำคุณเข้าสู่ระบบ...');
                    // After signup, auto-login and go to onboarding
                    setTimeout(() => {
                        navigate('/onboarding');
                    }, 1500);
                }
            }
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาด');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            {/* Logo */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8 text-center"
            >
                <span className="text-6xl mb-4 block">😺</span>
                <h1 className="text-3xl font-black text-slate-800">CalMeow</h1>
                <p className="text-slate-500 text-sm mt-1">Your Personal Calorie Companion</p>
            </motion.div>

            {/* Auth Card */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-orange-100"
            >
                {/* Toggle Tabs */}
                <div className="flex mb-6 bg-orange-50 rounded-2xl p-1">
                    <button
                        onClick={() => { setIsLogin(true); setError(null); }}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${isLogin
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        เข้าสู่ระบบ
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setError(null); }}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${!isLogin
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        สมัครสมาชิก
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            อีเมล
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-300 focus:outline-none transition-colors text-slate-800"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            รหัสผ่าน
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-300 focus:outline-none transition-colors text-slate-800"
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                ยืนยันรหัสผ่าน
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-orange-300 focus:outline-none transition-colors text-slate-800"
                            />
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {message && (
                        <div className="bg-green-50 text-green-600 text-sm p-3 rounded-xl border border-green-100">
                            ✅ {message}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl font-bold text-white transition-all transform active:scale-95 ${loading
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-200'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin">🔄</span> กำลังดำเนินการ...
                            </span>
                        ) : isLogin ? (
                            'เข้าสู่ระบบ'
                        ) : (
                            'สมัครสมาชิก'
                        )}
                    </button>
                </form>
            </motion.div>

            {/* Footer */}
            <p className="mt-6 text-xs text-slate-400">
                By continuing, you agree to our Terms of Service
            </p>
        </div>
    );
};

export default AuthPage;
