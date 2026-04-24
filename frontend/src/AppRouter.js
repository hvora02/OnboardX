// src/AppRouter.js

import { BrowserRouter, Routes, Route } from "react-router-dom";
import OnboardingScreen from "./Components/OnboardingScreen";
import App from "./App";
import MainPage from "./Components/MainPage";
import ProtectedRoute from "./ProtectedRoute";
import AdminAnalytics from "./Components/AdminAnalytics";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnboardingScreen />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          }
        />
        <Route path="/admin" element={<AdminAnalytics />} />
      </Routes>
    </BrowserRouter>
  );
}
