import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        const currentPath = location.pathname || '/';
        const currentSearch = location.search || '';
        const currentHash = location.hash || '';
        const fullTarget = `${currentPath}${currentSearch}${currentHash}`;
        const isDefaultEntry = currentPath === '/' || currentPath === '';

        if (!isDefaultEntry && !currentPath.startsWith('/login')) {
            sessionStorage.setItem('b2b_post_login_redirect', fullTarget);
            return (
                <Navigate
                    to={`/login?redirect=${encodeURIComponent(fullTarget)}`}
                    state={{ from: location }}
                    replace
                />
            );
        }

        // Redirect to login but keep current location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
