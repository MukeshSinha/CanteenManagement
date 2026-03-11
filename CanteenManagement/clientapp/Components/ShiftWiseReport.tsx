import { useState, useEffect } from 'react';
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
    Autocomplete,
    InputAdornment,
    Paper,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    Search as SearchIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { apiCall } from '../src/Services/api'; 

// only this part is hardcoded
const categories = ['Staff', 'Officer', 'DTL', 'Sub', 'Cont', 'NAPS', 'TOA', 'APP'];

function ShiftWiseReport() {
    const [fromDate, setFromDate] = useState<string>('');
    const [upToDate, setUpToDate] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [contractor, setContractor] = useState<string | null>(null);
    const [contractors, setContractors] = useState<string[]>([]);

    const [reportRows, setReportRows] = useState<Record<string, unknown>[]>([]);
    const [reportColumns, setReportColumns] = useState<string[]>([]);
    const [apiError, setApiError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showReport, setShowReport] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // ────────────────────────────────────────────────
    // API calls defined INSIDE the component

    const fetchContractors = async (): Promise<string[]> => {
        try {
            const res = await apiCall("api/ShitWise/Contractor-Report");

            if (!res.ok) throw new Error('Failed to load contractors');

            const result = await res.json();

            // safety in case API returns stringified JSON (uncommon but happens sometimes)
            const data = typeof result === 'string' ? JSON.parse(result) : result;

            console.log('Contractors API response:', data);

            const list = data?.dataFetch?.table
                ?.map((item: any) => String(item.compName ?? '').trim())
                ?.filter((name: string) => name) ?? [];

            return list;
        } catch (err: unknown) {
            console.error('fetchContractors error:', err);
            return [];
        }
    };

    // Type hatake bilkul plain
    const fetchCanteenReport = async (params:any) => {
        try {
            setApiError('');

            // params ko URLSearchParams mein convert karo
            const queryString = new URLSearchParams({
                fromdate: params.fromDate,
                uptodate: params.upToDate,
                contractor: params.contractor || '',
                category: params.category || '',
            }).toString();
            console.log("query strring is:", queryString);

            const url = `/api/ShitWise/ShitWise-Data?${queryString}`;

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

    useEffect(() => {
        let mounted = true;

        const loadContractors = async () => {
            const list = await fetchContractors();
            if (mounted) {
                setContractors(list);
            }
        };

        loadContractors();

        return () => {
            mounted = false;
        };
    }, []);

    const handleShow = async () => {
        if (!fromDate || !upToDate || !selectedCategory) {
            alert('From date, Up to date aur Category select karo');
            return;
        }

        setLoading(true);
        setShowReport(true);
        setApiError('');

        const params = {
            fromDate,
            upToDate,
            contractor: contractor || '',
            category: selectedCategory,
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
        XLSX.utils.book_append_sheet(wb, ws, 'Canteen Report');
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
        eType:"Employee Type"
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
                ShiftWise Report
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

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 3 }}>
                        {/*<Autocomplete*/}
                        {/*    multiple*/}
                        {/*    fullWidth*/}
                        {/*    options={categories}*/}
                        {/*    value={selectedCategories}*/}
                        {/*    onChange={(_, newValue) => setSelectedCategories(newValue)}*/}
                        {/*    disableCloseOnSelect*/}
                        {/*    renderInput={(params) => <TextField {...params} label="Categories" required />}*/}
                        {/*    renderOption={(props, option, { selected }) => (*/}
                        {/*        <MenuItem {...props}>*/}
                        {/*            <Checkbox checked={selected} size="small" />*/}
                        {/*            <ListItemText primary={option} />*/}
                        {/*        </MenuItem>*/}
                        {/*    )}*/}
                        {/*    renderTags={(value, getTagProps) =>*/}
                        {/*        value.map((option, index) => (*/}
                        {/*            <Chip label={option} {...getTagProps({ index })} size="small" />*/}
                        {/*        ))*/}
                        {/*    }*/}
                        {/*/>*/}

                        <Autocomplete
                            fullWidth
                            options={categories}
                            value={selectedCategory}
                            onChange={(_, newValue) => setSelectedCategory(newValue)}
                            renderInput={(params) => (
                                <TextField {...params} label="Category" required />
                            )}
                        />

                        <Autocomplete
                            fullWidth
                            options={contractors}
                            value={contractor}
                            onChange={(_, newValue) => setContractor(newValue)}
                            renderInput={(params) => <TextField {...params} label="Contractor (optional)" />}
                        />
                    </Stack>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleShow}
                        disabled={loading || !selectedCategory} 
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
                                <div>
                                    <Typography variant="caption" color="text.secondary">Categories</Typography>
                                    <Typography fontWeight={500}>
                                        {selectedCategory || 'None'}
                                    </Typography>
                                </div>
                                <div>
                                    <Typography variant="caption" color="text.secondary">Contractor</Typography>
                                    <Typography>{contractor || 'All'}</Typography>
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

                        <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
                            <Table stickyHeader size="small">
                                <TableHead>

                                    {/* First Header Row */}
                                    <TableRow>

                                        {leftColumns.map((col) => (
                                            <TableCell
                                                key={col}
                                                rowSpan={2}
                                                align="center"
                                                sx={{
                                                    bgcolor: '#1976d2',
                                                    color: 'white',
                                                    fontWeight: 'bold',
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
                                                    bgcolor: '#1976d2',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                Shift
                                            </TableCell>
                                        )}

                                    </TableRow>

                                    {/* Second Header Row */}
                                    {shiftColumns.length > 0 && (
                                        <TableRow>
                                            {shiftColumns.map((col) => (
                                                <TableCell
                                                    key={col}
                                                    align="center"
                                                    sx={{
                                                        bgcolor: '#1976d2',
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {col}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    )}

                                </TableHead>
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

                                        filteredRows.map((row, index) => (
                                            <TableRow key={index} hover>

                                                {reportColumns.map((col) => (
                                                    <TableCell
                                                        key={col}
                                                        align="center"
                                                        sx={{ fontSize: 13 }}
                                                    >
                                                        {row[col] !== null && row[col] !== undefined
                                                            ? String(row[col])
                                                            : '—'}
                                                    </TableCell>
                                                ))}

                                            </TableRow>
                                        ))

                                    )}

                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}

export default ShiftWiseReport;