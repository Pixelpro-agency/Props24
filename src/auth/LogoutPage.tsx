import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function LogoutPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        logout();
        navigate('/dashboard', {
            replace: true,
        });
    }, [logout, navigate]);

    return null;
}
