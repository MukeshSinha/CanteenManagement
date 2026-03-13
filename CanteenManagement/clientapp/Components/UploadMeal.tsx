import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Autocomplete,
    TextField,
    Button,
    Typography,
} from '@mui/material';
import Swal from 'sweetalert2';

import '@sweetalert2/theme-material-ui/material-ui.css';

const UploadMeal = () => {
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [year, setYear] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sheetNo, setSheetNo] = useState<string>('');

    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const isExcel =
                file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.type === 'application/vnd.ms-excel' ||
                file.name.toLowerCase().endsWith('.xlsx') ||
                file.name.toLowerCase().endsWith('.xls');

            if (isExcel) {
                setSelectedFile(file);
            } else {
               
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid File!',
                    text: 'Only Excel file (.xlsx ya .xls) are allowed !!',
                    confirmButtonColor: '#d33',
                    confirmButtonText: 'OK',
                    //Optional: timer: 3000,  // auto close after 3 sec
                });
                e.target.value = ''; // reset file input
            }
        }
    };

    return (
        <Card sx={{ maxWidth: 700, mx: 'auto', mt: 5, boxShadow: 4, borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
                {/* Heading */}
                <Typography
                    variant="h4"
                    component="h1"
                    align="center"
                    gutterBottom
                    sx={{
                        fontWeight: 600,
                        color: 'primary.main',
                        mb: 4,
                    }}
                >
                    Upload Meal
                </Typography>

                {/* First Row: Month + Year */}
                <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
                    <Autocomplete
                        options={months}
                        value={selectedMonth}
                        onChange={(_, newValue) => setSelectedMonth(newValue)}
                        fullWidth
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="For the Month"
                                placeholder="Select month"
                                variant="outlined"
                            />
                        )}
                        sx={{ flex: 1 }}
                    />

                    <TextField
                        label="Year"
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        fullWidth
                        variant="outlined"
                        sx={{ flex: 1 }}
                        placeholder="e.g. 2025"
                    />
                </Box>

                {/* Second Row: File Upload + Sheet No */}
                <Box sx={{ display: 'flex', gap: 3, mb: 5, alignItems: 'flex-start' }}>
                    {/* Excel File Upload */}
                    <Box sx={{ flex: 1 }}>
                        <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{
                                height: '56px',
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                borderStyle: 'dashed',
                                borderWidth: 2,
                            }}
                        >
                            📤 Upload Excel File (only .xlsx / .xls)
                            <input
                                type="file"
                                hidden
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                            />
                        </Button>

                        {selectedFile && (
                            <Typography
                                variant="body2"
                                sx={{ mt: 1.5, color: 'success.main', fontWeight: 500 }}
                            >
                                ✅ Selected: {selectedFile.name}
                            </Typography>
                        )}
                    </Box>

                    {/* Sheet Number */}
                    <TextField
                        label="Sheet No"
                        type="number"
                        value={sheetNo}
                        onChange={(e) => setSheetNo(e.target.value)}
                        fullWidth
                        variant="outlined"
                        sx={{ flex: 1 }}
                        placeholder="e.g. 1"
                    />
                </Box>

                {/* Upload Button */}
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    sx={{ py: 1.8, fontSize: '1.2rem', fontWeight: 600 }}
                // Yaha pe apna upload logic daal dena
                // onClick={handleUpload}
                >
                    Upload Meal Data
                </Button>
            </CardContent>
        </Card>
    );
};

export default UploadMeal;