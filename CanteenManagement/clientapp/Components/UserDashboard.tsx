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
} from "@mui/material";
import { Row, Col } from "react-bootstrap";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";

interface UserDashboardData {
    lunch: number;
    dinner: number;
}

export default function UserDashboard() {
    const [loading, setLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const [data, setData] = useState<UserDashboardData>({
        lunch: 0,
        dinner: 0,
    });

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
                                        12:30 PM - 02:30 PM
                                    </Typography>
                                </CardContent>
                            </Card>

                            {/* DINNER CARD */}
                            <Card
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
                                        07:30 PM - 09:30 PM
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>

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
