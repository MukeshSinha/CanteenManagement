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


const getRowVal = (row: any, keys: string[]): any => {
    if (!row) return undefined;
    for (const key of keys) {
        if (row[key] !== undefined) return row[key];
        const lower = key.toLowerCase();
        if (row[lower] !== undefined) return row[lower];
    }
    return undefined;
};

interface DashboardModalState {
    open: boolean;
    title: string;
    loading: boolean;
    error: string | null;
    rows: any[];
    searchText: string;
    page: number;
    rowsPerPage: number;
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

    const [lunchModal, setLunchModal] = useState<DashboardModalState>({
        open: false,
        title: "Today's Lunch Punch Details",
        loading: false,
        error: null,
        rows: [],
        searchText: '',
        page: 0,
        rowsPerPage: 100,
    });

    const [dinnerModal, setDinnerModal] = useState<DashboardModalState>({
        open: false,
        title: "Today's Dinner Punch Details",
        loading: false,
        error: null,
        rows: [],
        searchText: '',
        page: 0,
        rowsPerPage: 100,
    });

    const [couponModals, setCouponModals] = useState<Record<string, DashboardModalState>>({});

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

    const fetchLunchDetails = async () => {
        setLunchModal(prev => ({
            ...prev,
            open: true,
            loading: true,
            error: null,
            rows: [],
            searchText: '',
            page: 0,
        }));
        try {
            let data = await apiFetch('Canteen-Punch/get-todayLunch');
            if (typeof data === "string") {
                data = JSON.parse(data);
            }
            const rows: any[] = data?.dataFetch?.table || [];
            setLunchModal(prev => ({ ...prev, loading: false, rows }));
        } catch (err: any) {
            setLunchModal(prev => ({ ...prev, loading: false, error: err?.message || 'Failed to load data.' }));
        }
    };

    const fetchDinnerDetails = async () => {
        setDinnerModal(prev => ({
            ...prev,
            open: true,
            loading: true,
            error: null,
            rows: [],
            searchText: '',
            page: 0,
        }));
        try {
            let data = await apiFetch('Canteen-Punch/get-todayDinner');
            if (typeof data === "string") {
                data = JSON.parse(data);
            }
            const rows: any[] = data?.dataFetch?.table || [];
            setDinnerModal(prev => ({ ...prev, loading: false, rows }));
        } catch (err: any) {
            setDinnerModal(prev => ({ ...prev, loading: false, error: err?.message || 'Failed to load data.' }));
        }
    };

    const fetchCouponDetails = async (key: string, endpoint: string, title: string) => {
        setCouponModals(prev => ({
            ...prev,
            [key]: {
                open: true,
                title,
                loading: true,
                error: null,
                rows: [],
                searchText: '',
                page: 0,
                rowsPerPage: 100,
            }
        }));
        try {
            let data = await apiFetch(endpoint);
            if (typeof data === "string") {
                data = JSON.parse(data);
            }
            const rows: any[] = data?.dataFetch?.table || [];
            setCouponModals(prev => ({
                ...prev,
                [key]: {
                    ...(prev[key] || {}),
                    loading: false,
                    rows,
                }
            }));
        } catch (err: any) {
            setCouponModals(prev => ({
                ...prev,
                [key]: {
                    ...(prev[key] || {}),
                    loading: false,
                    error: err?.message || 'Failed to load data.',
                }
            }));
        }
    };

    const handleLunchClick = () => {
        fetchLunchDetails();
    };

    const handleDinnerClick = () => {
        fetchDinnerDetails();
    };

    const handleCouponClick = (key: string, endpoint: string, label: string) => {
        fetchCouponDetails(key, endpoint, `Today's ${label} Details`);
    };

    const closeLunchModal = () => {
        setLunchModal(prev => ({ ...prev, open: false }));
    };

    const closeDinnerModal = () => {
        setDinnerModal(prev => ({ ...prev, open: false }));
    };

    const closeCouponModal = (key: string) => {
        setCouponModals(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || {}),
                open: false,
            }
        }));
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

    const getFilteredMealRows = (modal: DashboardModalState) => {
        const q = modal.searchText.trim().toLowerCase();
        if (!q) return modal.rows;
        return modal.rows.filter((row: any) => {
            const empCode = getRowVal(row, ['empCode', 'empcode']);
            const name = getRowVal(row, ['name', 'empName', 'empname']);
            const empType = getRowVal(row, ['empType', 'emptype']);
            const eZone = getRowVal(row, ['eZone', 'ezone']);
            const punchTime = getRowVal(row, ['punchTime', 'punchtime']);
            const prevPunchTime = getRowVal(row, ['prevPunchTime', 'prevpunchtime']);
            return (
                (empCode && String(empCode).toLowerCase().includes(q)) ||
                (name && String(name).toLowerCase().includes(q)) ||
                (empType && String(empType).toLowerCase().includes(q)) ||
                (eZone && String(eZone).toLowerCase().includes(q)) ||
                (punchTime && String(punchTime).toLowerCase().includes(q)) ||
                (prevPunchTime && String(prevPunchTime).toLowerCase().includes(q))
            );
        });
    };

    const getFilteredCouponRows = (modal: DashboardModalState) => {
        if (!modal) return [];
        const q = modal.searchText.trim().toLowerCase();
        if (!q) return modal.rows;
        return modal.rows.filter((row: any) => {
            const empCode = getRowVal(row, ['empCode', 'empcode']);
            const logdt = getRowVal(row, ['logdt', 'logDate', 'logdate']);
            const entrydt = getRowVal(row, ['entrydt', 'entryDate', 'entrydate']);
            const tea = getRowVal(row, ['tea']);
            const snk = getRowVal(row, ['snk', 'snack', 'snacks']);
            const bs = getRowVal(row, ['bs']);
            return (
                (empCode && String(empCode).toLowerCase().includes(q)) ||
                (logdt && String(logdt).toLowerCase().includes(q)) ||
                (entrydt && String(entrydt).toLowerCase().includes(q)) ||
                (tea !== undefined && String(tea).toLowerCase().includes(q)) ||
                (snk !== undefined && String(snk).toLowerCase().includes(q)) ||
                (bs !== undefined && String(bs).toLowerCase().includes(q))
            );
        });
    };

    const exportMealToCSV = (filteredRows: any[], title: string) => {
        if (!filteredRows || filteredRows.length === 0) return;
        const headers = ["Sr.No", "Employee Code", "Employee Name", "Employee Type", "Zone", "Punch Time", "Prev Punch Time"];
        const exportData = filteredRows.map((row, idx) => {
            const empCode = getRowVal(row, ['empCode', 'empcode']) || '';
            const name = getRowVal(row, ['name', 'empName', 'empname']) || '';
            const empType = getRowVal(row, ['empType', 'emptype']) || '';
            const eZone = getRowVal(row, ['eZone', 'ezone']) || '';
            const punchTime = getRowVal(row, ['punchTime', 'punchtime']) || '';
            const prevPunchTime = getRowVal(row, ['prevPunchTime', 'prevpunchtime']) || '';
            return [
                idx + 1,
                `"${String(empCode).replace(/"/g, '""')}"`,
                `"${String(name).replace(/"/g, '""')}"`,
                `"${String(empType).replace(/"/g, '""')}"`,
                `"${String(eZone).replace(/"/g, '""')}"`,
                `"${String(formatTime(punchTime)).replace(/"/g, '""')}"`,
                `"${String(formatTime(prevPunchTime)).replace(/"/g, '""')}"`
            ];
        });

        const csvContent = [headers.join(","), ...exportData.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const cleanTitle = (title || 'Punch_Details').replace(/[^a-zA-Z0-9]/g, '_');
        saveAs(blob, `${cleanTitle}.csv`);
    };

    const exportMealToExcel = (filteredRows: any[], title: string) => {
        if (!filteredRows || filteredRows.length === 0) return;
        const dataRows = filteredRows.map((row, idx) => {
            const empCode = getRowVal(row, ['empCode', 'empcode']) || '';
            const name = getRowVal(row, ['name', 'empName', 'empname']) || '';
            const empType = getRowVal(row, ['empType', 'emptype']) || '';
            const eZone = getRowVal(row, ['eZone', 'ezone']) || '';
            const punchTime = getRowVal(row, ['punchTime', 'punchtime']) || '';
            const prevPunchTime = getRowVal(row, ['prevPunchTime', 'prevpunchtime']) || '';
            return {
                "Sr.No": idx + 1,
                "Employee Code": empCode,
                "Employee Name": name,
                "Employee Type": empType,
                "Zone": eZone,
                "Punch Time": formatTime(punchTime),
                "Prev Punch Time": formatTime(prevPunchTime)
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Details");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const cleanTitle = (title || 'Punch_Details').replace(/[^a-zA-Z0-9]/g, '_');
        saveAs(blob, `${cleanTitle}.xlsx`);
    };

    const exportCouponToCSV = (filteredRows: any[], title: string) => {
        if (!filteredRows || filteredRows.length === 0) return;
        const headers = ["Sr.No", "Employee Code", "Tea", "Snacks", "Beverage & Snacks", "Log Date", "Entry Date"];
        const exportData = filteredRows.map((row: any, idx) => {
            const empCode = getRowVal(row, ['empCode', 'empcode']) || '';
            const tea = getRowVal(row, ['tea']) !== undefined ? getRowVal(row, ['tea']) : 0;
            const snk = getRowVal(row, ['snk', 'snack', 'snacks']) !== undefined ? getRowVal(row, ['snk', 'snack', 'snacks']) : 0;
            const bs = getRowVal(row, ['bs']) !== undefined ? getRowVal(row, ['bs']) : 0;
            const logdt = getRowVal(row, ['logdt', 'logDate', 'logdate']) || '';
            const entrydt = getRowVal(row, ['entrydt', 'entryDate', 'entrydate']) || '';
            return [
                idx + 1,
                `"${String(empCode).replace(/"/g, '""')}"`,
                tea,
                snk,
                bs,
                `"${String(formatDate(logdt)).replace(/"/g, '""')}"`,
                `"${String(formatDate(entrydt)).replace(/"/g, '""')}"`
            ];
        });

        const csvContent = [headers.join(","), ...exportData.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const cleanTitle = (title || 'Coupon_Details').replace(/[^a-zA-Z0-9]/g, '_');
        saveAs(blob, `${cleanTitle}.csv`);
    };

    const exportCouponToExcel = (filteredRows: any[], title: string) => {
        if (!filteredRows || filteredRows.length === 0) return;
        const dataRows = filteredRows.map((row: any, idx) => {
            const empCode = getRowVal(row, ['empCode', 'empcode']) || '';
            const tea = getRowVal(row, ['tea']) !== undefined ? getRowVal(row, ['tea']) : 0;
            const snk = getRowVal(row, ['snk', 'snack', 'snacks']) !== undefined ? getRowVal(row, ['snk', 'snack', 'snacks']) : 0;
            const bs = getRowVal(row, ['bs']) !== undefined ? getRowVal(row, ['bs']) : 0;
            const logdt = getRowVal(row, ['logdt', 'logDate', 'logdate']) || '';
            const entrydt = getRowVal(row, ['entrydt', 'entryDate', 'entrydate']) || '';
            return {
                "Sr.No": idx + 1,
                "Employee Code": empCode,
                "Tea": tea,
                "Snacks": snk,
                "Beverage & Snacks": bs,
                "Log Date": formatDate(logdt),
                "Entry Date": formatDate(entrydt)
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Details");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const cleanTitle = (title || 'Coupon_Details').replace(/[^a-zA-Z0-9]/g, '_');
        saveAs(blob, `${cleanTitle}.xlsx`);
    };

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
                                    onClick={() => handleCouponClick(coupon.key, coupon.endpoint, coupon.label)}
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

                        {/* MEAL DETAILS MODALS */}
                        {(() => {
                            const filteredRows = getFilteredMealRows(lunchModal);
                            const pagedRows = filteredRows.slice(lunchModal.page * lunchModal.rowsPerPage, lunchModal.page * lunchModal.rowsPerPage + lunchModal.rowsPerPage);
                            return (
                                <DashboardModal
                                    open={lunchModal.open}
                                    title={lunchModal.title}
                                    loading={lunchModal.loading}
                                    error={lunchModal.error}
                                    rows={lunchModal.rows}
                                    searchText={lunchModal.searchText}
                                    page={lunchModal.page}
                                    rowsPerPage={lunchModal.rowsPerPage}
                                    onClose={closeLunchModal}
                                    onSearchChange={(val) => setLunchModal(prev => ({ ...prev, searchText: val, page: 0 }))}
                                    onPageChange={(page) => setLunchModal(prev => ({ ...prev, page }))}
                                    onRowsPerPageChange={(rpp) => setLunchModal(prev => ({ ...prev, rowsPerPage: rpp, page: 0 }))}
                                    onExportCSV={() => exportMealToCSV(filteredRows, lunchModal.title)}
                                    onExportExcel={() => exportMealToExcel(filteredRows, lunchModal.title)}
                                    columns={['Sr.No', 'Employee Code', 'Employee Name', 'Employee Type', 'Zone', 'Punch Time', 'Prev Punch Time']}
                                    filteredRowsCount={filteredRows.length}
                                    pagedRows={pagedRows}
                                    renderRow={(row, globalIdx) => {
                                        const empCode = getRowVal(row, ['empCode', 'empcode']) || '—';
                                        const name = getRowVal(row, ['name', 'empName', 'empname']) || '—';
                                        const empType = getRowVal(row, ['empType', 'emptype']) || '—';
                                        const eZone = getRowVal(row, ['eZone', 'ezone']) || '—';
                                        const punchTime = getRowVal(row, ['punchTime', 'punchtime']);
                                        const prevPunchTime = getRowVal(row, ['prevPunchTime', 'prevpunchtime']);
                                        return (
                                            <TableRow
                                                key={`${empCode}-${globalIdx}`}
                                                sx={{
                                                    bgcolor: globalIdx % 2 === 0 ? '#fff' : '#f5f8ff',
                                                    '&:hover': { bgcolor: '#e3f2fd' },
                                                }}
                                            >
                                                <TableCell sx={{ fontSize: 12, color: '#888', minWidth: 36 }}>{globalIdx + 1}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{empCode}</TableCell>
                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{name}</TableCell>
                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{empType}</TableCell>
                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{eZone}</TableCell>
                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatTime(punchTime)}</TableCell>
                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatTime(prevPunchTime)}</TableCell>
                                            </TableRow>
                                        );
                                    }}
                                />
                            );
                        })()}

                        {(() => {
                            const filteredRows = getFilteredMealRows(dinnerModal);
                            const pagedRows = filteredRows.slice(dinnerModal.page * dinnerModal.rowsPerPage, dinnerModal.page * dinnerModal.rowsPerPage + dinnerModal.rowsPerPage);
                            return (
                                <DashboardModal
                                    open={dinnerModal.open}
                                    title={dinnerModal.title}
                                    loading={dinnerModal.loading}
                                    error={dinnerModal.error}
                                    rows={dinnerModal.rows}
                                    searchText={dinnerModal.searchText}
                                    page={dinnerModal.page}
                                    rowsPerPage={dinnerModal.rowsPerPage}
                                    onClose={closeDinnerModal}
                                    onSearchChange={(val) => setDinnerModal(prev => ({ ...prev, searchText: val, page: 0 }))}
                                    onPageChange={(page) => setDinnerModal(prev => ({ ...prev, page }))}
                                    onRowsPerPageChange={(rpp) => setDinnerModal(prev => ({ ...prev, rowsPerPage: rpp, page: 0 }))}
                                    onExportCSV={() => exportMealToCSV(filteredRows, dinnerModal.title)}
                                    onExportExcel={() => exportMealToExcel(filteredRows, dinnerModal.title)}
                                    columns={['Sr.No', 'Employee Code', 'Employee Name', 'Employee Type', 'Zone', 'Punch Time', 'Prev Punch Time']}
                                    filteredRowsCount={filteredRows.length}
                                    pagedRows={pagedRows}
                                    renderRow={(row, globalIdx) => {
                                        const empCode = getRowVal(row, ['empCode', 'empcode']) || '—';
                                        const name = getRowVal(row, ['name', 'empName', 'empname']) || '—';
                                        const empType = getRowVal(row, ['empType', 'emptype']) || '—';
                                        const eZone = getRowVal(row, ['eZone', 'ezone']) || '—';
                                        const punchTime = getRowVal(row, ['punchTime', 'punchtime']);
                                        const prevPunchTime = getRowVal(row, ['prevPunchTime', 'prevpunchtime']);
                                        return (
                                            <TableRow
                                                key={`${empCode}-${globalIdx}`}
                                                sx={{
                                                    bgcolor: globalIdx % 2 === 0 ? '#fff' : '#f5f8ff',
                                                    '&:hover': { bgcolor: '#e3f2fd' },
                                                }}
                                            >
                                                <TableCell sx={{ fontSize: 12, color: '#888', minWidth: 36 }}>{globalIdx + 1}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{empCode}</TableCell>
                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{name}</TableCell>
                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{empType}</TableCell>
                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{eZone}</TableCell>
                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatTime(punchTime)}</TableCell>
                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatTime(prevPunchTime)}</TableCell>
                                            </TableRow>
                                        );
                                    }}
                                />
                            );
                        })()}

                        {/* COUPON DETAILS MODALS */}
                        {Object.entries(couponModals).map(([key, cModal]) => {
                            if (!cModal || !cModal.open) return null;
                            const filteredRows = getFilteredCouponRows(cModal);
                            const pagedRows = filteredRows.slice(cModal.page * cModal.rowsPerPage, cModal.page * cModal.rowsPerPage + cModal.rowsPerPage);
                            return (
                                <DashboardModal
                                    key={key}
                                    open={cModal.open}
                                    title={cModal.title}
                                    loading={cModal.loading}
                                    error={cModal.error}
                                    rows={cModal.rows}
                                    searchText={cModal.searchText}
                                    page={cModal.page}
                                    rowsPerPage={cModal.rowsPerPage}
                                    onClose={() => closeCouponModal(key)}
                                    onSearchChange={(val) => setCouponModals(prev => ({
                                        ...prev,
                                        [key]: { ...(prev[key] || {}), searchText: val, page: 0 }
                                    }))}
                                    onPageChange={(page) => setCouponModals(prev => ({
                                        ...prev,
                                        [key]: { ...(prev[key] || {}), page }
                                    }))}
                                    onRowsPerPageChange={(rpp) => setCouponModals(prev => ({
                                        ...prev,
                                        [key]: { ...(prev[key] || {}), rowsPerPage: rpp, page: 0 }
                                    }))}
                                    onExportCSV={() => exportCouponToCSV(filteredRows, cModal.title)}
                                    onExportExcel={() => exportCouponToExcel(filteredRows, cModal.title)}
                                    columns={['Sr.No', 'Employee Code', 'Tea', 'Snacks', 'Beverage & Snacks', 'Log Date', 'Entry Date']}
                                    filteredRowsCount={filteredRows.length}
                                    pagedRows={pagedRows}
                                    renderRow={(row, globalIdx) => {
                                        const empCode = getRowVal(row, ['empCode', 'empcode']) || '—';
                                        const tea = getRowVal(row, ['tea']) !== undefined ? getRowVal(row, ['tea']) : 0;
                                        const snk = getRowVal(row, ['snk', 'snack', 'snacks']) !== undefined ? getRowVal(row, ['snk', 'snack', 'snacks']) : 0;
                                        const bs = getRowVal(row, ['bs']) !== undefined ? getRowVal(row, ['bs']) : 0;
                                        const logdt = getRowVal(row, ['logdt', 'logDate', 'logdate']);
                                        const entrydt = getRowVal(row, ['entrydt', 'entryDate', 'entrydate']);
                                        return (
                                            <TableRow
                                                key={`${empCode}-${globalIdx}`}
                                                sx={{
                                                    bgcolor: globalIdx % 2 === 0 ? '#fff' : '#f5f8ff',
                                                    '&:hover': { bgcolor: '#e3f2fd' },
                                                }}
                                            >
                                                <TableCell sx={{ fontSize: 12, color: '#888', minWidth: 36 }}>{globalIdx + 1}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{empCode}</TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{tea}</TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{snk}</TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{bs}</TableCell>
                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatDate(logdt)}</TableCell>
                                                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatDate(entrydt)}</TableCell>
                                            </TableRow>
                                        );
                                    }}
                                />
                            );
                        })}

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

interface DashboardModalProps {
    open: boolean;
    title: string;
    loading: boolean;
    error: string | null;
    rows: any[];
    searchText: string;
    page: number;
    rowsPerPage: number;
    onClose: () => void;
    onSearchChange: (val: string) => void;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
    onExportCSV: () => void;
    onExportExcel: () => void;
    columns: string[];
    filteredRowsCount: number;
    pagedRows: any[];
    renderRow: (row: any, globalIdx: number) => React.ReactNode;
}

function DashboardModal({
    open,
    title,
    loading,
    error,
    rows,
    searchText,
    page,
    rowsPerPage,
    onClose,
    onSearchChange,
    onPageChange,
    onRowsPerPageChange,
    onExportCSV,
    onExportExcel,
    columns,
    filteredRowsCount,
    pagedRows,
    renderRow
}: DashboardModalProps) {
    if (!open) return null;

    return (
        <Box
            onClick={onClose}
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
                    onClick={onClose}
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
                            {title}
                        </Typography>
                        {!loading && !error && (
                            <Typography variant="caption" color="text.secondary">
                                {filteredRowsCount} of {rows.length} record{rows.length !== 1 ? 's' : ''}
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Box sx={{ overflow: 'auto', flex: 1, p: 3 }}>
                    {!loading && !error && rows.length > 0 && (
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
                                onChange={e => onSearchChange(e.target.value)}
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
                                    onClick={onExportExcel}
                                    disabled={filteredRowsCount === 0}
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
                                    onClick={onExportCSV}
                                    disabled={filteredRowsCount === 0}
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
                    {loading && (
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

                    {error && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="error" fontWeight={600}>{error}</Typography>
                        </Box>
                    )}

                    {!loading && !error && rows.length === 0 && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary">No records found.</Typography>
                        </Box>
                    )}

                    {!loading && !error && rows.length > 0 && (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0, border: 'none' }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        {columns.map(col => (
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
                                    {pagedRows.map((row: any, idx: number) => {
                                        const globalIdx = page * rowsPerPage + idx;
                                        return renderRow(row, globalIdx);
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>

                {/* Pagination Footer */}
                {!loading && !error && filteredRowsCount > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[50, 100, 200]}
                        component="div"
                        count={filteredRowsCount}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_e, newPage) => onPageChange(newPage)}
                        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
                    />
                )}
            </Box>
        </Box>
    );
}
