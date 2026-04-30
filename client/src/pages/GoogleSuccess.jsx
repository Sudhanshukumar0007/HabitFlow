import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, setAccessToken } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

export default function GoogleSuccess() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // Store in memory first so axiosInstance can use it
    setAccessToken(token);
    authApi.getMe().then((user) => {
      login(token, user);
      toast.success(`Welcome, ${user.username}! 🎉`);
      navigate('/');
    }).catch(() => {
      toast.error('Google login failed');
      navigate('/login');
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Signing you in...</p>
      </div>
    </div>
  );
}
