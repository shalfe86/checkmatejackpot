
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Play } from './pages/Play';
import { Rules } from './pages/Rules';
import { Terms } from './pages/Terms';
import { Auth } from './pages/Auth';
import { AdminLayout } from './app/admin/layout';
import { WinnersPage } from './app/admin/winners/page';
import { AdminDashboard } from './app/admin/dashboard/page';
import { UsersPage } from './app/admin/users/page';
import { SettingsPage } from './app/admin/settings/page';
import { AuditPage } from './app/admin/audit/page';

// Fixed: Moved AdminRouteWrapper outside and made children optional to satisfy TypeScript JSX checks
const AdminRouteWrapper = ({ children }: { children?: React.ReactNode }) => (
  <div className="bg-background min-h-screen text-foreground font-sans">
     <AdminLayout>{children}</AdminLayout>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
           {/* Public Routes */}
           <Route path="/" element={<><Navbar/><main className="min-h-screen"><Home /></main><Footer/></>} />
           <Route path="/auth" element={<><Navbar/><main className="min-h-screen"><Auth /></main><Footer/></>} />
           <Route path="/dashboard" element={<><Navbar/><main className="min-h-screen"><Dashboard /></main><Footer/></>} />
           <Route path="/play" element={<><Navbar/><main className="min-h-screen"><Play /></main><Footer/></>} />
           <Route path="/rules" element={<><Navbar/><main className="min-h-screen"><Rules /></main><Footer/></>} />
           <Route path="/terms" element={<><Navbar/><main className="min-h-screen"><Terms /></main><Footer/></>} />

           {/* Admin Routes */}
           <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
           <Route path="/admin/dashboard" element={<AdminRouteWrapper><AdminDashboard /></AdminRouteWrapper>} />
           <Route path="/admin/winners" element={<AdminRouteWrapper><WinnersPage /></AdminRouteWrapper>} />
           <Route path="/admin/users" element={<AdminRouteWrapper><UsersPage /></AdminRouteWrapper>} />
           <Route path="/admin/audit" element={<AdminRouteWrapper><AuditPage /></AdminRouteWrapper>} />
           <Route path="/admin/settings" element={<AdminRouteWrapper><SettingsPage /></AdminRouteWrapper>} />
           
           <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
