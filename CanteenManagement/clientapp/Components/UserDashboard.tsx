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

const todaysActivity = [
    { id: '1021', name: 'Amit Kumar', dept: 'Production', meal: 'Lunch' },
    { id: '1045', name: 'Rakesh', dept: 'HR', meal: 'Breakfast' },
    { id: '1102', name: 'Sunil', dept: 'Maintenance', meal: 'Dinner' },
];

function UserDashboard() {
    interface DashboardData {
        todayPunch: number;
        employeeStats: Record<string, number> | null;
    }

    const [dashboardData, setDashboardData] = useState<DashboardData>({
        todayPunch: 0,
        employeeStats: null,
    });

    const username = sessionStorage.getItem('loginUser') || 'User';

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
        <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Greeting Box with Premium Gradient */}
            <Card
                sx={{
                    mb: 4,
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    color: 'white',
                    borderRadius: 4,
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.03)',
                    }}
                />
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.5px' }}>
                        Welcome back, {username}!
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.8, maxWidth: 600 }}>
                        Here is your canteen overview for today. View daily meals served, active meal schedules, and today's activity.
                    </Typography>
                </CardContent>
            </Card>

            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    mb: 4,
                }}
            >
                {/* Total Meals Card */}
                <Card
                    sx={{
                        flex: '1 1 200px',
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)' },
                    }}
                >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                            Today's Total Meals
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800, mt: 1.5, color: '#0f172a' }}>
                            {dashboardData.todayPunch}
                        </Typography>
                        <Chip label="Active Shift" color="success" size="small" sx={{ mt: 1.5, fontWeight: 600 }} />
                    </CardContent>
                </Card>

                {/* Operations Summary Card */}
                <Card
                    sx={{
                        flex: '1 1 240px',
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 2 }}>
                            Canteen Staff Statistics
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 550 }}>TOA Attendance</Typography>
                                <Chip label={dashboardData.employeeStats?.toa ?? 0} size="small" variant="outlined" />
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 550 }}>NAPS Apprentices</Typography>
                                <Chip label={dashboardData.employeeStats?.naps ?? 0} size="small" variant="outlined" />
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                }}
            >
                {/* Daily Meal Consumption Chart */}
                <Card sx={{ flex: '1 1 45%', minWidth: 320, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            Daily Meal Consumption
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ height: 320, width: '100%' }}>
                            <BarChart
                                height={300}
                                xAxis={[{ scaleType: 'band', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }]}
                                series={[{ data: [20, 45, 30, 25, 40, 65], label: 'Weekly Trend', color: '#0288d1' }]}
                            />
                        </Box>
                    </CardContent>
                </Card>

                {/* Today's Meal Activity */}
                <Card sx={{ flex: '1 1 45%', minWidth: 320, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            Today's Meal Activity
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>Employee ID</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Meal Type</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {todaysActivity.map((row) => (
                                        <TableRow key={row.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <TableCell>{row.id}</TableCell>
                                            <TableCell sx={{ fontWeight: 550 }}>{row.name}</TableCell>
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
                                                    sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                                />
                                            </TableCell>
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

export default UserDashboard;
