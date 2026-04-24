// src/AppRouter.js

import { BrowserRouter, Routes, Route } from "react-router-dom";
import OnboardingScreen from "./Components/OnboardingScreen";
import App from "./App";
import MainPage from "./Components/MainPage";
import ProtectedRoute from "./ProtectedRoute";

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
      </Routes>
    </BrowserRouter>
  );
}
