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
} from "@mui/material";
import { Row, Col } from "react-bootstrap";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";

interface UserDashboardData {
    lunch: number;
    dinner: number;
}

interface PunchRow {
    empCode: string;
    punchTime: string;
    name: string;
    empType: string;
    eZone: string;
    prevPunchTime: string | null;
}

interface ModalState {
    open: boolean;
    title: string;
    loading: boolean;
    error: string | null;
    rows: PunchRow[];
}

export default function UserDashboard() {
    const [loading, setLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const [data, setData] = useState<UserDashboardData>({
        lunch: 0,
        dinner: 0,
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

        fetchDashboardData();
    }, []);

    const fetchPunchDetails = async (endpoint: string, title: string) => {
        setSearchText('');
        setPage(0);
        setModal({ open: true, title, loading: true, error: null, rows: [] });

        try {
            const data = await apiFetch(endpoint);
            const rows: PunchRow[] = data?.dataFetch?.table || [];
            setModal(prev => ({ ...prev, loading: false, rows }));
        } catch (err: any) {
            setModal(prev => ({ ...prev, loading: false, error: err?.message || 'Failed to load data.' }));
        }
    };

    const handleLunchClick = () => {
        fetchPunchDetails('Canteen-Punch/get-todayLunch', "Today's Lunch Punch Details");
    };

    const handleDinnerClick = () => {
        fetchPunchDetails('Canteen-Punch/get-todayDinner', "Today's Dinner Punch Details");
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, open: false }));
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '-';
        return timeStr.split('.')[0];
    };

    const filteredRows = modal.rows.filter(row => {
        const q = searchText.toLowerCase();
        return (
            row.empCode?.toLowerCase().includes(q) ||
            row.name?.toLowerCase().includes(q) ||
            row.empType?.toLowerCase().includes(q) ||
            row.eZone?.toLowerCase().includes(q) ||
            row.punchTime?.toLowerCase().includes(q) ||
            (row.prevPunchTime && row.prevPunchTime.toLowerCase().includes(q))
        );
    });

    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
    const pagedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const weeklyTrendData = {
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        values: [20, 45, 30, 25, 40, 65],
    };

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
                            {/* LUNCH CARD */}
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

                        {/* DETAILS MODAL */}
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
                                        maxWidth: 800,
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
                                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0, border: 'none' }}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            {['#', 'Employee Code','Employee Name','Employee Type','Zone','Punch Time'].map(col => (
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
                                                                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{row.name}</TableCell>
                                                                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{row.empType}</TableCell>
                                                                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{row.eZone}</TableCell>
                                                                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatTime(row.punchTime)}</TableCell>
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
