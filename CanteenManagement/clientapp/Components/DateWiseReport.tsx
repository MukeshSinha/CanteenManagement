import { useState} from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    InputAdornment,
    Paper,
    CircularProgress,
    Alert,
    TablePagination,
    type TablePaginationProps
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    Search as SearchIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';





function DateWiseReport() {
    const [fromDate, setFromDate] = useState<string>('');
    const [upToDate, setUpToDate] = useState<string>('');
    const [reportRows, setReportRows] = useState<Record<string, unknown>[]>([]);
    const [reportColumns, setReportColumns] = useState<string[]>([]);
    const [apiError, setApiError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showReport, setShowReport] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchCanteenReport = async (params: any) => {
        try {
            setApiError('');

            // params ko URLSearchParams mein convert karo
            const queryString = new URLSearchParams({
                fromdate: params.fromDate,
                uptodate: params.upToDate,
            }).toString();
            console.log("query strring is:", queryString);

            const url = `/api/ShitWise/DateWise-Report?${queryString}`;

            const res = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },

            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            let data = await res.json();
            if (typeof data === 'string') data = JSON.parse(data);

            const table = data?.dataFetch?.table || [];
            const columns = table.length > 0 ? Object.keys(table[0]) : [];

            return { rows: table, columns };
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load report';
            setApiError(msg);
            console.error(err);
            return { rows: [], columns: [] };
        }
    };

    
    // ────────────────────────────────────────────────

    

    const handleShow = async () => {
        if (!fromDate || !upToDate) {
            alert('Please Select From date, Up to date');
            return;
        }

        setLoading(true);
        setShowReport(true);
        setApiError('');

        const params = {
            fromDate,
            upToDate,
            
        };
        console.log('Requesting report with params:', params);

        const { rows, columns } = await fetchCanteenReport(params);

        setReportRows(rows);
        setReportColumns(columns);
        setLoading(false);
    };

    const filteredRows = reportRows.filter((row) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return reportColumns.some((col) =>
            String(row[col] ?? '').toLowerCase().includes(term)
        );
    });

    const exportToExcel = () => {
        if (filteredRows.length === 0) {

            return;
        }

        const data = [
            reportColumns,
            ...filteredRows.map((row) => reportColumns.map((col) => row[col] ?? '')),
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'DateWise Report');
        XLSX.writeFile(wb, `Canteen_${fromDate || 'from'}_to_${upToDate || 'to'}.xlsx`);
    };

    const shiftStartIndex = reportColumns.findIndex(
        (col) => col.toLowerCase() === "a"
    );

    const leftColumns =
        shiftStartIndex === -1 ? reportColumns : reportColumns.slice(0, shiftStartIndex);

    const shiftColumns =
        shiftStartIndex === -1 ? [] : reportColumns.slice(shiftStartIndex);

    const columnHeaderMap: Record<string, string> = {
        ezone: "Employee Zone",
        empCode: "Employee Code",
        empName: "Employee Name",
        department: "Department",
        eType: "Employee Type"
    };

    const handleChangePage: TablePaginationProps['onPageChange'] = (_event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
                DateWise Report
            </Typography>

            <Card sx={{ mb: 4, borderRadius: 2 }}>
                <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            label="From Date"
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            slotProps={{
                                inputLabel: { shrink: true },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarIcon />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Up To Date"
                            type="date"
                            value={upToDate}
                            onChange={(e) => setUpToDate(e.target.value)}
                            slotProps={{
                                inputLabel: { shrink: true },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarIcon />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Stack>

                    

                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleShow}
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Show'}
                    </Button>
                </CardContent>
            </Card>

            {showReport && (
                <Card>
                    <CardContent>
                        <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                            <Stack direction="row" spacing={4} flexWrap="wrap">
                                <div>
                                    <Typography variant="caption" color="text.secondary">From</Typography>
                                    <Typography>{fromDate || '—'}</Typography>
                                </div>
                                <div>
                                    <Typography variant="caption" color="text.secondary">To</Typography>
                                    <Typography>{upToDate || '—'}</Typography>
                                </div>
                            </Stack>
                        </Box>

                        {apiError && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {apiError}
                            </Alert>
                        )}

                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            justifyContent="space-between"
                            spacing={2}
                            sx={{ mb: 3 }}
                        >
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search anywhere..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={exportToExcel}
                                disabled={filteredRows.length === 0}
                            >
                                Export Excel
                            </Button>
                        </Stack>

                        <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: "auto" }}>

                            <Table stickyHeader size="small">

                                {/* HEADER */}
                                <TableHead>

                                    <TableRow>

                                        {leftColumns.map((col) => (
                                            <TableCell
                                                key={col}
                                                rowSpan={2}
                                                align="center"
                                                sx={{
                                                    bgcolor: "#1976d2",
                                                    color: "white",
                                                    fontWeight: "bold",
                                                    minWidth: 120
                                                }}
                                            >
                                                {columnHeaderMap[col] || col}
                                            </TableCell>
                                        ))}

                                        {shiftColumns.length > 0 && (
                                            <TableCell
                                                colSpan={shiftColumns.length}
                                                align="center"
                                                sx={{
                                                    bgcolor: "#1976d2",
                                                    color: "white",
                                                    fontWeight: "bold"
                                                }}
                                            >
                                                Shift
                                            </TableCell>
                                        )}

                                    </TableRow>

                                    {shiftColumns.length > 0 && (
                                        <TableRow>
                                            {shiftColumns.map((col) => (
                                                <TableCell
                                                    key={col}
                                                    align="center"
                                                    sx={{
                                                        bgcolor: "#1976d2",
                                                        color: "white",
                                                        fontWeight: "bold"
                                                    }}
                                                >
                                                    {col}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    )}

                                </TableHead>


                                {/* BODY */}
                                <TableBody>

                                    {loading ? (

                                        <TableRow>
                                            <TableCell
                                                colSpan={reportColumns.length || 10}
                                                align="center"
                                                sx={{ py: 8 }}
                                            >
                                                <CircularProgress />
                                            </TableCell>
                                        </TableRow>

                                    ) : filteredRows.length === 0 ? (

                                        <TableRow>
                                            <TableCell
                                                colSpan={reportColumns.length || 10}
                                                align="center"
                                                sx={{ py: 6 }}
                                            >
                                                No records found
                                            </TableCell>
                                        </TableRow>

                                    ) : (

                                        filteredRows
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((row, index) => (

                                                <TableRow key={index} hover>

                                                    {reportColumns.map((col) => (
                                                        <TableCell
                                                            key={col}
                                                            align="center"
                                                            sx={{ fontSize: 13 }}
                                                        >
                                                            {row[col] !== null && row[col] !== undefined
                                                                ? String(row[col])
                                                                : "—"}
                                                        </TableCell>
                                                    ))}

                                                </TableRow>

                                            ))

                                    )}

                                </TableBody>

                            </Table>

                        </TableContainer>


                        {/* PAGINATION */}

                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={filteredRows.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}

export default DateWiseReport;