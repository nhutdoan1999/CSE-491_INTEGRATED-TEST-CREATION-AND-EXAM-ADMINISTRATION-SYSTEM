// client/src/App.js
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/MainLayout';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import QuestionBankPage from './pages/QuestionBankPage';
import TestCreationPage from './pages/TestCreationPage';
import TestTakingPage from './pages/TestTakingPage';
import ResultsPage from './pages/ResultsPage';
import TestEditPage from './pages/TestEditPage';


function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });

  const handleLogin = ({ user, token }) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route
        path="/"
        element={
          <RequireAuth user={user}>
            <MainLayout user={user} onLogout={handleLogout} />
          </RequireAuth>
        }
      >
        <Route
          index
          element={
            user?.role === 'teacher' ? (
              <TeacherDashboard />
            ) : (
              <StudentDashboard />
            )
          }
        />
        <Route path="questions" element={<QuestionBankPage />} />
        <Route path="tests/create" element={<TestCreationPage />} />
        <Route path="tests/edit/:id" element={<TestEditPage />} />
        <Route path="take/:id" element={<TestTakingPage />} />
        <Route path="results" element={<ResultsPage user={user} />} />
      </Route>
    </Routes>
  );
}

export default App;
