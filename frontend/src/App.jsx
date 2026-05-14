import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import AlertPage from "./AlertPage";
import StartPage from "./StartPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/main/:placeId/:moduleNum" element={<Home />} />
        <Route path="/alerts" element={<AlertPage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
