import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Verify2FA from './pages/Verify2FA';
import VerifyEmail from './pages/VerifyEmail';
import UserHome from './pages/UserHome';
import SetupMFA from './pages/SetupMFA';
import { AuthProvider } from './context/AuthContext';
import About from './pages/About';
import Profile from './pages/Profile';
import WriteBlog from './pages/WriteBlog';
import PublicHome from './pages/PublicHome';
import Explore from './pages/Explore';
import AdminDashboard from './pages/AdminDashboard';
import BlogView from './pages/BlogView';
import EditBlog from './pages/EditBlog';

import Home from './pages/Home';
import PublicRoute from './components/PublicRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col">
          <Header />
          <Routes>            
            <Route path="/" element={<PublicHome />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/verify-2fa" element={<Verify2FA />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/setup-mfa" element={<SetupMFA />} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><UserHome /></PrivateRoute>} />
            <Route path="/my-blogs" element={<PrivateRoute><UserHome key="my-blogs" defaultTab="my" /></PrivateRoute>} />
            <Route path="/write" element={<PrivateRoute><WriteBlog /></PrivateRoute>} />
            <Route path="/blogs/:id" element={<BlogView />} />
          <Route path="/edit/:id" element={<PrivateRoute><EditBlog /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          </Routes>
          <Footer />
        </div>
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;