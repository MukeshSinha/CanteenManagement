import NavbarComponent from '../Components/Navbar/NavbarComponent';
import { Routes, Route } from 'react-router-dom';
import DailyCantinee from '../Components/DailyCantinee';
function App() {
  return (
      <>
          <NavbarComponent />
          <Routes>
              <Route path="/masters/employee-configuration" element={<DailyCantinee/>} />
          </Routes>
    </>
  )
}

export default App
