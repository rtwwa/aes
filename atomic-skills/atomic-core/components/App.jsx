import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@core/hooks/useAuth";
import { Layout } from "@core/layouts/MainLayout";

// Import pages
import Login from "@features/auth/pages/Login";
import UserManagement from "@features/users/pages/UserManagement";
import TestManagement from "@features/tests/pages/TestManagement";
import TestTaking from "@features/tests/pages/TestTaking";
import TestDashboard from "@features/tests/pages/TestDashboard";
import UserProgress from "@features/reports/pages/UserProgress";

import "@core/styles/tailwind.css";

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />{" "}
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/my-tests" replace />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/tests" element={<TestManagement />} />
            <Route path="/take-test/:testId" element={<TestTaking />} />
            <Route path="/my-tests" element={<TestDashboard />} />
            <Route path="/user-progress" element={<UserProgress />} />
            <Route path="*" element={<Navigate to="/my-tests" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
