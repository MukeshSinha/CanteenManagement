import React, { useState, useRef } from "react";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./Navbar.css";

const NavbarComponent: React.FC = () => {

    const [showMasters, setShowMasters] = useState(false);
    const [showReports, setShowReports] = useState(false);
    const [showDailyMeal, setShowDailyMeal] = useState(false);
    const [showSummary, setShowSummary] = useState(false);

    const [showUser, setShowUser] = useState(false);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleUserEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowUser(true);
    };

    const handleUserLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setShowUser(false);
        }, 300);
    };

    return (
        <>
            {/* HEADER */}
            <header className="app-header shadow-sm">
                <Container
                    fluid
                    className="d-flex align-items-center justify-content-between px-3"
                >
                    <div className="header-logo">
                        <i className="bi bi-cup-hot-fill fs-2"></i>
                    </div>

                    <h4 className="header-title mb-0">Canteen Management</h4>

                    {/* USER PROFILE */}
                    <div
                        className="user-dropdown-wrapper"
                        onMouseEnter={handleUserEnter}
                        onMouseLeave={handleUserLeave}
                    >
                        <NavDropdown
                            show={showUser}
                            align="end"
                            id="user-dropdown"
                            menuVariant="dark"
                            className="user-dropdown"
                            title={
                                <div className="user-icon-wrapper">
                                    <i className="bi bi-person-circle fs-4"></i>
                                </div>
                            }
                        >
                            <NavDropdown.Item as={Link} to="/profile">
                                Profile
                            </NavDropdown.Item>

                            <NavDropdown.Item as={Link} to="/settings">
                                Settings
                            </NavDropdown.Item>

                            <NavDropdown.Divider />

                            <NavDropdown.Item as={Link} to="/logout" className="text-danger">
                                Logout
                            </NavDropdown.Item>
                        </NavDropdown>
                    </div>
                </Container>
            </header>

            {/* NAVBAR */}
            <Navbar expand="lg" variant="dark" className="main-navbar" sticky="top">
                <Container fluid>

                    <Navbar.Toggle />

                    <Navbar.Collapse>
                        <Nav className="me-auto">

                            {/* MASTERS */}
                            <NavDropdown
                                title="Masters"
                                show={showMasters}
                                onMouseEnter={() => setShowMasters(true)}
                                onMouseLeave={() => setShowMasters(false)}
                                menuVariant="dark"
                            >
                                <NavDropdown.Item as={Link} to="/masters/employee-configuration">
                                    Employee Configuration
                                </NavDropdown.Item>
                            </NavDropdown>


                            {/* REPORTS */}
                            <NavDropdown
                                title="Reports"
                                show={showReports}
                                onMouseEnter={() => setShowReports(true)}
                                onMouseLeave={() => setShowReports(false)}
                                menuVariant="dark"
                            >

                                {/* DAILY MEAL */}
                                <NavDropdown
                                    title="Daily Meal"
                                    drop="end"
                                    className="dropdown-submenu"
                                    show={showDailyMeal}
                                    onMouseEnter={() => setShowDailyMeal(true)}
                                    onMouseLeave={() => setShowDailyMeal(false)}
                                >
                                    <NavDropdown.Item as={Link} to="/reports/daily-meal/shift-wise">
                                        Shift Wise
                                    </NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to="/reports/daily-meal/date-wise">
                                        Date Wise
                                    </NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to="/reports/daily-meal/contractor-category">
                                        Contractor Category
                                    </NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to="/reports/daily-meal/Upload-Meal">
                                        Upload Meal
                                    </NavDropdown.Item>
                                </NavDropdown>


                                {/* SUMMARY */}
                                <NavDropdown
                                    title="Summary"
                                    drop="end"
                                    className="dropdown-submenu"
                                    show={showSummary}
                                    onMouseEnter={() => setShowSummary(true)}
                                    onMouseLeave={() => setShowSummary(false)}
                                >
                                    <NavDropdown.Item as={Link} to="/reports/summary/individual">
                                        Individual
                                    </NavDropdown.Item>

                                    <NavDropdown.Item as={Link} to="/reports/summary/contractor-wise">
                                        Contractor Wise
                                    </NavDropdown.Item>
                                </NavDropdown>

                            </NavDropdown>

                        </Nav>
                    </Navbar.Collapse>

                </Container>
            </Navbar>
        </>
    );
};

export default NavbarComponent;