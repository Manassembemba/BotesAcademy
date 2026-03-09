import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import AdminLayout from "@/components/layout/AdminLayout";

// Statically imported for redirect stability
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";

// Lazy loaded pages
const Formations = lazy(() => import("./pages/Formations"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const AdminDashboard = lazy(() => import("./pages/Admin/Dashboard"));
const FormationEditor = lazy(() => import("./pages/Admin/FormationEditor"));
const PaymentValidation = lazy(() => import("./pages/Admin/PaymentValidation"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentStatus = lazy(() => import("./pages/PaymentStatus"));
const Profile = lazy(() => import("./pages/Profile"));
const StudentManagement = lazy(() => import("./pages/Admin/StudentManagement"));
const SiteSettings = lazy(() => import("./pages/Admin/SiteSettings"));
const Accounting = lazy(() => import("./pages/Admin/Accounting"));
const Attendance = lazy(() => import("./pages/Admin/Attendance"));
const ToolManagement = lazy(() => import("./pages/Admin/ToolManagement"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="w-full h-screen flex items-center justify-center">Chargement...</div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/formations" element={<Formations />} />
              <Route path="/formations/:id" element={<CourseDetail />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/update-password" element={<UpdatePassword />} />

              {/* Protected Student Route */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout/:id"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment-status/:proofId"
                element={
                  <ProtectedRoute>
                    <PaymentStatus />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes with Layout */}
              <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/formations/new" element={<FormationEditor />} />
                <Route path="/admin/formations/:id/edit" element={<FormationEditor />} />
                <Route path="/admin/payments" element={<PaymentValidation />} />
                <Route path="/admin/students" element={<StudentManagement />} />
                <Route path="/admin/tools" element={<ToolManagement />} />
                <Route path="/admin/settings" element={<SiteSettings />} />
                <Route path="/admin/accounting" element={<Accounting />} />
                <Route path="/admin/attendance" element={<Attendance />} />
              </Route>

              {/* Catch-all Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
