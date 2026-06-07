import React, { useState, useEffect } from 'react';
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
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import {
    Search as SearchIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { apiFetch } from '../src/utils/api';
import Swal from 'sweetalert2';

const columnHeaderMap: Record<string, string> = {
    ezone: "Contractor Name",
    department: "Department",
    totalMeal: "Total Meal Qty",
    freeMeal: "Free Meal Qty",
    paidMeal: "Paid Meal Qty",
    tea: "Tea Qty",
    freeTea: "Free Tea Qty",
    paidTea: "Paid Tea Qty",
    fs: "FS Qty",
    freeFS: "Free FS Qty",
    paidFS: "Paid FS Qty",
    nb: "NB Qty",
    freeNB: "Free NB Qty",
    paidNB: "Paid NB Qty",
    mealAmount: "Meal Amt (Rs)",
    tea_Rs: "Tea Amt (Rs)",
    fS_RS: "FS Amt (Rs)",
    nB_RS: "NB Amt (Rs)",
    totalQty: "Total Qty",
    totalAmount: "Total Amt (Rs)"
};

interface ReportRow {
    ezone: string;
    department: string;
    totalMeal: number;
    freeMeal: number;
    paidMeal: number;
    tea: number;
    freeTea: number;
    paidTea: number;
    fs: number;
    freeFS: number;
    paidFS: number;
    nb: number;
    freeNB: number;
    paidNB: number;
    mealAmount: number;
    tea_Rs: number;
    fS_RS: number;
    nB_RS: number;
    [key: string]: any;
}

const ContractorDeptWiseSummary: React.FC = () => {
    const [fromDate, setFromDate] = useState<string>('');
    const [upToDate, setUpToDate] = useState<string>('');
    const [categories, setCategories] = useState<string[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [reportRows, setReportRows] = useState<ReportRow[]>([]);
    const [reportColumns, setReportColumns] = useState<string[]>([]);
    const [apiError, setApiError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showReport, setShowReport] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [categorySearch, setCategorySearch] = useState<string>('');

    // SweetAlert2 Toast configuration
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    const handleCategoryToggle = (category: string) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter(c => c !== category));
        } else {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

    const handleSelectAllCategories = () => {
        const visibleCats = categories.filter(cat =>
            cat.toLowerCase().includes(categorySearch.toLowerCase())
        );
        const allVisibleSelected = visibleCats.length > 0 && visibleCats.every(cat => selectedCategories.includes(cat));

        if (allVisibleSelected) {
            setSelectedCategories(selectedCategories.filter(cat => !visibleCats.includes(cat)));
        } else {
            const union = Array.from(new Set([...selectedCategories, ...visibleCats]));
            setSelectedCategories(union);
        }
    };

    useEffect(() => {
        const loadCategories = async () => {
            setCategoriesLoading(true);
            try {
                const response = await apiFetch('Category/get-category');
                let parsedResult = typeof response === 'string' ? JSON.parse(response) : response;
                const fetchedList = parsedResult?.dataFetch?.table
                    ?.map((item: any) => String(item.etype ?? '').trim())
                    ?.filter((name: string) => name) ?? [];
                setCategories(fetchedList);
            } catch (err) {
                console.error("Failed to load categories:", err);
            } finally {
                setCategoriesLoading(false);
            }
        };
        loadCategories();
    }, []);

    const fetchContractorDeptWiseReport = async (params: { fromDate: string; upToDate: string; category: string }) => {
        try {
            setApiError('');
            const queryString = new URLSearchParams({
                fromdate: params.fromDate,
                uptodate: params.upToDate,
                category: params.category,
            }).toString();

            const url = `Monthly-Meal/report-cont-deptWise?${queryString}`;
            let result = await apiFetch(url);

            if (typeof result === 'string') result = JSON.parse(result);

            const table = result?.dataFetch?.table || [];
            const columns = table.length > 0 ? Object.keys(table[0]) : [];

            return { rows: table, columns };
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load report';
            setApiError(msg);
            console.error(err);
            return { rows: [], columns: [] };
        }
    };

    const handleShow = async () => {
        if (!fromDate || !upToDate) {
            Toast.fire({
                icon: 'warning',
                title: 'Please select both From Date and Up To Date.'
            });
            return;
        }
        if (selectedCategories.length === 0) {
            Toast.fire({
                icon: 'warning',
                title: 'Please select at least one category.'
            });
            return;
        }

        setLoading(true);
        setShowReport(true);
        setApiError('');

        const params = {
            fromDate,
            upToDate,
            category: selectedCategories.join(','),
        };

        console.log('Fetching Contractor Dept Wise Report with params:', params);
        const { rows, columns } = await fetchContractorDeptWiseReport(params);

        setReportRows(rows);
        setReportColumns(columns);
        setLoading(false);
    };

    // Real-time search filter
    const filteredRows = reportRows.filter((row) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();

        // Search in base columns
        const inBaseColumns = reportColumns.some((col) =>
            String(row[col] ?? '').toLowerCase().includes(term)
        );

        // Also search in calculated columns
        const tQty = (Number(row.totalMeal) || 0) + (Number(row.tea) || 0) + (Number(row.fs) || 0) + (Number(row.nb) || 0);
        const tAmt = (Number(row.mealAmount) || 0) + (Number(row.tea_Rs) || 0) + (Number(row.fS_RS) || 0) + (Number(row.nB_RS) || 0);
        const inCalculated = String(tQty).includes(term) || String(tAmt).includes(term);

        return inBaseColumns || inCalculated;
    });

    // Helper functions for vertical totals
    const getVerticalTotal = (colKey: string): number | string => {
        if (['ezone', 'department'].includes(colKey)) {
            if (colKey === 'ezone') return 'Total';
            return '';
        }

        return filteredRows.reduce((sum, row) => {
            let val = 0;
            if (colKey === 'totalQty') {
                val = (Number(row.totalMeal) || 0) + (Number(row.tea) || 0) + (Number(row.fs) || 0) + (Number(row.nb) || 0);
            } else if (colKey === 'totalAmount') {
                val = (Number(row.mealAmount) || 0) + (Number(row.tea_Rs) || 0) + (Number(row.fS_RS) || 0) + (Number(row.nB_RS) || 0);
            } else {
                val = Number(row[colKey]) || 0;
            }
            return sum + val;
        }, 0);
    };

    const getFormattedVerticalTotal = (colKey: string): string => {
        const total = getVerticalTotal(colKey);
        if (typeof total === 'string') return total;
        if (['mealAmount', 'tea_Rs', 'fS_RS', 'nB_RS', 'totalAmount'].includes(colKey)) {
            return total.toFixed(2);
        }
        return String(total);
    };

    // Helper functions for group totals (per contractor)
    const getGroupTotal = (groupRows: ReportRow[], colKey: string): number | string => {
        if (['ezone', 'department'].includes(colKey)) {
            if (colKey === 'ezone') return groupRows[0]?.ezone || '';
            return 'Subtotal';
        }

        return groupRows.reduce((sum, row) => {
            let val = 0;
            if (colKey === 'totalQty') {
                val = (Number(row.totalMeal) || 0) + (Number(row.tea) || 0) + (Number(row.fs) || 0) + (Number(row.nb) || 0);
            } else if (colKey === 'totalAmount') {
                val = (Number(row.mealAmount) || 0) + (Number(row.tea_Rs) || 0) + (Number(row.fS_RS) || 0) + (Number(row.nB_RS) || 0);
            } else {
                val = Number(row[colKey]) || 0;
            }
            return sum + val;
        }, 0);
    };

    const getFormattedGroupTotal = (groupRows: ReportRow[], colKey: string): string => {
        const total = getGroupTotal(groupRows, colKey);
        if (typeof total === 'string') return total;
        if (['mealAmount', 'tea_Rs', 'fS_RS', 'nB_RS', 'totalAmount'].includes(colKey)) {
            return total.toFixed(2);
        }
        return String(total);
    };

    // Group filteredRows by ezone
    const getGroupedRows = (rows: ReportRow[]) => {
        return rows.reduce((acc, row) => {
            const key = row.ezone || 'Unknown';
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(row);
            return acc;
        }, {} as Record<string, ReportRow[]>);
    };

    // Export utilities
    const getExportData = () => {
        const displayColumns = [...reportColumns, 'totalQty', 'totalAmount'];

        // Headers
        const headers = displayColumns.map(col => columnHeaderMap[col] || col);

        const grouped = getGroupedRows(filteredRows);
        const dataRows: any[][] = [];

        Object.keys(grouped).forEach(ezoneKey => {
            const groupRows = grouped[ezoneKey];

            // 1. Group Header Row
            const groupHeaderRow = displayColumns.map(col => getFormattedGroupTotal(groupRows, col));
            dataRows.push(groupHeaderRow);

            // 2. Detail Rows
            groupRows.forEach(row => {
                const tQty = (Number(row.totalMeal) || 0) + (Number(row.tea) || 0) + (Number(row.fs) || 0) + (Number(row.nb) || 0);
                const tAmt = (Number(row.mealAmount) || 0) + (Number(row.tea_Rs) || 0) + (Number(row.fS_RS) || 0) + (Number(row.nB_RS) || 0);

                const detailRow = displayColumns.map(col => {
                    if (col === 'totalQty') return tQty;
                    if (col === 'totalAmount') return tAmt;
                    if (col === 'ezone') return ''; // blank out contractor name to match hierarchical view
                    return row[col] !== null && row[col] !== undefined ? row[col] : '';
                });
                dataRows.push(detailRow);
            });
        });

        // Total Row
        const totalRow = displayColumns.map(col => getFormattedVerticalTotal(col));

        return [headers, ...dataRows, totalRow];
    };

    const exportToCSV = () => {
        if (filteredRows.length === 0) return;
        const exportData = getExportData();
        const csvContent = exportData.map(row =>
            row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
        ).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `ContractorDeptWiseReport_${fromDate || 'from'}_to_${upToDate || 'to'}.csv`);
    };

    const exportToExcel = () => {
        if (filteredRows.length === 0) return;
        const exportData = getExportData();
        const ws = XLSX.utils.aoa_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Contractor Dept Wise');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, `ContractorDeptWiseReport_${fromDate || 'from'}_to_${upToDate || 'to'}.xlsx`);
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Box 
                sx={{
                    background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)',
                    color: 'white',
                    p: 3,
                    borderRadius: 3,
                    mb: 4,
                    boxShadow: '0 4px 20px rgba(30, 60, 114, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Typography 
                    variant="h4" 
                    fontWeight={400} 
                    sx={{ 
                        letterSpacing: '-0.5px',
                        m: 0,
                        textAlign: 'center'
                    }}
                >
                    Contractor and Dept. wise Summary
                </Typography>
            </Box>

            <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                    {/* Row 1: Date Range Selection */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            label="From Date"
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            slotProps={{
                                inputLabel: { shrink: true },
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
                            }}
                        />
                    </Stack>

                    {/* Row 2: Category List Box with Checkboxes */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#455a64' }}>
                            Categories Filter
                        </Typography>
                        <TextField
                            size="small"
                            placeholder="Search category..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            sx={{ width: 200, bgcolor: 'white' }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ fontSize: 18 }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Stack>
                    <Box sx={{
                        border: '1px solid #cfd8dc',
                        borderRadius: 2,
                        p: 2.5,
                        maxHeight: '180px',
                        overflowY: 'auto',
                        bgcolor: '#fafafa',
                        mb: 3
                    }}>
                        {categoriesLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                                <CircularProgress size={30} />
                            </Box>
                        ) : (
                            <>
                                <Box sx={{ mb: 1, borderBottom: '1px solid #eceff1', pb: 1 }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={
                                                    (() => {
                                                        const visible = categories.filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()));
                                                        return visible.length > 0 && visible.every(cat => selectedCategories.includes(cat));
                                                    })()
                                                }
                                                indeterminate={
                                                    (() => {
                                                        const visible = categories.filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()));
                                                        const selectedCount = visible.filter(cat => selectedCategories.includes(cat)).length;
                                                        return selectedCount > 0 && selectedCount < visible.length;
                                                    })()
                                                }
                                                onChange={handleSelectAllCategories}
                                                color="primary"
                                                size="small"
                                            />
                                        }
                                        label={<Typography variant="body2" fontWeight="bold">Select All Categories</Typography>}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                    {categories
                                        .filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                                        .map((cat) => (
                                            <Box key={cat} sx={{ minWidth: { xs: '100px', sm: '130px' } }}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={selectedCategories.includes(cat)}
                                                            onChange={() => handleCategoryToggle(cat)}
                                                            color="primary"
                                                            size="small"
                                                        />
                                                    }
                                                    label={<Typography variant="body2" sx={{ color: '#37474f' }}>{cat}</Typography>}
                                                />
                                            </Box>
                                        ))}
                                </Box>
                            </>
                        )}
                    </Box>

                    {/* Row 3: Action Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleShow}
                            disabled={loading}
                            sx={{
                                px: 4,
                                py: 1.2,
                                borderRadius: 2,
                                fontWeight: 'bold',
                                textTransform: 'none',
                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Show Report'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {showReport && (
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, borderLeft: '5px solid #1976d2' }}>
                            <Stack direction="row" spacing={4} flexWrap="wrap">
                                <div>
                                    <Typography variant="caption" color="text.secondary">From</Typography>
                                    <Typography fontWeight="bold" sx={{ color: '#0d47a1' }}>{fromDate || '—'}</Typography>
                                </div>
                                <div>
                                    <Typography variant="caption" color="text.secondary">To</Typography>
                                    <Typography fontWeight="bold" sx={{ color: '#0d47a1' }}>{upToDate || '—'}</Typography>
                                </div>
                                <div>
                                    <Typography variant="caption" color="text.secondary">Selected Categories</Typography>
                                    <Typography fontWeight="bold" sx={{ color: '#0d47a1' }}>
                                        {selectedCategories.length === categories.length ? 'All' : selectedCategories.join(', ') || 'None'}
                                    </Typography>
                                </div>
                            </Stack>
                        </Box>

                        {apiError && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {apiError}
                            </Alert>
                        )}

                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={2}
                            sx={{ mb: 3 }}
                        >
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search anywhere in report..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{ maxWidth: { md: 350 } }}
                            />

                            <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' }, justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<DownloadIcon />}
                                    onClick={exportToCSV}
                                    disabled={filteredRows.length === 0}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}
                                >
                                    Export CSV
                                </Button>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<DownloadIcon />}
                                    onClick={exportToExcel}
                                    disabled={filteredRows.length === 0}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold', boxShadow: '0 4px 10px rgba(76, 175, 80, 0.2)' }}
                                >
                                    Export Excel
                                </Button>
                            </Stack>
                        </Stack>

                        <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        {[...reportColumns, 'totalQty', 'totalAmount'].map((col) => (
                                            <TableCell
                                                key={col}
                                                align="center"
                                                sx={{
                                                    bgcolor: '#1976d2',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    py: 1.5,
                                                    fontSize: 14,
                                                    borderRight: '1px solid #1565c0',
                                                    minWidth: col === 'ezone' || col === 'department' ? 180 : 100
                                                }}
                                            >
                                                {columnHeaderMap[col] || col}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={reportColumns.length + 2 || 12}
                                                align="center"
                                                sx={{ py: 8 }}
                                            >
                                                <CircularProgress />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={reportColumns.length + 2 || 12}
                                                align="center"
                                                sx={{ py: 6, color: 'text.secondary' }}
                                            >
                                                No records found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <>
                                            {/* Grouped Rows */}
                                            {(() => {
                                                const grouped = getGroupedRows(filteredRows);
                                                return Object.keys(grouped).map((ezoneKey) => {
                                                    const groupRows = grouped[ezoneKey];
                                                    return (
                                                        <React.Fragment key={ezoneKey}>
                                                            {/* Group Header / Subtotal Row */}
                                                            <TableRow sx={{ bgcolor: '#e3f2fd', '& td': { fontWeight: 'bold', fontSize: 13, py: 1 } }}>
                                                                {[...reportColumns, 'totalQty', 'totalAmount'].map((col) => {
                                                                    const formattedVal = getFormattedGroupTotal(groupRows, col);
                                                                    return (
                                                                        <TableCell
                                                                            key={`group-total-${col}`}
                                                                            align="center"
                                                                            sx={{
                                                                                borderRight: '1px solid #e0e0e0',
                                                                                bgcolor: col === 'totalAmount' ? '#efebe9' : col === 'totalQty' ? '#f5f5f5' : 'inherit',
                                                                                color: col === 'totalAmount' ? '#5d4037' : 'inherit',
                                                                                fontWeight: 'bold',
                                                                                fontSize: 13,
                                                                                py: 1
                                                                            }}
                                                                        >
                                                                            {formattedVal}
                                                                        </TableCell>
                                                                    );
                                                                })}
                                                            </TableRow>
                                                            {/* Group Detail Rows */}
                                                            {groupRows.map((row, index) => {
                                                                const tQty = (Number(row.totalMeal) || 0) + (Number(row.tea) || 0) + (Number(row.fs) || 0) + (Number(row.nb) || 0);
                                                                const tAmt = (Number(row.mealAmount) || 0) + (Number(row.tea_Rs) || 0) + (Number(row.fS_RS) || 0) + (Number(row.nB_RS) || 0);

                                                                return (
                                                                    <TableRow key={`${ezoneKey}-${index}`} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fcfcfc' } }}>
                                                                        {reportColumns.map((col) => {
                                                                            let displayVal = row[col] !== null && row[col] !== undefined ? String(row[col]) : '—';
                                                                            if (col === 'ezone') {
                                                                                displayVal = ''; // blank out contractor name to match hierarchical view
                                                                            }
                                                                            return (
                                                                                <TableCell
                                                                                    key={col}
                                                                                    align="center"
                                                                                    sx={{ fontSize: 13, py: 1, borderRight: '1px solid #f0f0f0' }}
                                                                                >
                                                                                    {displayVal}
                                                                                </TableCell>
                                                                            );
                                                                        })}
                                                                        {/* Horizontal computed Total Qty */}
                                                                        <TableCell
                                                                            align="center"
                                                                            sx={{ fontSize: 13, py: 1, fontWeight: 'bold', bgcolor: '#f5f5f5', borderRight: '1px solid #e0e0e0' }}
                                                                        >
                                                                            {tQty}
                                                                        </TableCell>
                                                                        {/* Horizontal computed Total Amt */}
                                                                        <TableCell
                                                                            align="center"
                                                                            sx={{ fontSize: 13, py: 1, fontWeight: 'bold', bgcolor: '#efebe9', color: '#5d4037' }}
                                                                        >
                                                                            {tAmt.toFixed(2)}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                });
                                            })()}

                                            {/* Vertical Total Row (Footer) */}
                                            <TableRow sx={{ bgcolor: '#eceff1', '& td': { fontWeight: 'bold', fontSize: 13, py: 1.5 } }}>
                                                {[...reportColumns, 'totalQty', 'totalAmount'].map((col) => (
                                                    <TableCell
                                                        key={`total-${col}`}
                                                        align="center"
                                                        sx={{
                                                            borderTop: '2px solid #b0bec5',
                                                            borderRight: '1px solid #cfd8dc',
                                                            bgcolor: col === 'totalAmount' ? '#d7ccc8' : col === 'totalQty' ? '#cfd8dc' : 'inherit',
                                                            color: col === 'totalAmount' ? '#4e342e' : 'inherit'
                                                        }}
                                                    >
                                                        {getFormattedVerticalTotal(col)}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default ContractorDeptWiseSummary;
