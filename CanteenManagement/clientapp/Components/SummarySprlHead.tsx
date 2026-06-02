import React from "react";
import { Box, Typography, Paper } from "@mui/material";

const SummarySprlHead: React.FC = () => {
    return (
        <Box sx={{ p: 4, bgcolor: "#f5f7fa", minHeight: "92vh" }}>
            <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                    Summary SPRL Head
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    This section will display the summary report for SPRL Head.
                </Typography>
            </Paper>
        </Box>
    );
};

export default SummarySprlHead;
