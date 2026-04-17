// src/AppRouter.js

import { BrowserRouter, Routes, Route } from "react-router-dom";
import OnboardingScreen from "./Components/OnboardingScreen";
import App from "./App"; 
import MainPage from "./Components/MainPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnboardingScreen />} />
        <Route path="/dashboard" element={<MainPage />} />
      </Routes>
    </BrowserRouter>
  );
}