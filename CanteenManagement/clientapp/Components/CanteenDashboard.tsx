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
import {
    Restaurant as DinnerIcon,
    BreakfastDining as BreakfastIcon,
    LunchDining as LunchIcon,
    People as PeopleIcon,
    AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';

// Sample data (replace with real data / state / API later)
const stats = {
    employeesServed: 235,
    changeEmployees: -6,
    breakfasts: 80,
    changeBreakfast: 1,
    lunches: 120,
    changeLunch: 3,
    dinners: 35,
    changeDinner: 4,
    todayCollection: 5400,
};

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
                }}
            >
                {/* Employees Served */}
                <Card sx={{ flex: '1 1 180px', maxWidth: 220, bgcolor: '#1976d2', color: 'white', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center', pb: 2 }}>
                        <PeopleIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="subtitle2">Employees Served</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {stats.employeesServed}
                        </Typography>
                        <Chip
                            size="small"
                            label={`${stats.changeEmployees > 0 ? '+' : ''}${stats.changeEmployees}`}
                            color={stats.changeEmployees > 0 ? 'success' : 'error'}
                            sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.25)' }}
                        />
                    </CardContent>
                </Card>

                {/* Breakfasts */}
                <Card sx={{ flex: '1 1 180px', maxWidth: 220, bgcolor: '#f57c00', color: 'white', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <BreakfastIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="subtitle2">Breakdowns</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {stats.breakfasts}
                        </Typography>
                        <Chip
                            size="small"
                            label={`+${stats.changeBreakfast}`}
                            color="success"
                            sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.25)' }}
                        />
                    </CardContent>
                </Card>

                {/* Lunches */}
                <Card sx={{ flex: '1 1 180px', maxWidth: 220, bgcolor: '#388e3c', color: 'white', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <LunchIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="subtitle2">Lunches</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {stats.lunches}
                        </Typography>
                        <Chip
                            size="small"
                            label={`+${stats.changeLunch}`}
                            color="success"
                            sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.25)' }}
                        />
                    </CardContent>
                </Card>

                {/* Dinners */}
                <Card sx={{ flex: '1 1 180px', maxWidth: 220, bgcolor: '#0288d1', color: 'white', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <DinnerIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="subtitle2">Dinners</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {stats.dinners}
                        </Typography>
                        <Chip
                            size="small"
                            label={`+${stats.changeDinner}`}
                            color="success"
                            sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.25)' }}
                        />
                    </CardContent>
                </Card>

                {/* Today's Collection */}
                <Card sx={{ flex: '1 1 180px', maxWidth: 220, bgcolor: '#f57f17', color: 'white', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <MoneyIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="subtitle2">Today's Collection</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            ₹{stats.todayCollection.toLocaleString()}
                        </Typography>
                        <Chip
                            size="small"
                            label="+1%"
                            color="success"
                            sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.25)' }}
                        />
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