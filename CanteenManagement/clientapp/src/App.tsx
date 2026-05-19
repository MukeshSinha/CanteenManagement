import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavbarComponent from '../Components/Navbar/NavbarComponent';
import CanteenDashboard from '../Components/CanteenDashboard';
import ShiftWiseReport from '../Components/ShiftWiseReport';
import DateWiseReport from '../Components/DateWiseReport';
import ContractorCategory from '../Components/ContractorCategory';
import UploadMeal from '../Components/UploadMeal';
import ItemMaster from '../Components/ItemMaster';
import Login from '../Components/Login';
import Password from '../Components/Password';

function LogoutAction() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('loginUser');
    return <Navigate to="/login" replace />;
}

function App() {
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem('isLoggedIn') === 'true');

    useEffect(() => {
        // Keep login state synchronized with sessionStorage on route change
        setIsLoggedIn(sessionStorage.getItem('isLoggedIn') === 'true');
    }, [location]);

    const isAuthPage = location.pathname === '/login' || location.pathname === '/password';

    // If not logged in and not on an auth page, redirect to /login
    if (!isLoggedIn && !isAuthPage) {
        return <Navigate to="/login" replace />;
    }

    // If logged in and trying to access an auth page, redirect to root dashboard
    if (isLoggedIn && isAuthPage) {
        return <Navigate to="/" replace />;
    }

    return (
        <>
            {/* Show Navigation only if NOT on login/password pages */}
            {!isAuthPage && <NavbarComponent />}
            
            <Routes>
                {/* Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/password" element={<Password />} />
                <Route path="/logout" element={<LogoutAction />} />

                {/* Protected Dashboard and Configuration Routes */}
                <Route path="/" element={<CanteenDashboard />} />
                <Route path="/masters/Item-Master" element={<ItemMaster />} />
                
                <Route path="reports">
                    <Route path="daily-meal">
                        <Route path="shift-wise" element={<ShiftWiseReport />} />
                        <Route path="date-wise" element={<DateWiseReport />} />
                        <Route path="contractor-category" element={<ContractorCategory />} />
                        <Route path="Upload-Meal" element={<UploadMeal />} />
                    </Route>
                </Route>

                {/* Wildcard fallback redirects to dashboard (which will route to /login if unauthenticated) */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default App;

