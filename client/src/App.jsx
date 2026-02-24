import React, { useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/sidebar.jsx";
import Navbar from "./components/navbar.jsx";
import Footer from "./components/footer.jsx";
import Home from "./pages/homePage.jsx";
import Products from "./pages/productsPage.jsx";
import Admin from "./pages/admin.jsx";
import Provider from "./components/provider.jsx";
import AdminDashBoard from "./pages/adminDashBoard.jsx";
import AuthPage from "./pages/authPage.jsx";
import NotFound404Component from "./components/notFound404Component.jsx";
import { CheckAuth } from "./components/checkData.jsx";

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [auth, setAuth] = useState(CheckAuth() ? true : false);
  const toggle = (status) => {
    setIsOpen(status);
  };
  return (
    <Provider auth={auth}>
      <div id="loading"></div>
      <Router basename="/">
        <Sidebar
          isOpen={isOpen}
          auth={auth}
          setAuth={setAuth}
          toggle={toggle}
        />
        <Navbar toggle={toggle} auth={auth} setAuth={setAuth} />
        <Routes>
          <Route exact path="" element={<Home auth={auth} />} />
          <Route exact path="products" element={<Products />} />
          <Route exact path="admin" element={<Admin />} />
          <Route exact path="adminDashBoard" element={<AdminDashBoard />} />
          <Route
            exact
            path="authPage"
            element={<AuthPage setAuth={setAuth} />}
          />
          <Route exact path="*" element={<NotFound404Component />} />
        </Routes>
        <Footer />
      </Router>
    </Provider>
  );
}

export default App;
