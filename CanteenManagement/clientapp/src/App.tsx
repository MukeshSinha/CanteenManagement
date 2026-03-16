import NavbarComponent from '../Components/Navbar/NavbarComponent';
import { Routes, Route} from 'react-router-dom';
//import DailyCantinee from '../Components/DailyCantinee';
import CanteenDashboard from '../Components/CanteenDashboard';
import ShiftWiseReport from '../Components/ShiftWiseReport';
import DateWiseReport from '../Components/DateWiseReport';
import ContractorCategory from '../Components/ContractorCategory';
import UploadMeal from '../Components/UploadMeal';
import ItemMaster from '../Components/ItemMaster';
function App() {
    
  return (
      <>
          <NavbarComponent />
          <Routes>
              <Route path="/" element={<CanteenDashboard />} />
              <Route path="/masters/Item-Master" element={<ItemMaster />} />
              <Route path="reports">
                  <Route path="daily-meal">
                      <Route path="shift-wise" element={<ShiftWiseReport />} />
                      <Route path="date-wise" element={<DateWiseReport />} />
                      <Route path="contractor-category" element={<ContractorCategory />} />
                      <Route path="Upload-Meal" element={<UploadMeal />} />
                  </Route>
              </Route>
          </Routes>
    </>
  )
}

export default App
