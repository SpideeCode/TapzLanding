import { Routes, Route, Link } from 'react-router-dom';
import { QrCode, LogOut } from 'lucide-react';
import { useEffect, useState, Suspense, lazy } from 'react';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { supabase } from './lib/supabase';
import { Loading } from './components/Loading';

// Eagerly loaded for landing performance
import Home from './pages/Home';
import Contact from './pages/Contact';

// Superadmin Pages - Lazy Loaded
const SuperAdminLayout = lazy(() => import('./components/layouts/SuperAdminLayout').then(module => ({ default: module.SuperAdminLayout })));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/DashboardOverview').then(module => ({ default: module.DashboardOverview })));
const RestaurantManagement = lazy(() => import('./pages/superadmin/Restaurants').then(module => ({ default: module.RestaurantManagement })));
const SuperAdminStaff = lazy(() => import('./pages/superadmin/Staff').then(module => ({ default: module.StaffManagement })));
const MenuManagement = lazy(() => import('./pages/superadmin/MenuManagement').then(module => ({ default: module.MenuManagement })));
const RestaurantManager = lazy(() => import('./pages/superadmin/RestaurantManager').then(module => ({ default: module.RestaurantManager })));
const ProductionQueue = lazy(() => import('./pages/superadmin/ProductionQueue').then(module => ({ default: module.ProductionQueue })));
const SystemTools = lazy(() => import('./pages/superadmin/SystemTools').then(module => ({ default: module.SystemTools })));

// Public Menu & Orders - Lazy Loaded (Optimization)
const PublicMenu = lazy(() => import('./pages/PublicMenu').then(module => ({ default: module.PublicMenu })));
const OrderSuccess = lazy(() => import('./pages/public/OrderSuccess').then(module => ({ default: module.OrderSuccess })));

// Admin Pages - Lazy Loaded
const AdminLayout = lazy(() => import('./components/layouts/AdminLayout').then(module => ({ default: module.AdminLayout })));
const AdminDashboardOverview = lazy(() => import('./pages/admin/DashboardOverview').then(module => ({ default: module.AdminDashboardOverview })));
const AdminTableManagement = lazy(() => import('./pages/admin/Tables').then(module => ({ default: module.TableManagement })));
const AdminMenuManagement = lazy(() => import('./pages/admin/MenuManagement').then(module => ({ default: module.MenuManagement })));
const RestaurantSettings = lazy(() => import('./pages/admin/RestaurantSettings').then(module => ({ default: module.RestaurantSettings })));
const PrintTables = lazy(() => import('./pages/admin/PrintTables').then(module => ({ default: module.PrintTables })));

// Staff Pages - Lazy Loaded
const StaffLayout = lazy(() => import('./components/layouts/StaffLayout').then(module => ({ default: module.StaffLayout })));
const StaffOrders = lazy(() => import('./pages/staff/LiveOrders').then(module => ({ default: module.LiveOrders })));
const OrderHistory = lazy(() => import('./pages/staff/OrderHistory').then(module => ({ default: module.OrderHistory })));
const StaffLogin = lazy(() => import('./pages/staff/StaffLogin').then(module => ({ default: module.StaffLogin })));
const GlobalStaffLogin = lazy(() => import('./pages/staff/GlobalStaffLogin').then(module => ({ default: module.GlobalStaffLogin })));

// Onboarding - Lazy Loaded
const OnboardingWizard = lazy(() => import('./pages/onboarding/OnboardingWizard').then(module => ({ default: module.OnboardingWizard })));
const OnboardingSuccess = lazy(() => import('./pages/onboarding/OnboardingSuccess').then(module => ({ default: module.OnboardingSuccess })));

import { StaffRoute } from './components/auth/StaffRoute';

function ScrollToTop() {
  // Scroll to top on route change unless it's an anchor link
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }
  return null;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const handleAuthStateChange = async (_event: any, session: any) => {
      try {
        setLoadingProfile(true);
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Profile fetch error:', error);
            setRole(null);
          } else {
            setRole(profile?.role ?? null);
          }
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error('Auth state change handler error:', err);
        setRole(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange('INITIAL', session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthStateChange(_event, session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      setRole(null);
      setUser(null);
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      // Fallback: force clear state and redirect
      localStorage.clear(); // Nuclear option
      window.location.href = '/';
    }
  };

  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen bg-[#0A0A0B] text-[#EAEAEA] font-sans flex flex-col">
        {/* Header (Hidden on Superadmin layout as it has its own) */}
        <Routes>
          <Route path="/superadmin/*" element={null} />
          <Route path="/admin/*" element={null} />
          <Route path="/staff/:slug/*" element={null} />
          <Route path="/login" element={null} />
          <Route path="/onboarding/*" element={null} />
          <Route path="/m/*" element={null} />
          <Route path="/order-success" element={null} />
          <Route path="*" element={
            <header className="container mx-auto px-6 py-6 transition-all duration-300">
              <nav className="flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                  <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center group-hover:bg-[#2563EB] transition-colors shadow-lg shadow-blue-500/20">
                    <QrCode className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-[#3B82F6] tracking-tight">
                    Tapzy
                  </span>
                </Link>
                <div className="flex items-center gap-4 md:gap-6">
                  <Link to="/contact" className="text-[#A0A0A0] hover:text-white transition-colors text-sm font-medium">
                    Contact
                  </Link>
                  {!loadingProfile && user && (
                    <Link
                      to={role === 'superadmin' ? '/superadmin' : '/admin'}
                      className="text-white hover:bg-white/10 transition-all text-sm font-bold flex items-center gap-2 border border-white/20 px-4 py-2 rounded-xl"
                    >
                      <QrCode size={16} />
                      Dashboard
                    </Link>
                  )}
                  {user ? (
                    <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                      <span className="text-sm text-gray-400 hidden sm:inline">{user.email}</span>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-1.5 text-red-400 hover:text-red-300 transition-colors text-sm font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Quitter</span>
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      className="px-5 py-2 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] hover:shadow-lg hover:shadow-blue-500/20 transition-all font-bold text-sm"
                    >
                      Connexion
                    </Link>
                  )}
                </div>
              </nav>
            </header>
          } />
        </Routes>

        {/* Main Content */}
        <main className="flex-grow">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/m/:slug" element={<PublicMenu />} />
              <Route path="/order-success" element={<OrderSuccess />} />

              {/* Onboarding Routes */}
              <Route path="/onboarding" element={<OnboardingWizard />} />
              <Route path="/onboarding/success" element={<OnboardingSuccess />} />

              {/* Superadmin Routes (Protected) */}
              <Route path="/superadmin/*" element={
                <ProtectedRoute requiredRole="superadmin">
                  <SuperAdminLayout>
                    <Routes>
                      <Route index element={<SuperAdminDashboard />} />
                      <Route path="restaurants" element={<RestaurantManagement />} />
                      <Route path="restaurant/:id/*" element={<RestaurantManager />} />
                      <Route path="staff" element={<SuperAdminStaff />} />
                      <Route path="studio" element={<ProductionQueue />} />
                      <Route path="tools" element={<SystemTools />} />
                      <Route path="menus" element={<MenuManagement />} />
                      <Route path="tables" element={<AdminTableManagement />} />
                    </Routes>
                  </SuperAdminLayout>
                </ProtectedRoute>
              } />

              <Route path="/admin/*" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <Routes>
                      <Route index element={<AdminDashboardOverview />} />
                      <Route path="menu" element={<AdminMenuManagement />} />
                      <Route path="tables" element={<AdminTableManagement />} />
                      <Route path="tables/print" element={<PrintTables />} />
                      <Route path="settings" element={<RestaurantSettings />} />
                      <Route path="orders" element={<StaffOrders />} />
                      <Route path="history" element={<OrderHistory />} />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              } />
              {/* Staff Routes (Protected) */}
              {/* Staff Routes */}
              <Route path="/staff/login" element={<GlobalStaffLogin />} />
              <Route path="/staff/:slug/login" element={<StaffLogin />} />

              <Route element={<StaffRoute />}>
                <Route path="/staff/:slug/*" element={
                  <StaffLayout>
                    <Routes>
                      <Route index element={<StaffOrders />} />
                      <Route path="history" element={<OrderHistory />} />
                    </Routes>
                  </StaffLayout>
                } />
              </Route>

            </Routes>
          </Suspense>
        </main>

        <Routes>
          <Route path="/superadmin/*" element={null} />
          <Route path="/admin/*" element={null} />
          <Route path="/staff/:slug/*" element={null} />
          <Route path="/login" element={null} />
          <Route path="/onboarding/*" element={null} />
          <Route path="/m/*" element={null} />
          <Route path="/order-success" element={null} />
          <Route path="*" element={
            <footer className="bg-[#0A0A0B] py-12 border-t border-[#1A1A1B]">
              <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">
                      Tapzy
                    </span>
                  </div>
                  <div className="text-gray-500 flex flex-wrap justify-center gap-8 text-sm">
                    <Link to="/contact" className="hover:text-[#3B82F6] transition-colors">Contact</Link>
                    <Link to="/staff/login" className="hover:text-[#3B82F6] transition-colors">Espace Staff</Link>
                    <Link to="/login" className="hover:text-[#3B82F6] transition-colors">Admin</Link>
                    <span>&copy; 2026 Tapzy. Tous droits réservés.</span>
                  </div>
                </div>
              </div>
            </footer>
          } />
        </Routes>
      </div>
    </>
  );
}
