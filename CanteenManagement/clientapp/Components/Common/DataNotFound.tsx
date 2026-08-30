import React from 'react';
import { Card, CardContent, Box, Typography, Button } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import RefreshIcon from '@mui/icons-material/Refresh';

interface DataNotFoundProps {
    title?: string;
    message?: string;
    onReset?: () => void;
}

const DataNotFound: React.FC<DataNotFoundProps> = ({
    title = "Data Not Found",
    message = "No records found matching your selected date range or filter criteria. Please adjust your filters and try again.",
    onReset
}) => {
    return (
        <Card 
            sx={{ 
                borderRadius: 3, 
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)', 
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
                mt: 3,
                mb: 3,
                overflow: 'hidden'
            }}
        >
            <CardContent sx={{ p: 5, textAlign: 'center' }}>
                <Box 
                    sx={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        bgcolor: '#fef2f2', 
                        color: '#ef4444', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2.5,
                        boxShadow: '0 0 0 10px rgba(239, 68, 68, 0.08)'
                    }}
                >
                    <SearchOffIcon sx={{ fontSize: 44 }} />
                </Box>

                <Typography variant="h5" fontWeight={700} sx={{ color: '#1e293b', mb: 1, letterSpacing: '-0.3px' }}>
                    {title}
                </Typography>

                <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 480, mx: 'auto', mb: onReset ? 3 : 0, lineHeight: 1.6 }}>
                    {message}
                </Typography>

                {onReset && (
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={onReset}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            color: '#475569',
                            borderColor: '#cbd5e1',
                            '&:hover': {
                                borderColor: '#94a3b8',
                                bgcolor: '#f8fafc'
                            }
                        }}
                    >
                        Reset Filters
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default DataNotFound;
