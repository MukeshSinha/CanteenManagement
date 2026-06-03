import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Divider,

}

    });


    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                }

                    });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
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
                </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.8, maxWidth: 600 }}>
                        Here is your canteen overview for today. View daily meals served, active meal schedules, and today's activity.
                    </Typography>
                </CardContent>
            </Card>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
                        <CircularProgress color="primary" size={50} />
                    </Box>
                ) : (
                    <>
                        {/* SMALL STATS CARDS */}
                        <Box
                            sx={{
                                gap: 3,
                                mb: 4,
                                alignItems: "flex-start",
                            }}
                        >
                            <Card
                                sx={{
                                    borderRadius: 3,
                                }}
                            >
                                    </Typography>
                                    </Typography>
                        <Chip label="Active Shift" color="success" size="small" sx={{ mt: 1.5, fontWeight: 600 }} />
                                </CardContent>
                            </Card>

                            <Card
                                sx={{
                                    borderRadius: 3,
                                }}
                            >
                                    </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 550 }}>TOA Attendance</Typography>
                                <Chip label={dashboardData.employeeStats?.toa ?? 0} size="small" variant="outlined" />
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 550 }}>NAPS Apprentices</Typography>
                                <Chip label={dashboardData.employeeStats?.naps ?? 0} size="small" variant="outlined" />
                            </Box>
                        </Box>
                                </CardContent>
                            </Card>
                        </Box>

                                    <CardContent>
                                            Daily Meal Consumption
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                            <BarChart
                                                series={[
                                                ]}
                                                height={300}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Col>

                                    <CardContent>
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                            />
                                    </CardContent>
                                </Card>
            </Box>
        </Fade>
    );
}

export default UserDashboard;
