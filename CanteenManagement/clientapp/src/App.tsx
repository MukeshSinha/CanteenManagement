import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import NavbarComponent from '../Components/Navbar/NavbarComponent';
import CanteenDashboard from '../Components/CanteenDashboard';
import ShiftWiseReport from '../Components/ShiftWiseReport';
import DateWiseReport from '../Components/DateWiseReport';
import ContractorCategory from '../Components/ContractorCategory';
import UploadMeal from '../Components/UploadMeal';
import ItemMaster from '../Components/ItemMaster';
import Login from '../Components/Login';
import Password from '../Components/Password';
import MonthlyReport from '../Components/MonthlyReport';
import EmployeeRawPunch from '../Components/EmployeeRawPunch';
import EmployeeContractorCategory from '../Components/EmployeeContractorCategory';
import ContractorWiseMealSummary from '../Components/ContractorWiseMealSummary';
import ContractorDeptWiseSummary from '../Components/ContractorDeptWiseSummary';
import ContractorCategoryDeptWiseSummary from '../Components/ContractorCategoryDeptWiseSummary';
import SummarySprlHead from '../Components/SummarySprlHead';
import MachineWisePunch from '../Components/MachineWisePunch';
import ContractorMealAmount from '../Components/ContractorMealAmount';
import UserDashboard from '../Components/UserDashboard';
import DatewiseTotalMeal from '../Components/DatewiseTotalMeal';

function LogoutAction() {
    sessionStorage.clear();
    return <Navigate to="/login" replace />;
}

function App() {
    const location = useLocation();

    // Check login state synchronously from sessionStorage on every render
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const isAuthPage = location.pathname === '/login' || location.pathname === '/password';
    const userRole = sessionStorage.getItem('userRole');

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
            <Toaster 
                position="top-right" 
                toastOptions={{
                    duration: 3500,
                    style: {
                        background: '#1e293b',
                        color: '#fff',
                        borderRadius: '12px',
                        fontSize: '14px',
                        padding: '12px 18px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            {/* Show Navigation only if NOT on login/password pages */}
            {!isAuthPage && <NavbarComponent />}

            <Routes>
                {/* Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/password" element={<Password />} />
                <Route path="/logout" element={<LogoutAction />} />

                {/* Protected Dashboard and Configuration Routes */}
                <Route path="/" element={
                    userRole === '1' ? <Navigate to="/canteen-dashboard" replace /> : <Navigate to="/user-dashboard" replace />
                } />
                <Route path="/canteen-dashboard" element={<CanteenDashboard />} />
                <Route path="/user-dashboard" element={<UserDashboard />} />
                <Route path="/masters/Item-Master" element={<ItemMaster />} />

                <Route path="reports">
                    <Route path="daily-meal">
                        <Route path="shift-wise" element={<ShiftWiseReport />} />
                        <Route path="date-wise" element={<DateWiseReport />} />
                        <Route path="contractor-category" element={<ContractorCategory />} />
                        <Route path="Upload-Meal" element={<UploadMeal />} />
                        <Route path="datewise-total-meal" element={<DatewiseTotalMeal />} />
                    </Route>

                    <Route path="summary">
                        <Route path="MonthlyMealSummary" element={<MonthlyReport />} />
                        <Route path="EmployeeRawPunch" element={<EmployeeRawPunch />} />
                        <Route path="EmployeeContractorCategory" element={<EmployeeContractorCategory />} />
                        <Route path="ContractorWiseMeal" element={<ContractorWiseMealSummary />} />
                        <Route path="ContractorDeptWise" element={<ContractorDeptWiseSummary />} />
                        <Route path="ContractorCategoryDeptWise" element={<ContractorCategoryDeptWiseSummary />} />
                        <Route path="SummarySprlHead" element={<SummarySprlHead />} />
                        <Route path="MachineWisePunch" element={<MachineWisePunch />} />
                        <Route path="ContractorMealAmount" element={<ContractorMealAmount />} />
                    </Route>
                </Route>

                {/* Wildcard fallback redirects to dashboard (which will route to /login if unauthenticated) */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default App;
