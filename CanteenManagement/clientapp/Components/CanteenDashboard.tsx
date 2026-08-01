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
    Button,
    TablePagination,
} from '@mui/material';
import {
    Download as DownloadIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

const COUPON_CONFIGS = [
    {
        key: 'tea',
        label: 'Tea Coupon',
        endpoint: 'Canteen-Punch/get-TeaCoupon',
        gradient: 'linear-gradient(135deg, #8d6e63 0%, #4e342e 100%)',
        hoverShadow: 'rgba(78,52,46,0.35)',
    },
    {
        key: 'fs',
        label: 'Snacks Coupon (FS)',
        endpoint: 'Canteen-Punch/get-snacksCoupon',
        gradient: 'linear-gradient(135deg, #26a69a 0%, #00695c 100%)',
        hoverShadow: 'rgba(0,105,92,0.35)',
    },
    {
        key: 'bs',
        label: 'Beverage & Snacks Coupon',
        endpoint: 'Canteen-Punch/get-BsCoupon',
        gradient: 'linear-gradient(135deg, #7e57c2 0%, #4527a0 100%)',
        hoverShadow: 'rgba(69,39,160,0.35)',
    },
];

const FALLBACK_GRADIENTS = [
    { gradient: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)', shadow: 'rgba(13,71,161,0.35)' }, // Blue
    { gradient: 'linear-gradient(135deg, #388e3c 0%, #1b5e20 100%)', shadow: 'rgba(27,94,32,0.35)' },  // Green
    { gradient: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)', shadow: 'rgba(230,81,0,0.35)' },  // Orange
    { gradient: 'linear-gradient(135deg, #ab47bc 0%, #6a1b9a 100%)', shadow: 'rgba(106,27,154,0.35)' }, // Purple
    { gradient: 'linear-gradient(135deg, #26c6da 0%, #00838f 100%)', shadow: 'rgba(0,131,143,0.35)' },  // Cyan
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

    type CouponData = Record<string, number>;

    interface ModalState {
        open: boolean;
        title: string;
        loading: boolean;
        error: string | null;
        rows: any[];
    }

    const [dashboardData, setDashboardData] = useState<DashboardData>({
        todayPunch: 0,
        employeeStats: null,
    });

    const [couponData, setCouponData] = useState<CouponData>({
        tea: 0,
        fs: 0,
        bs: 0,
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

        const fetchCouponData = async () => {
            try {
                const response = await apiFetch("Canteen-Punch/get-Coupon");
                let parsedData = response;
                if (typeof parsedData === "string") {
                    parsedData = JSON.parse(parsedData);
                }
                const table = parsedData?.dataFetch?.table;
                if (table && table.length > 0) {
                    const firstRow = table[0];
                    const mapped: Record<string, number> = {};
                    Object.entries(firstRow).forEach(([key, val]) => {
                        mapped[key.toLowerCase()] = typeof val === 'number' ? val : (Number(val) || 0);
                    });
                    setCouponData(mapped);
                }
            } catch (err) {
                console.warn("Failed fetching coupon data", err);
            }
        };

        fetchDashboardData();
        fetchCouponData();
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
            const rawRows: any[] = data?.dataFetch?.table || [];
            
            const rows = rawRows.map((row: any) => {
                const normalized: any = {};
                Object.keys(row).forEach(key => {
                    normalized[key.toLowerCase()] = row[key];
                });
                return normalized;
            });

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

    const fetchCouponDetails = async (endpoint: string, title: string) => {
        setSearchText('');
        setPage(0);
        setModal({ open: true, title, loading: true, error: null, rows: [] });

        try {
            let data = await apiFetch(endpoint);
            if (typeof data === "string") {
                data = JSON.parse(data);
            }
            const rawRows: any[] = data?.dataFetch?.table || [];
            
            const rows = rawRows.map((row: any) => {
                const normalized: any = {};
                Object.keys(row).forEach(key => {
                    normalized[key.toLowerCase()] = row[key];
                });
                return normalized;
            });

            setModal(prev => ({ ...prev, loading: false, rows }));
        } catch (err: any) {
            setModal(prev => ({ ...prev, loading: false, error: err?.message || 'Failed to load data.' }));
        }
    };

    const handleCouponClick = (endpoint: string, label: string) => {
        fetchCouponDetails(endpoint, `Today's ${label} Details`);
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, open: false }));
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        if (dateStr.includes('T')) {
            const parts = dateStr.split('T');
            const dateParts = parts[0].split('-');
            if (dateParts.length === 3) {
                const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                const timeParts = parts[1].split(':');
                if (timeParts.length >= 2 && parts[1] !== '00:00:00') {
                    return `${formattedDate} ${timeParts[0]}:${timeParts[1]}`;
                }
                return formattedDate;
            }
        }
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '-';
        return timeStr.split('.')[0];
    };

    const isCouponData = modal.rows.length > 0 && (
        'tea' in modal.rows[0] || 
        'snk' in modal.rows[0] || 
        'bs' in modal.rows[0]
    );

    const filteredRows = modal.rows.filter((row: any) => {
        const q = searchText.trim().toLowerCase();
        if (!q) return true;
        if (isCouponData) {
            return (
                (row.empcode && String(row.empcode).toLowerCase().includes(q)) ||
                (row.tea !== undefined && String(row.tea).toLowerCase().includes(q)) ||
                (row.snk !== undefined && String(row.snk).toLowerCase().includes(q)) ||
                (row.bs !== undefined && String(row.bs).toLowerCase().includes(q)) ||
                (row.logdt && String(row.logdt).toLowerCase().includes(q)) ||
                (row.entrydt && String(row.entrydt).toLowerCase().includes(q))
            );
        } else {
            return (
                (row.empcode && String(row.empcode).toLowerCase().includes(q)) ||
                (row.empname && String(row.empname).toLowerCase().includes(q)) ||
                (row.dept && String(row.dept).toLowerCase().includes(q)) ||
                (row.emptype && String(row.emptype).toLowerCase().includes(q)) ||
                (row.sft && String(row.sft).toLowerCase().includes(q)) ||
                (row.punchtime && String(row.punchtime).toLowerCase().includes(q))
            );
        }
    });

    const exportToCSV = () => {
        if (!filteredRows || filteredRows.length === 0) return;
        let headers: string[];
        let exportData: any[];

        if (isCouponData) {
            headers = ["Sr.No", "Employee Code", "Tea", "Snacks", "Beverage & Snacks", "Log Date", "Entry Date"];
            exportData = filteredRows.map((row: any, idx) => [
                idx + 1,
                `"${String(row.empcode || '').replace(/"/g, '""')}"`,
                row.tea !== undefined ? row.tea : 0,
                row.snk !== undefined ? row.snk : 0,
                row.bs !== undefined ? row.bs : 0,
                `"${String(formatDate(row.logdt) || '').replace(/"/g, '""')}"`,
                `"${String(formatDate(row.entrydt) || '').replace(/"/g, '""')}"`
            ]);
        } else {
            headers = ["Sr.No", "Emp Code", "Name", "Type", "Department", "Date", "Punch Time", "Shift"];
            exportData = filteredRows.map((row, idx) => [
                idx + 1,
                `"${String(row.empcode || '').replace(/"/g, '""')}"`,
                `"${String(row.empname || '').replace(/"/g, '""')}"`,
                `"${String(row.emptype || '').replace(/"/g, '""')}"`,
                `"${String(row.dept || '').replace(/"/g, '""')}"`,
                `"${String(formatDate(row.att_date) || '').replace(/"/g, '""')}"`,
                `"${String(formatTime(row.punchtime) || '').replace(/"/g, '""')}"`,
                `"${String(row.sft || '').replace(/"/g, '""')}"`
            ]);
        }

        const csvContent = [headers.join(","), ...exportData.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const cleanTitle = (modal.title || 'Punch_Details').replace(/[^a-zA-Z0-9]/g, '_');
        saveAs(blob, `${cleanTitle}.csv`);
    };

    const exportToExcel = () => {
        if (!filteredRows || filteredRows.length === 0) return;
        let dataRows: any[];

        if (isCouponData) {
            dataRows = filteredRows.map((row: any, idx) => ({
                "Sr.No": idx + 1,
                "Employee Code": row.empcode || '',
                "Tea": row.tea !== undefined ? row.tea : 0,
                "Snacks": row.snk !== undefined ? row.snk : 0,
                "Beverage & Snacks": row.bs !== undefined ? row.bs : 0,
                "Log Date": formatDate(row.logdt),
                "Entry Date": formatDate(row.entrydt)
            }));
        } else {
            dataRows = filteredRows.map((row, idx) => ({
                "Sr.No": idx + 1,
                "Emp Code": row.empcode || '',
                "Name": row.empname || '',
                "Type": row.emptype || '',
                "Department": row.dept || '',
                "Date": formatDate(row.att_date) || '',
                "Punch Time": formatTime(row.punchtime) || '',
                "Shift": row.sft || ''
            }));
        }

        const ws = XLSX.utils.json_to_sheet(dataRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Details");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const cleanTitle = (modal.title || 'Punch_Details').replace(/[^a-zA-Z0-9]/g, '_');
        saveAs(blob, `${cleanTitle}.xlsx`);
    };

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const pagedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const couponsToRender = Object.keys(couponData)
        .filter(key => {
            const lowerKey = key.toLowerCase();
            return !['id', 'date', 'fordate', 'punchdate', 'createdat', 'updatedat', 'row', 'srno', 'status', 'empcode', 'name'].includes(lowerKey);
        })
        .map((key, index) => {
            const lowerKey = key.toLowerCase();
            const config = COUPON_CONFIGS.find(c => c.key.toLowerCase() === lowerKey);
            if (config) {
                return {
                    ...config,
                    value: couponData[key],
                };
            }
            const fallbackColor = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
            const dynamicEndpoint = `Canteen-Punch/get-${key.charAt(0).toUpperCase() + key.slice(1)}Coupon`;
            const dynamicLabel = `${key.charAt(0).toUpperCase() + key.slice(1)} Coupon`;
            return {
                key: lowerKey,
                label: dynamicLabel,
                endpoint: dynamicEndpoint,
                gradient: fallbackColor.gradient,
                hoverShadow: fallbackColor.shadow,
                value: couponData[key],
            };
        });

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
                        <Typography variant="subtitle2">Today Punches</Typography>
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

            {/* TODAY'S COUPONS SECTION */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 600, color: '#333' }}>
                Today's Coupon
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
                {couponsToRender.map((coupon) => (
                    <Card
                        key={coupon.key}
                        onClick={() => handleCouponClick(coupon.endpoint, coupon.label)}
                        sx={{
                            flex: '1 1 180px',
                            maxWidth: 220,
                            background: coupon.gradient,
                            color: 'white',
                            borderRadius: 3,
                            cursor: 'pointer',
                            transition: 'transform 0.18s, box-shadow 0.18s',
                            '&:hover': {
                                transform: 'translateY(-4px) scale(1.03)',
                                boxShadow: `0 8px 24px ${coupon.hoverShadow}`,
                            },
                        }}
                    >
                        <CardContent sx={{ textAlign: 'center', pb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                                {coupon.label}
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                                {coupon.value}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                                Click to view details
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
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
                            maxWidth: 950,
                            maxHeight: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        {/* Absolutely Positioned Close Button */}
                        <Box
                            onClick={closeModal}
                            sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
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
                                zIndex: 10,
                            }}
                        >
                            ×
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                px: 3,
                                py: 2.5,
                                borderBottom: '1px solid #e0e0e0',
                                bgcolor: '#f8f9fa',
                                pr: 8, // Reserve space for the close button
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
                        </Box>

                        <Box sx={{ overflow: 'auto', flex: 1, p: 3 }}>
                            {!modal.loading && !modal.error && modal.rows.length > 0 && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mb: 3,
                                        flexWrap: 'wrap',
                                        gap: 1.5,
                                    }}
                                >
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
                                            width: 220,
                                        }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="small"
                                            startIcon={<DownloadIcon />}
                                            onClick={exportToExcel}
                                            disabled={filteredRows.length === 0}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                fontSize: 12,
                                                borderRadius: 1.5,
                                                boxShadow: '0 2px 6px rgba(46,125,50,0.2)',
                                            }}
                                        >
                                            Export Excel
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            size="small"
                                            startIcon={<DownloadIcon />}
                                            onClick={exportToCSV}
                                            disabled={filteredRows.length === 0}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                fontSize: 12,
                                                borderRadius: 1.5,
                                            }}
                                        >
                                            Export CSV
                                        </Button>
                                    </Box>
                                </Box>
                            )}
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
                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0, border: 'none' }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                {(isCouponData 
                                                    ? ['Sr.No', 'Employee Code', 'Tea', 'Snacks', 'Beverage & Snacks', 'Log Date', 'Entry Date']
                                                    : ['Sr.No', 'Emp Code', 'Name', 'Type', 'Department', 'Date', 'Punch Time', 'Shift']
                                                ).map(col => (
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
                                            {pagedRows.map((row: any, idx) => {
                                                const globalIdx = page * rowsPerPage + idx;
                                                return (
                                                    <TableRow
                                                        key={`${row.empcode}-${globalIdx}`}
                                                        sx={{
                                                            bgcolor: globalIdx % 2 === 0 ? '#fff' : '#f5f8ff',
                                                            '&:hover': { bgcolor: '#e3f2fd' },
                                                        }}
                                                    >
                                                        <TableCell sx={{ fontSize: 12, color: '#888', minWidth: 36 }}>{globalIdx + 1}</TableCell>
                                                        {isCouponData ? (
                                                            <>
                                                                <TableCell sx={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{row.empcode || '—'}</TableCell>
                                                                <TableCell sx={{ fontSize: 12 }}>{row.tea !== undefined ? row.tea : 0}</TableCell>
                                                                <TableCell sx={{ fontSize: 12 }}>{row.snk !== undefined ? row.snk : 0}</TableCell>
                                                                <TableCell sx={{ fontSize: 12 }}>{row.bs !== undefined ? row.bs : 0}</TableCell>
                                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatDate(row.logdt)}</TableCell>
                                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatDate(row.entrydt)}</TableCell>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <TableCell sx={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{row.empcode || '—'}</TableCell>
                                                                <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>{row.empname || '—'}</TableCell>
                                                                <TableCell sx={{ fontSize: 12 }}>
                                                                    <Chip
                                                                        label={row.emptype || '—'}
                                                                        size="small"
                                                                        sx={{
                                                                            fontSize: 10,
                                                                            height: 20,
                                                                            bgcolor:
                                                                                row.emptype === 'STAFF' ? '#e3f2fd' :
                                                                                    row.emptype === 'WORKER' ? '#e8f5e9' :
                                                                                        row.emptype === 'OFFICER' ? '#fff3e0' :
                                                                                            row.emptype === 'CONT' ? '#fce4ec' : '#f3e5f5',
                                                                            color:
                                                                                row.emptype === 'STAFF' ? '#1565c0' :
                                                                                    row.emptype === 'WORKER' ? '#2e7d32' :
                                                                                        row.emptype === 'OFFICER' ? '#e65100' :
                                                                                            row.emptype === 'CONT' ? '#c62828' : '#6a1b9a',
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell sx={{ fontSize: 12 }}>{row.dept || '—'}</TableCell>
                                                                <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(row.att_date)}</TableCell>
                                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatTime(row.punchtime)}</TableCell>
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
                                                            </>
                                                        )}
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
                            <TablePagination
                                rowsPerPageOptions={[50, 100, 200]}
                                component="div"
                                count={filteredRows.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
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