// src/Components/Navbar/NavbarComponent.tsx
import React, { useState } from "react";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

import "./Navbar.css";

const NavbarComponent: React.FC = () => {
    const [showMasters, setShowMasters] = useState<boolean>(false);
    const [showReports, setShowReports] = useState<boolean>(false);
    const [showDailyMeal, setShowDailyMeal] = useState<boolean>(false);
    const [showSummary, setShowSummary] = useState<boolean>(false);
    const [showUser, setShowUser] = useState<boolean>(false);

    return (
        <Navbar expand="lg" variant="dark" className="shadow-lg" sticky="top">
            <Container fluid>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />

                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {/* Masters */}
                        <NavDropdown
                            title="Masters"
                            id="masters-dropdown"
                            show={showMasters}
                            onMouseEnter={() => setShowMasters(true)}
                            onMouseLeave={() => setShowMasters(false)}
                            menuVariant="dark"
                        >
                            <NavDropdown.Item as={Link} to="/masters/employee-configuration">
                                Employee Configuration
                            </NavDropdown.Item>
                        </NavDropdown>

                        {/* Reports */}
                        <NavDropdown
                            title="Reports"
                            id="reports-dropdown"
                            show={showReports}
                            onMouseEnter={() => setShowReports(true)}
                            onMouseLeave={() => setShowReports(false)}
                            menuVariant="dark"
                        >
                            <NavDropdown
                                title="Daily Meal"
                                id="daily-meal-dropdown"
                                show={showDailyMeal}
                                onMouseEnter={() => setShowDailyMeal(true)}
                                onMouseLeave={() => setShowDailyMeal(false)}
                                drop="end"
                                className="dropdown-submenu"
                            >
                                <NavDropdown.Item
                                    as={Link}
                                    to="/reports/daily-meal/shift-wise"
                                >
                                    Shift Wise
                                </NavDropdown.Item>
                                <NavDropdown.Item
                                    as={Link}
                                    to="/reports/daily-meal/contractor-wise"
                                >
                                    Contractor Wise
                                </NavDropdown.Item>
                                <NavDropdown.Item
                                    as={Link}
                                    to="/reports/daily-meal/date-wise"
                                >
                                    Date Wise
                                </NavDropdown.Item>
                            </NavDropdown>

                            <NavDropdown
                                title="Summary"
                                id="summary-dropdown"
                                show={showSummary}
                                onMouseEnter={() => setShowSummary(true)}
                                onMouseLeave={() => setShowSummary(false)}
                                drop="end"
                                className="dropdown-submenu"
                            >
                                <NavDropdown.Item as={Link} to="/reports/summary/individual">
                                    Individual
                                </NavDropdown.Item>
                                <NavDropdown.Item
                                    as={Link}
                                    to="/reports/summary/contractor-wise"
                                >
                                    Contractor Wise
                                </NavDropdown.Item>
                            </NavDropdown>
                        </NavDropdown>
                    </Nav>

                    {/* Right side - User icons */}
                    <Nav className="ms-auto">
                        <NavDropdown
                            title={
                                <div className="user-icon-wrapper">
                                    <i className="bi bi-person-circle fs-4"></i>
                                </div>
                            }
                            id="user-dropdown"
                            show={showUser}
                            onMouseEnter={() => setShowUser(true)}
                            onMouseLeave={() => setShowUser(false)}
                            align="end"
                            menuVariant="dark"
                            className="user-dropdown"
                        >
                            <NavDropdown.Item as={Link} to="/profile">
                                Profile
                            </NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/settings">
                                Settings
                            </NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item
                                as={Link}
                                to="/logout"
                                className="text-danger fw-medium"
                            >
                                Logout
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default NavbarComponent;