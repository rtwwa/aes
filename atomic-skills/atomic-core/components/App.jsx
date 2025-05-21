import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@core/hooks/useAuth";
import { Layout } from "@core/layouts/MainLayout";

// Import pages
import Dashboard from "@features/skills/pages/Dashboard";
import Login from "@features/auth/pages/Login";
import SkillMatrix from "@features/skills/pages/SkillMatrix";
import AssessmentList from "@features/assessments/pages/AssessmentList";
import Reports from "@features/reports/pages/Reports";

import "@core/styles/tailwind.css";

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/skills" element={<SkillMatrix />} />
            <Route path="/assessments" element={<AssessmentList />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
