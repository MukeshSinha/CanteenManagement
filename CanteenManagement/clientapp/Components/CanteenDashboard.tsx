import { useState, useEffect } from 'react';
import { apiFetch } from '../src/utils/api';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
} from '@mui/material';

import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';


const weeklyTrendData = {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    values: [20, 45, 30, 25, 40, 65],
};

const todaysActivity = [
    { id: '1021', name: 'Amit Kumar', dept: 'Production', meal: 'Lunch' },
    { id: '1045', name: 'Rakesh', dept: 'HR', meal: 'Breakfast' },
    { id: '1102', name: 'Sunil', dept: 'Maintenance', meal: 'Dinner' },
];

const lowStock = [
    { item: 'Rice', avail: '10 kg', min: '20 kg', time: '13:05' },
    { item: 'Milk', avail: '5 L', min: '10 L', time: '10:15' },
    { item: 'Bread', avail: '15', min: '30', time: '20:10' },
];

const monthlySummary = [
    { month: 'January', meals: 5400, cost: '₹1,20,000' },
    // add more as needed
];

function CanteenDashboard() {
    interface DashboardData {
        todayPunch: number;
        employeeStats: Record<string, number> | null;
    }

    const [dashboardData, setDashboardData] = useState<DashboardData>({
        todayPunch: 0,
        employeeStats: null,
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await apiFetch('Canteen-Dashboard/get-admin-dashboard');
                let data = response;
                if (typeof data === 'string') {
                    data = JSON.parse(data);
                }
                
                const table = data?.dataFetch?.table || [];
                const table1 = data?.dataFetch?.table1 || [];
                
                const todayPunch = table[0]?.todayPunch || 0;
                const employeeStats = table1[0] || null;
                
                setDashboardData({
                    todayPunch,
                    employeeStats,
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };
        fetchDashboardData();
    }, []);

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
                Canteen Dashboard
            </Typography>

            {/* Top stats cards - responsive flex wrap */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    mb: 4,
                    alignItems: 'flex-start',
                }}
            >
                {/* Today Punch */}
                <Card sx={{ flex: '1 1 180px', maxWidth: 220, bgcolor: '#1976d2', color: 'white', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center', pb: 2 }}>
                        <Typography variant="subtitle2">Today Punch</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                            {dashboardData.todayPunch}
                        </Typography>
                    </CardContent>
                </Card>

                {/* Employee Card with dynamic sub-data list */}
                <Card sx={{ flex: '1 1 200px', maxWidth: 240, bgcolor: '#f57c00', color: 'white', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1.5 }}>Employee</Typography>
                        
                        {dashboardData.employeeStats && (
                            <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(2, 1fr)', 
                                gap: 0.5, 
                                borderTop: '1px solid rgba(255,255,255,0.2)', 
                                pt: 1.5,
                                fontSize: '0.72rem',
                                textAlign: 'left',
                                px: 1
                            }}>
                                {Object.entries(dashboardData.employeeStats)
                                    .filter(([key]) => !['total', 'toa', 'naps', 'fot'].includes(key.toLowerCase()))
                                    .map(([key, val]) => {
                                        const label = key.toLowerCase() === 'worker' ? 'Workers' : key.charAt(0).toUpperCase() + key.slice(1);
                                        return (
                                            <div key={key}>
                                                {label}: {Number(val) || 0}
                                            </div>
                                        );
                                    })
                                }
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Toa */}
                <Card sx={{ flex: '1 1 180px', maxWidth: 220, bgcolor: '#388e3c', color: 'white', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center', pb: 2 }}>
                        <Typography variant="subtitle2">Toa</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                            {dashboardData.employeeStats?.toa ?? 0}
                        </Typography>
                    </CardContent>
                </Card>

                {/* Naps */}
                <Card sx={{ flex: '1 1 180px', maxWidth: 220, bgcolor: '#0288d1', color: 'white', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center', pb: 2 }}>
                        <Typography variant="subtitle2">Naps</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                            {dashboardData.employeeStats?.naps ?? 0}
                        </Typography>
                    </CardContent>
                </Card>

                {/* Fot */}
                <Card sx={{ flex: '1 1 180px', maxWidth: 220, bgcolor: '#f57f17', color: 'white', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center', pb: 2 }}>
                        <Typography variant="subtitle2">Fot</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                            {dashboardData.employeeStats?.fot ?? 0}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Charts + Tables section */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Charts row */}
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 3,
                    }}
                >
                    {/* Daily Meal Consumption */}
                    <Card sx={{ flex: '1 1 45%', minWidth: 320, borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Daily Meal Consumption
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ height: 320, width: '100%' }}>
                                <BarChart
                                    xAxis={[{ scaleType: 'band', data: ['Breakfast', 'Lunch', 'Dinner'] }]}
                                    series={[
                                        { data: [65, 55, 20], label: 'Mon', color: '#f57c00' },
                                        { data: [85, 65, 25], label: 'Tue', color: '#388e3c' },
                                        { data: [55, 80, 30], label: 'Wed', color: '#0288d1' },
                                    ]}
                                    height={300}
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Weekly Meal Trend */}
                    <Card sx={{ flex: '1 1 45%', minWidth: 320, borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Weekly Meal Trend
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ height: 320, width: '100%' }}>
                                <LineChart
                                    xAxis={[{ scaleType: 'point', data: weeklyTrendData.days }]}
                                    series={[{ data: weeklyTrendData.values, color: '#1976d2' }]}
                                    height={300}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Tables row */}
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 3,
                    }}
                >
                    {/* Today's Meal Activity */}
                    <Card sx={{ flex: '1 1 45%', minWidth: 320, borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Today's Meal Activity
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f0f4f8' }}>
                                            <TableCell>Employee ID</TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Department</TableCell>
                                            <TableCell>Meal Type</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {todaysActivity.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell>{row.id}</TableCell>
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell>{row.dept}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={row.meal}
                                                        size="small"
                                                        color={
                                                            row.meal === 'Breakfast'
                                                                ? 'warning'
                                                                : row.meal === 'Lunch'
                                                                    ? 'success'
                                                                    : 'primary'
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    {/* Low Stock Alert */}
                    <Card sx={{ flex: '1 1 45%', minWidth: 320, borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom color="error">
                                Low Stock Alert
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#ffebee' }}>
                                            <TableCell>Item</TableCell>
                                            <TableCell>Available Qty</TableCell>
                                            <TableCell>Minimum Qty</TableCell>
                                            <TableCell>Time</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {lowStock.map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{row.item}</TableCell>
                                                <TableCell sx={{ color: 'error.main' }}>{row.avail}</TableCell>
                                                <TableCell>{row.min}</TableCell>
                                                <TableCell>{row.time}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Box>

                {/* Monthly Summary - full width */}
                <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Monthly Summary
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                                        <TableCell>Month</TableCell>
                                        <TableCell>Total Meals</TableCell>
                                        <TableCell>Total Cost</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {monthlySummary.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{row.month}</TableCell>
                                            <TableCell>{row.meals.toLocaleString()}</TableCell>
                                            <TableCell>{row.cost}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
export default CanteenDashboard;