import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('http://localhost:3000/api/login', { password });
            if (res.data.success) {
                localStorage.setItem('auth_token', res.data.token);
                navigate('/admin');
            }
        } catch (err) {
            setError('Incorrect password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-6 selection:bg-[#cce4ff] font-sans">
            <div className="w-full max-w-[320px]">
                {/* Minimal Logo/Title */}
                <div className="mb-12 text-center">
                    <h1 className="text-[17px] font-bold tracking-tight text-[#111]">Dashboard Access</h1>
                </div>

                <div className="space-y-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-[#efefef] rounded-xl text-[14px] outline-none focus:border-[#000] transition-all placeholder:text-[#ccc]"
                                placeholder="Enter key"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <p className="text-[#e23d3d] text-[12px] font-bold text-center">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-[#111] hover:bg-[#000] text-white text-[13px] font-bold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest"
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : 'Sign in'}
                        </button>
                    </form>

                    <div className="text-center">
                        <a href="/" className="inline-flex items-center gap-2 text-[12px] font-bold text-[#aaa] hover:text-[#111] transition-colors uppercase tracking-widest">
                            <ArrowLeft size={12} strokeWidth={3} />
                            Back
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
