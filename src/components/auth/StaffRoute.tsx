import { Navigate, Outlet, useParams } from 'react-router-dom';

export const StaffRoute = () => {
    const { slug } = useParams<{ slug: string }>();
    const sessionKey = `staff_session_${slug}`;
    const isAuthenticated = sessionStorage.getItem(sessionKey);

    if (!isAuthenticated) {
        return <Navigate to={`/staff/${slug}/login`} replace />;
    }

    return <Outlet />;
};
