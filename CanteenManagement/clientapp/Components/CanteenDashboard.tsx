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
import UserDashboard from './UserDashboard';


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
    const role = sessionStorage.getItem('role');

    if (role !== '1') {
        return <UserDashboard />;
    }

    interface DashboardData {
        todayPunch: number;
        employeeStats: Record<string, number> | null;
    }

    interface RawPunchRow {
        empCode: string;
        empName: string;
        empType: string;
        dept: string;
        att_Date: string;
        punchTime: string;
        sft: string;
    }

    interface ModalState {
        open: boolean;
        title: string;
        loading: boolean;
        error: string | null;
        rows: RawPunchRow[];
    }

    const [dashboardData, setDashboardData] = useState<DashboardData>({
        todayPunch: 0,
        employeeStats: null,
    });

    const [modal, setModal] = useState<ModalState>({
        open: false,
        title: '',
        loading: false,
        error: null,
        rows: [],
    });

    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(100);

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

    const getTodayDate = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const fetchRawPunch = async (params: { fordate?: string; category?: string }, title: string) => {
        setSearchText('');
        setPage(0);
        setModal({ open: true, title, loading: true, error: null, rows: [] });

        try {
            const query = new URLSearchParams();
            if (params.fordate) query.append('fordate', params.fordate);
            if (params.category) query.append('category', params.category);

            const data = await apiFetch(`Canteen-Dashboard/get-employee-raw-punch?${query.toString()}`);
            const rows: RawPunchRow[] = data?.dataFetch?.table || [];
            setModal(prev => ({ ...prev, loading: false, rows }));
        } catch (err: any) {
            setModal(prev => ({ ...prev, loading: false, error: err?.message || 'Failed to load data.' }));
        }
    };

    const handleTodayPunchClick = () => {
        fetchRawPunch({ fordate: getTodayDate() }, 'Today Punch Details');
    };

    const handleContClick = () => {
        fetchRawPunch({ category: 'CONT', fordate: getTodayDate() }, 'CONT Details');
    };

    const handleNapsClick = () => {
        fetchRawPunch({ category: 'Naps', fordate: getTodayDate() }, 'NAPS Details');
    };

    const handleFotClick = () => {
        fetchRawPunch({ category: 'Fot', fordate: getTodayDate() }, 'FOT Details');
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, open: false }));
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '-';
        return timeStr.split('.')[0];
    };

    const filteredRows = modal.rows.filter(row => {
        const q = searchText.toLowerCase();
        return (
            row.empCode?.toLowerCase().includes(q) ||
            row.empName?.toLowerCase().includes(q) ||
            row.dept?.toLowerCase().includes(q) ||
            row.empType?.toLowerCase().includes(q) ||
            row.sft?.toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
    const pagedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
                Canteen Dashboard
            </Typography>

            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    mb: 4,
                    alignItems: 'flex-start',
                }}
            >
                <Card
                    onClick={handleTodayPunchClick}
                    sx={{
                        flex: '1 1 180px',
                        maxWidth: 220,
                        bgcolor: '#1976d2',
                        color: 'white',
                        borderRadius: 3,
                        cursor: 'pointer',
                        transition: 'transform 0.18s, box-shadow 0.18s',
                        '&:hover': {
                            transform: 'translateY(-4px) scale(1.03)',
                            boxShadow: '0 8px 24px rgba(25,118,210,0.35)',
                        },
                    }}
                >
                    <CardContent sx={{ textAlign: 'center', pb: 2 }}>
                        <Typography variant="subtitle2">Today Punch</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                            {dashboardData.todayPunch}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                            Click to view details
                        </Typography>
                    </CardContent>
                </Card>

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
                                    .filter(([key]) => !['total', 'toa', 'cont', 'naps', 'fot'].includes(key.toLowerCase()))
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

                <Card
                    onClick={handleContClick}
                    sx={{
                        flex: '1 1 180px',
                        maxWidth: 220,
                        bgcolor: '#388e3c',
                        color: 'white',
                        borderRadius: 3,
                        cursor: 'pointer',
                        transition: 'transform 0.18s, box-shadow 0.18s',
                        '&:hover': {
                            transform: 'translateY(-4px) scale(1.03)',
                            boxShadow: '0 8px 24px rgba(56,142,60,0.35)',
                        },
                    }}
                >
                    <CardContent sx={{ textAlign: 'center', pb: 2 }}>
                        <Typography variant="subtitle2">CONT</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                            {dashboardData.employeeStats?.cont ?? dashboardData.employeeStats?.CONT ?? dashboardData.employeeStats?.toa ?? 0}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                            Click to view details
                        </Typography>
                    </CardContent>
                </Card>

                <Card
                    onClick={handleNapsClick}
                    sx={{
                        flex: '1 1 180px',
                        maxWidth: 220,
                        bgcolor: '#0288d1',
                        color: 'white',
                        borderRadius: 3,
                        cursor: 'pointer',
                        transition: 'transform 0.18s, box-shadow 0.18s',
                        '&:hover': {
                            transform: 'translateY(-4px) scale(1.03)',
                            boxShadow: '0 8px 24px rgba(2,136,209,0.35)',
                        },
                    }}
                >
                    <CardContent sx={{ textAlign: 'center', pb: 2 }}>
                        <Typography variant="subtitle2">Naps</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                            {dashboardData.employeeStats?.naps ?? 0}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                            Click to view details
                        </Typography>
                    </CardContent>
                </Card>

                <Card
                    onClick={handleFotClick}
                    sx={{
                        flex: '1 1 180px',
                        maxWidth: 220,
                        bgcolor: '#f57f17',
                        color: 'white',
                        borderRadius: 3,
                        cursor: 'pointer',
                        transition: 'transform 0.18s, box-shadow 0.18s',
                        '&:hover': {
                            transform: 'translateY(-4px) scale(1.03)',
                            boxShadow: '0 8px 24px rgba(245,127,23,0.35)',
                        },
                    }}
                >
                    <CardContent sx={{ textAlign: 'center', pb: 2 }}>
                        <Typography variant="subtitle2">Fot</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                            {dashboardData.employeeStats?.fot ?? 0}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                            Click to view details
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {modal.open && (
                <Box
                    onClick={closeModal}
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        bgcolor: 'rgba(0,0,0,0.55)',
                        zIndex: 1300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                    }}
                >
                    <Box
                        onClick={e => e.stopPropagation()}
                        sx={{
                            bgcolor: '#fff',
                            borderRadius: 3,
                            width: '100%',
                            maxWidth: 900,
                            maxHeight: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                px: 3,
                                py: 2,
                                borderBottom: '1px solid #e0e0e0',
                                bgcolor: '#f8f9fa',
                            }}
                        >
                            <Box>
                                <Typography variant="h6" fontWeight={700} color="primary">
                                    {modal.title}
                                </Typography>
                                {!modal.loading && !modal.error && (
                                    <Typography variant="caption" color="text.secondary">
                                        {filteredRows.length} of {modal.rows.length} record{modal.rows.length !== 1 ? 's' : ''}
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {!modal.loading && !modal.error && modal.rows.length > 0 && (
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchText}
                                        onChange={e => { setSearchText(e.target.value); setPage(0); }}
                                        style={{
                                            border: '1px solid #d0d7de',
                                            borderRadius: 8,
                                            padding: '6px 12px',
                                            fontSize: 13,
                                            outline: 'none',
                                            width: 180,
                                        }}
                                    />
                                )}
                                <Box
                                    onClick={closeModal}
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        bgcolor: '#e0e0e0',
                                        fontWeight: 700,
                                        fontSize: 18,
                                        color: '#555',
                                        transition: 'background 0.15s',
                                        '&:hover': { bgcolor: '#bdbdbd' },
                                    }}
                                >
                                    ×
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ overflow: 'auto', flex: 1, p: 0 }}>
                            {modal.loading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8, flexDirection: 'column', gap: 2 }}>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            border: '4px solid #e3f2fd',
                                            borderTop: '4px solid #1976d2',
                                            borderRadius: '50%',
                                            animation: 'spin 0.9s linear infinite',
                                            '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } },
                                        }}
                                    />
                                    <Typography color="text.secondary" fontSize={14}>Loading data...</Typography>
                                </Box>
                            )}

                            {modal.error && (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <Typography color="error" fontWeight={600}>{modal.error}</Typography>
                                </Box>
                            )}

                            {!modal.loading && !modal.error && modal.rows.length === 0 && (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No records found.</Typography>
                                </Box>
                            )}

                            {!modal.loading && !modal.error && filteredRows.length > 0 && (
                                <TableContainer>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                {['#', 'Emp Code', 'Name', 'Type', 'Department', 'Date', 'Punch Time', 'Shift'].map(col => (
                                                    <TableCell
                                                        key={col}
                                                        sx={{
                                                            fontWeight: 700,
                                                            bgcolor: '#1976d2',
                                                            color: '#fff',
                                                            whiteSpace: 'nowrap',
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        {col}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pagedRows.map((row, idx) => {
                                                const globalIdx = page * rowsPerPage + idx;
                                                return (
                                                    <TableRow
                                                        key={`${row.empCode}-${globalIdx}`}
                                                        sx={{
                                                            bgcolor: globalIdx % 2 === 0 ? '#fff' : '#f5f8ff',
                                                            '&:hover': { bgcolor: '#e3f2fd' },
                                                        }}
                                                    >
                                                        <TableCell sx={{ fontSize: 12, color: '#888', minWidth: 36 }}>{globalIdx + 1}</TableCell>
                                                        <TableCell sx={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{row.empCode}</TableCell>
                                                        <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>{row.empName}</TableCell>
                                                        <TableCell sx={{ fontSize: 12 }}>
                                                            <Chip
                                                                label={row.empType}
                                                                size="small"
                                                                sx={{
                                                                    fontSize: 10,
                                                                    height: 20,
                                                                    bgcolor:
                                                                        row.empType === 'STAFF' ? '#e3f2fd' :
                                                                        row.empType === 'WORKER' ? '#e8f5e9' :
                                                                        row.empType === 'OFFICER' ? '#fff3e0' :
                                                                        row.empType === 'CONT' ? '#fce4ec' : '#f3e5f5',
                                                                    color:
                                                                        row.empType === 'STAFF' ? '#1565c0' :
                                                                        row.empType === 'WORKER' ? '#2e7d32' :
                                                                        row.empType === 'OFFICER' ? '#e65100' :
                                                                        row.empType === 'CONT' ? '#c62828' : '#6a1b9a',
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: 12 }}>{row.dept}</TableCell>
                                                        <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(row.att_Date)}</TableCell>
                                                        <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatTime(row.punchTime)}</TableCell>
                                                        <TableCell sx={{ fontSize: 12 }}>
                                                            <Chip
                                                                label={row.sft || '-'}
                                                                size="small"
                                                                sx={{
                                                                    fontSize: 10,
                                                                    height: 20,
                                                                    bgcolor: row.sft === 'A' ? '#e8f5e9' : row.sft === 'G' ? '#fff8e1' : '#f3e5f5',
                                                                    color: row.sft === 'A' ? '#2e7d32' : row.sft === 'G' ? '#f57f17' : '#6a1b9a',
                                                                }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>

                        {/* Pagination Footer */}
                        {!modal.loading && !modal.error && filteredRows.length > 0 && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    px: 3,
                                    py: 1.5,
                                    borderTop: '1px solid #e0e0e0',
                                    bgcolor: '#f8f9fa',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                }}
                            >
                                {/* Rows per page */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography fontSize={12} color="text.secondary">Rows per page:</Typography>
                                    {[50, 100, 200].map(n => (
                                        <Box
                                            key={n}
                                            onClick={() => { setRowsPerPage(n); setPage(0); }}
                                            sx={{
                                                px: 1.5,
                                                py: 0.4,
                                                borderRadius: 1,
                                                fontSize: 12,
                                                cursor: 'pointer',
                                                fontWeight: rowsPerPage === n ? 700 : 400,
                                                bgcolor: rowsPerPage === n ? '#1976d2' : '#e0e0e0',
                                                color: rowsPerPage === n ? '#fff' : '#333',
                                                transition: 'background 0.15s',
                                                '&:hover': { bgcolor: rowsPerPage === n ? '#1565c0' : '#bdbdbd' },
                                            }}
                                        >
                                            {n}
                                        </Box>
                                    ))}
                                </Box>

                                {/* Page info */}
                                <Typography fontSize={12} color="text.secondary">
                                    {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredRows.length)} of {filteredRows.length}
                                </Typography>

                                {/* Prev / Next */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        sx={{
                                            px: 2,
                                            py: 0.5,
                                            borderRadius: 1,
                                            fontSize: 12,
                                            cursor: page === 0 ? 'default' : 'pointer',
                                            bgcolor: page === 0 ? '#f0f0f0' : '#1976d2',
                                            color: page === 0 ? '#aaa' : '#fff',
                                            fontWeight: 600,
                                            transition: 'background 0.15s',
                                            '&:hover': { bgcolor: page === 0 ? '#f0f0f0' : '#1565c0' },
                                        }}
                                    >
                                        ← Prev
                                    </Box>
                                    <Typography fontSize={12} fontWeight={600}>
                                        Page {page + 1} / {totalPages}
                                    </Typography>
                                    <Box
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        sx={{
                                            px: 2,
                                            py: 0.5,
                                            borderRadius: 1,
                                            fontSize: 12,
                                            cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                                            bgcolor: page >= totalPages - 1 ? '#f0f0f0' : '#1976d2',
                                            color: page >= totalPages - 1 ? '#aaa' : '#fff',
                                            fontWeight: 600,
                                            transition: 'background 0.15s',
                                            '&:hover': { bgcolor: page >= totalPages - 1 ? '#f0f0f0' : '#1565c0' },
                                        }}
                                    >
                                        Next →
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 3,
                    }}
                >
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

                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 3,
                    }}
                >
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