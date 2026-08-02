import { useState, useEffect } from "react";
import { apiFetch } from "../src/utils/api";
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Divider,
    Fade,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    TablePagination,
} from "@mui/material";
import {
    Download as DownloadIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Row, Col } from "react-bootstrap";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";

interface UserDashboardData {
    lunch: number;
    dinner: number;
}

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


type CouponData = Record<string, number>;


interface MealModalState {
    open: boolean;
    title: string;
    loading: boolean;
    error: string | null;
    rows: any[];
}

interface CouponModalState {
    open: boolean;
    title: string;
    loading: boolean;
    error: string | null;
    rows: any[];
}

export default function UserDashboard() {
    const [loading, setLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const [data, setData] = useState<UserDashboardData>({
        lunch: 0,
        dinner: 0,
    });

    const [couponData, setCouponData] = useState<CouponData>({
        tea: 0,
        fs: 0,
        bs: 0,
    });

    const [mealModal, setMealModal] = useState<MealModalState>({
        open: false,
        title: '',
        loading: false,
        error: null,
        rows: [],
    });

    const [couponModal, setCouponModal] = useState<CouponModalState>({
        open: false,
        title: '',
        loading: false,
        error: null,
        rows: [],
    });

    const [mealSearchText, setMealSearchText] = useState('');
    const [mealPage, setMealPage] = useState(0);
    const [mealRowsPerPage, setMealRowsPerPage] = useState(100);

    const [couponSearchText, setCouponSearchText] = useState('');
    const [couponPage, setCouponPage] = useState(0);
    const [couponRowsPerPage, setCouponRowsPerPage] = useState(100);

    const username = sessionStorage.getItem("loginUser") || "canteen_user";
    const formattedUsername = username
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await apiFetch("Canteen-Dashboard/get-user-dashboard");
                let parsedData = response;
                if (typeof parsedData === "string") {
                    parsedData = JSON.parse(parsedData);
                }

                const table = parsedData?.dataFetch?.table;
                if (table && table.length > 0) {
                    const firstRow = table[0];
                    setData({
                        lunch: typeof firstRow.lunch === "number" ? firstRow.lunch : 923.0,
                        dinner: typeof firstRow.dinner === "number" ? firstRow.dinner : 649.0,
                    });
                }
                setError(null);
            } catch (err: any) {
                console.warn("Failed fetching from api. Using fallback/dummy data.", err);
                setData({
                    lunch: 923.0,
                    dinner: 649.0,
                });
            } finally {
                setLoading(false);
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

    const fetchMealDetails = async (endpoint: string, title: string) => {
        setMealSearchText('');
        setMealPage(0);
        setMealModal({ open: true, title, loading: true, error: null, rows: [] });

        try {
            let data = await apiFetch(endpoint);
            if (typeof data === "string") {
                data = JSON.parse(data);
            }
            const rawRows: any[] = data?.dataFetch?.table || [];

            // Normalize keys to lowercase to prevent casing mismatches
            const rows = rawRows.map((row: any) => {
                const normalized: any = {};
                Object.keys(row).forEach(key => {
                    normalized[key.toLowerCase()] = row[key];
                });
                return normalized;
            });

            setMealModal(prev => ({ ...prev, loading: false, rows }));
        } catch (err: any) {
            setMealModal(prev => ({ ...prev, loading: false, error: err?.message || 'Failed to load data.' }));
        }
    };

    const fetchCouponDetails = async (endpoint: string, title: string) => {
        setCouponSearchText('');
        setCouponPage(0);
        setCouponModal({ open: true, title, loading: true, error: null, rows: [] });

        try {
            let data = await apiFetch(endpoint);
            if (typeof data === "string") {
                data = JSON.parse(data);
            }
            const rawRows: any[] = data?.dataFetch?.table || [];

            // Normalize keys to lowercase to prevent casing mismatches
            const rows = rawRows.map((row: any) => {
                const normalized: any = {};
                Object.keys(row).forEach(key => {
                    normalized[key.toLowerCase()] = row[key];
                });
                return normalized;
            });

            setCouponModal(prev => ({ ...prev, loading: false, rows }));
        } catch (err: any) {
            setCouponModal(prev => ({ ...prev, loading: false, error: err?.message || 'Failed to load data.' }));
        }
    };

    const handleLunchClick = () => {
        fetchMealDetails('Canteen-Punch/get-todayLunch', "Today's Lunch Punch Details");
    };

    const handleDinnerClick = () => {
        fetchMealDetails('Canteen-Punch/get-todayDinner', "Today's Dinner Punch Details");
    };

    const handleCouponClick = (endpoint: string, label: string) => {
        fetchCouponDetails(endpoint, `Today's ${label} Details`);
    };

    const closeMealModal = () => {
        setMealModal(prev => ({ ...prev, open: false }));
    };

    const closeCouponModal = () => {
        setCouponModal(prev => ({ ...prev, open: false }));
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '-';
        return timeStr.split('.')[0];
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
        return dateStr;
    };

    const filteredMealRows = mealModal.rows.filter((row: any) => {
        const q = mealSearchText.trim().toLowerCase();
        if (!q) return true;
        return (
            (row.empcode && String(row.empcode).toLowerCase().includes(q)) ||
            (row.name && String(row.name).toLowerCase().includes(q)) ||
            (row.emptype && String(row.emptype).toLowerCase().includes(q)) ||
            (row.ezone && String(row.ezone).toLowerCase().includes(q)) ||
            (row.punchtime && String(row.punchtime).toLowerCase().includes(q)) ||
            (row.prevpunchtime && String(row.prevpunchtime).toLowerCase().includes(q))
        );
    });

    const filteredCouponRows = couponModal.rows.filter((row: any) => {
        const q = couponSearchText.trim().toLowerCase();
        if (!q) return true;
        return (
            (row.empcode && String(row.empcode).toLowerCase().includes(q)) ||
            (row.logdt && String(row.logdt).toLowerCase().includes(q)) ||
            (row.entrydt && String(row.entrydt).toLowerCase().includes(q)) ||
            (row.tea !== undefined && String(row.tea).toLowerCase().includes(q)) ||
            (row.snk !== undefined && String(row.snk).toLowerCase().includes(q)) ||
            (row.bs !== undefined && String(row.bs).toLowerCase().includes(q))
        );
    });

    const exportMealToCSV = () => {
        if (!filteredMealRows || filteredMealRows.length === 0) return;
        const headers = ["Sr.No", "Employee Code", "Employee Name", "Employee Type", "Zone", "Punch Time", "Prev Punch Time"];
        const exportData = filteredMealRows.map((row, idx) => [
            idx + 1,
            `"${String(row.empcode || '').replace(/"/g, '""')}"`,
            `"${String(row.name || '').replace(/"/g, '""')}"`,
            `"${String(row.emptype || '').replace(/"/g, '""')}"`,
            `"${String(row.ezone || '').replace(/"/g, '""')}"`,
            `"${String(formatTime(row.punchtime) || '').replace(/"/g, '""')}"`,
            `"${String(formatTime(row.prevpunchtime) || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers.join(","), ...exportData.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const cleanTitle = (mealModal.title || 'Punch_Details').replace(/[^a-zA-Z0-9]/g, '_');
        saveAs(blob, `${cleanTitle}.csv`);
    };

    const exportCouponToCSV = () => {
        if (!filteredCouponRows || filteredCouponRows.length === 0) return;
        const headers = ["Sr.No", "Employee Code", "Tea", "Snacks", "Beverage & Snacks", "Log Date", "Entry Date"];
        const exportData = filteredCouponRows.map((row: any, idx) => [
            idx + 1,
            `"${String(row.empcode || '').replace(/"/g, '""')}"`,
            row.tea !== undefined ? row.tea : 0,
            row.snk !== undefined ? row.snk : 0,
            row.bs !== undefined ? row.bs : 0,
            `"${String(formatDate(row.logdt) || '').replace(/"/g, '""')}"`,
            `"${String(formatDate(row.entrydt) || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers.join(","), ...exportData.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const cleanTitle = (couponModal.title || 'Coupon_Details').replace(/[^a-zA-Z0-9]/g, '_');
        saveAs(blob, `${cleanTitle}.csv`);
    };

    const exportMealToExcel = () => {
        if (!filteredMealRows || filteredMealRows.length === 0) return;
        const dataRows = filteredMealRows.map((row, idx) => ({
            "Sr.No": idx + 1,
            "Employee Code": row.empcode || '',
            "Employee Name": row.name || '',
            "Employee Type": row.emptype || '',
            "Zone": row.ezone || '',
            "Punch Time": formatTime(row.punchtime) || '',
            "Prev Punch Time": formatTime(row.prevpunchtime) || ''
        }));

        const ws = XLSX.utils.json_to_sheet(dataRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Details");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const cleanTitle = (mealModal.title || 'Punch_Details').replace(/[^a-zA-Z0-9]/g, '_');
        saveAs(blob, `${cleanTitle}.xlsx`);
    };

    const exportCouponToExcel = () => {
        if (!filteredCouponRows || filteredCouponRows.length === 0) return;
        const dataRows = filteredCouponRows.map((row: any, idx) => ({
            "Sr.No": idx + 1,
            "Employee Code": row.empcode || '',
            "Tea": row.tea !== undefined ? row.tea : 0,
            "Snacks": row.snk !== undefined ? row.snk : 0,
            "Beverage & Snacks": row.bs !== undefined ? row.bs : 0,
            "Log Date": formatDate(row.logdt),
            "Entry Date": formatDate(row.entrydt)
        }));

        const ws = XLSX.utils.json_to_sheet(dataRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Details");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const cleanTitle = (couponModal.title || 'Coupon_Details').replace(/[^a-zA-Z0-9]/g, '_');
        saveAs(blob, `${cleanTitle}.xlsx`);
    };

    const handleMealChangePage = (_event: unknown, newPage: number) => {
        setMealPage(newPage);
    };

    const handleMealChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMealRowsPerPage(parseInt(event.target.value, 10));
        setMealPage(0);
    };

    const handleCouponChangePage = (_event: unknown, newPage: number) => {
        setCouponPage(newPage);
    };

    const handleCouponChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCouponRowsPerPage(parseInt(event.target.value, 10));
        setCouponPage(0);
    };

    const pagedMealRows = filteredMealRows.slice(mealPage * mealRowsPerPage, mealPage * mealRowsPerPage + mealRowsPerPage);
    const pagedCouponRows = filteredCouponRows.slice(couponPage * couponRowsPerPage, couponPage * couponRowsPerPage + couponRowsPerPage);

    const weeklyTrendData = {
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        values: [20, 45, 30, 25, 40, 65],
    };

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
        <Fade in={true} timeout={800}>
            <Box sx={{ p: 3, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
                {/* HEADER */}
                <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
                    Canteen Dashboard ({formattedUsername})
                </Typography>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
                        <CircularProgress color="primary" size={50} />
                    </Box>
                ) : (
                    <>
                        {/* SMALL STATS CARDS */}
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 3,
                                mb: 4,
                                alignItems: "flex-start",
                            }}
                        >
                            {/* LUNCH CARDs */}
                            <Card
                                onClick={handleLunchClick}
                                sx={{
                                    flex: "1 1 180px",
                                    maxWidth: 220,
                                    bgcolor: "#f57c00",
                                    color: "white",
                                    borderRadius: 3,
                                    cursor: "pointer",
                                    transition: "transform 0.18s, box-shadow 0.18s",
                                    "&:hover": {
                                        transform: "translateY(-4px) scale(1.03)",
                                        boxShadow: "0 8px 24px rgba(245,124,0,0.35)",
                                    },
                                }}
                            >
                                <CardContent sx={{ textAlign: "center", pb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                                        Lunch Meals
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                                        {data.lunch}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                                        Click to view details
                                    </Typography>
                                </CardContent>
                            </Card>

                            {/* DINNER CARD */}
                            <Card
                                onClick={handleDinnerClick}
                                sx={{
                                    flex: "1 1 180px",
                                    maxWidth: 220,
                                    bgcolor: "#1976d2",
                                    color: "white",
                                    borderRadius: 3,
                                    cursor: "pointer",
                                    transition: "transform 0.18s, box-shadow 0.18s",
                                    "&:hover": {
                                        transform: "translateY(-4px) scale(1.03)",
                                        boxShadow: "0 8px 24px rgba(25,118,210,0.35)",
                                    },
                                }}
                            >
                                <CardContent sx={{ textAlign: "center", pb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                                        Dinner Meals
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                                        {data.dinner}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                                        Click to view details
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>

                        {/* TODAY'S COUPONS SECTION */}
                        <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 600, color: "#333" }}>
                            Today's Coupon
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 3,
                                mb: 4,
                                alignItems: "flex-start",
                            }}
                        >
                            {couponsToRender.map((coupon) => (
                                <Card
                                    key={coupon.key}
                                    onClick={() => handleCouponClick(coupon.endpoint, coupon.label)}
                                    sx={{
                                        flex: "1 1 180px",
                                        maxWidth: 220,
                                        background: coupon.gradient,
                                        color: "white",
                                        borderRadius: 3,
                                        cursor: "pointer",
                                        transition: "transform 0.18s, box-shadow 0.18s",
                                        "&:hover": {
                                            transform: "translateY(-4px) scale(1.03)",
                                            boxShadow: `0 8px 24px ${coupon.hoverShadow}`,
                                        },
                                    }}
                                >
                                    <CardContent sx={{ textAlign: "center", pb: 2 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                                            {coupon.label}
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                                            {coupon.value}
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                                            Click to view details
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>

                        {/* MEAL DETAILS MODAL */}
                        {mealModal.open && (
                            <Box
                                onClick={closeMealModal}
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
                                        maxWidth: 850,
                                        maxHeight: '85vh',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                                        overflow: 'hidden',
                                        position: 'relative',
                                    }}
                                >
                                    {/* Close Button */}
                                    <Box
                                        onClick={closeMealModal}
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
                                            pr: 8,
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="h6" fontWeight={700} color="primary">
                                                {mealModal.title}
                                            </Typography>
                                            {!mealModal.loading && !mealModal.error && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {filteredMealRows.length} of {mealModal.rows.length} record{mealModal.rows.length !== 1 ? 's' : ''}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{ overflow: 'auto', flex: 1, p: 3 }}>
                                        {!mealModal.loading && !mealModal.error && mealModal.rows.length > 0 && (
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
                                                    value={mealSearchText}
                                                    onChange={e => { setMealSearchText(e.target.value); setMealPage(0); }}
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
                                                        onClick={exportMealToExcel}
                                                        disabled={filteredMealRows.length === 0}
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
                                                        onClick={exportMealToCSV}
                                                        disabled={filteredMealRows.length === 0}
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
                                        {mealModal.loading && (
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

                                        {mealModal.error && (
                                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                                <Typography color="error" fontWeight={600}>{mealModal.error}</Typography>
                                            </Box>
                                        )}

                                        {!mealModal.loading && !mealModal.error && mealModal.rows.length === 0 && (
                                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                                <Typography color="text.secondary">No records found.</Typography>
                                            </Box>
                                        )}

                                        {!mealModal.loading && !mealModal.error && mealModal.rows.length > 0 && (
                                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0, border: 'none' }}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            {['Sr.No', 'Employee Code', 'Employee Name', 'Employee Type', 'Zone', 'Punch Time', 'Prev Punch Time'].map(col => (
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
                                                        {pagedMealRows.map((row: any, idx) => {
                                                            const globalIdx = mealPage * mealRowsPerPage + idx;
                                                            return (
                                                                <TableRow
                                                                    key={`${row.empcode}-${globalIdx}`}
                                                                    sx={{
                                                                        bgcolor: globalIdx % 2 === 0 ? '#fff' : '#f5f8ff',
                                                                        '&:hover': { bgcolor: '#e3f2fd' },
                                                                    }}
                                                                >
                                                                    <TableCell sx={{ fontSize: 12, color: '#888', minWidth: 36 }}>{globalIdx + 1}</TableCell>
                                                                    <TableCell sx={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{row.empcode || '—'}</TableCell>
                                                                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{row.name || '—'}</TableCell>
                                                                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{row.emptype || '—'}</TableCell>
                                                                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{row.ezone || '—'}</TableCell>
                                                                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatTime(row.punchtime)}</TableCell>
                                                                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatTime(row.prevpunchtime)}</TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Box>

                                    {/* Pagination Footer */}
                                    {!mealModal.loading && !mealModal.error && filteredMealRows.length > 0 && (
                                        <TablePagination
                                            rowsPerPageOptions={[50, 100, 200]}
                                            component="div"
                                            count={filteredMealRows.length}
                                            rowsPerPage={mealRowsPerPage}
                                            page={mealPage}
                                            onPageChange={handleMealChangePage}
                                            onRowsPerPageChange={handleMealChangeRowsPerPage}
                                        />
                                    )}
                                </Box>
                            </Box>
                        )}

                        {/* COUPON DETAILS MODAL */}
                        {couponModal.open && (
                            <Box
                                onClick={closeCouponModal}
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
                                        maxWidth: 850,
                                        maxHeight: '85vh',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                                        overflow: 'hidden',
                                        position: 'relative',
                                    }}
                                >
                                    {/* Close Button */}
                                    <Box
                                        onClick={closeCouponModal}
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
                                            pr: 8,
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="h6" fontWeight={700} color="primary">
                                                {couponModal.title}
                                            </Typography>
                                            {!couponModal.loading && !couponModal.error && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {filteredCouponRows.length} of {couponModal.rows.length} record{couponModal.rows.length !== 1 ? 's' : ''}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{ overflow: 'auto', flex: 1, p: 3 }}>
                                        {!couponModal.loading && !couponModal.error && couponModal.rows.length > 0 && (
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
                                                    value={couponSearchText}
                                                    onChange={e => { setCouponSearchText(e.target.value); setCouponPage(0); }}
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
                                                        onClick={exportCouponToExcel}
                                                        disabled={filteredCouponRows.length === 0}
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
                                                        onClick={exportCouponToCSV}
                                                        disabled={filteredCouponRows.length === 0}
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
                                        {couponModal.loading && (
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

                                        {couponModal.error && (
                                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                                <Typography color="error" fontWeight={600}>{couponModal.error}</Typography>
                                            </Box>
                                        )}

                                        {!couponModal.loading && !couponModal.error && couponModal.rows.length === 0 && (
                                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                                <Typography color="text.secondary">No records found.</Typography>
                                            </Box>
                                        )}

                                        {!couponModal.loading && !couponModal.error && couponModal.rows.length > 0 && (
                                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0, border: 'none' }}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            {['Sr.No', 'Employee Code', 'Tea', 'Snacks', 'Beverage & Snacks', 'Log Date', 'Entry Date'].map(col => (
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
                                                        {pagedCouponRows.map((row: any, idx) => {
                                                            const globalIdx = couponPage * couponRowsPerPage + idx;
                                                            return (
                                                                <TableRow
                                                                    key={`${row.empcode}-${globalIdx}`}
                                                                    sx={{
                                                                        bgcolor: globalIdx % 2 === 0 ? '#fff' : '#f5f8ff',
                                                                        '&:hover': { bgcolor: '#e3f2fd' },
                                                                    }}
                                                                >
                                                                    <TableCell sx={{ fontSize: 12, color: '#888', minWidth: 36 }}>{globalIdx + 1}</TableCell>
                                                                    <TableCell sx={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{row.empcode || '—'}</TableCell>
                                                                    <TableCell sx={{ fontSize: 12 }}>{row.tea !== undefined ? row.tea : 0}</TableCell>
                                                                    <TableCell sx={{ fontSize: 12 }}>{row.snk !== undefined ? row.snk : 0}</TableCell>
                                                                    <TableCell sx={{ fontSize: 12 }}>{row.bs !== undefined ? row.bs : 0}</TableCell>
                                                                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatDate(row.logdt)}</TableCell>
                                                                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatDate(row.entrydt)}</TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Box>

                                    {/* Pagination Footer */}
                                    {!couponModal.loading && !couponModal.error && filteredCouponRows.length > 0 && (
                                        <TablePagination
                                            rowsPerPageOptions={[50, 100, 200]}
                                            component="div"
                                            count={filteredCouponRows.length}
                                            rowsPerPage={couponRowsPerPage}
                                            page={couponPage}
                                            onPageChange={handleCouponChangePage}
                                            onRowsPerPageChange={handleCouponChangeRowsPerPage}
                                        />
                                    )}
                                </Box>
                            </Box>
                        )}

                        {/* DUMMY GRAPHS SECTION */}
                        <Row className="g-4">
                            <Col xs={12} md={6}>
                                <Card sx={{ borderRadius: 3 }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                                            Daily Meal Consumption
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                        <Box sx={{ height: 320, width: "100%" }}>
                                            <BarChart
                                                xAxis={[{ scaleType: "band", data: ["Breakfast", "Lunch", "Dinner"] }]}
                                                series={[
                                                    { data: [Math.round(data.lunch * 0.1), data.lunch, data.dinner], label: "Today", color: "#1976d2" },
                                                    { data: [Math.round(data.lunch * 0.08), Math.round(data.lunch * 1.1), Math.round(data.dinner * 0.95)], label: "Yesterday", color: "#388e3c" },
                                                    { data: [Math.round(data.lunch * 0.12), Math.round(data.lunch * 0.95), Math.round(data.dinner * 1.05)], label: "Average", color: "#f57c00" },
                                                ]}
                                                height={300}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Col>

                            <Col xs={12} md={6}>
                                <Card sx={{ borderRadius: 3 }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                                            Weekly Meal Trend
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                        <Box sx={{ height: 320, width: "100%" }}>
                                            <LineChart
                                                xAxis={[{ scaleType: "point", data: weeklyTrendData.days }]}
                                                series={[{
                                                    data: [
                                                        Math.round((data.lunch + data.dinner) * 0.85),
                                                        Math.round((data.lunch + data.dinner) * 0.95),
                                                        Math.round((data.lunch + data.dinner) * 1.0),
                                                        Math.round((data.lunch + data.dinner) * 0.9),
                                                        Math.round((data.lunch + data.dinner) * 1.05),
                                                        Math.round((data.lunch + data.dinner) * 0.7)
                                                    ],
                                                    color: "#1976d2"
                                                }]}
                                                height={300}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Col>
                        </Row>
                    </>
                )}
            </Box>
        </Fade>
    );
}
