import React from "react";
import { Box, Typography, Paper } from "@mui/material";

const ContractorWiseMealSummary: React.FC = () => {
    return (
        <Box sx={{ p: 3, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
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
                    Contractor Wise Meal Summary
                </Typography>
            </Box>

            <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="body1" color="text.secondary">
                    This section will display the contractor wise meal summary.
                </Typography>
            </Paper>
        </Box>
    );
};

export default ContractorWiseMealSummary;
