import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PortalLayout from './layouts/PortalLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import './index.css';

// Lazy-loaded pages for rapid initial load and code splitting
const HotelListing = lazy(() => import('./pages/HotelListing'));
const HotelDetail = lazy(() => import('./pages/HotelDetail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Flights = lazy(() => import('./pages/Flights'));
const FlightListing = lazy(() => import('./pages/FlightListing'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const BookingDetail = lazy(() => import('./pages/BookingDetail'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AgencyApplicationPage = lazy(() => import('./pages/AgencyApplicationPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const CheckoutGuestDetails = lazy(() => import('./pages/CheckoutGuestDetails'));
const CheckoutPayment = lazy(() => import('./pages/CheckoutPayment'));
const CheckoutResult = lazy(() => import('./pages/CheckoutResult'));
const MyOffice = lazy(() => import('./pages/MyOffice'));
const MarkupManagement = lazy(() => import('./pages/MarkupManagement'));
const GSAAgencyManagement = lazy(() => import('./pages/GSAAgencyManagement'));
const SubAgencyMarkups = lazy(() => import('./pages/SubAgencyMarkups'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const TransactionDetailPage = lazy(() => import('./pages/TransactionDetailPage'));
const LimitManagementPage = lazy(() => import('./pages/LimitManagementPage'));
const UnderConstruction = lazy(() => import('./pages/UnderConstruction'));
const VoucherPage = lazy(() => import('./pages/VoucherPage'));
const B2BTaskList = lazy(() => import('./pages/B2BTaskList'));
const B2BTaskDetail = lazy(() => import('./pages/B2BTaskDetail'));
const ForbiddenPage = lazy(() => import('./pages/ForbiddenPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh] w-full">
    <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

const OptionalPortalLayout = () => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? (
    <PortalLayout />
  ) : (
    <div className="min-h-screen flex flex-col">
      <Outlet />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <FavoritesProvider>
          <div className="bg-background-light dark:bg-background-dark min-h-screen transition-colors duration-200">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/agency-application" element={<AgencyApplicationPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Portal Routes with Persistent Sidebar */}
                <Route element={<ProtectedRoute><PortalLayout /></ProtectedRoute>}>
                  <Route path="/travel/hotels/detail/:slug" element={<HotelDetail />} />
                  <Route path="/travel/hotels/detail" element={<Navigate to="/travel/hotels/search" replace />} />
                  <Route path="/hotel/:slug" element={<HotelDetail />} />
                  <Route path="/hotels" element={<Navigate to="/travel/hotels/search" replace />} />
                  <Route path="/travel/hotels" element={<Dashboard />} />
                  <Route path="/travel/hotels/search" element={<HotelListing />} />
                  <Route path="/travel/hotels/search/*" element={<HotelListing />} />
                  <Route path="/travel/hotels/search/theme/:theme" element={<HotelListing />} />
                  <Route path="/travel/hotels/search/campaign/:campaign" element={<HotelListing />} />
                  <Route path="/travel/search" element={<Navigate to="/travel/hotels" replace />} />
                  <Route path="/dashboard" element={<Navigate to="/travel/hotels" replace />} />
                  <Route path="/travel/bookings" element={<MyBookings />} />
                  <Route path="/travel/hotels/bookings" element={<MyBookings />} />
                  <Route path="/travel/hotels/bookings/:bookingId" element={<BookingDetail />} />
                  <Route path="/bookings" element={<Navigate to="/travel/hotels/bookings" replace />} />
                  <Route path="/bookings/:bookingId" element={<BookingDetail />} />
                  <Route path="/travel/flights/bookings" element={<UnderConstruction title="Flight Bookings" icon="flight" />} />
                  <Route path="/my-office" element={<MyOffice />} />
                  <Route path="/definitions/markup" element={<MarkupManagement />} />
                  
                  {/* Header tab & Google travel routes */}
                  <Route path="/travel/explore" element={<UnderConstruction titleKey="nav.explore" title="Keşfet" icon="travel_explore" />} />
                  <Route path="/explore" element={<Navigate to="/travel/explore" replace />} />
                  <Route path="/travel/flights/search" element={<FlightListing />} />
                  <Route path="/flights/search" element={<Navigate to="/travel/flights/search" replace />} />
                  <Route path="/travel/flights" element={<Flights />} />
                  <Route path="/flights" element={<Navigate to="/travel/flights" replace />} />
                  <Route path="/travel/transfer" element={<UnderConstruction titleKey="nav.transfer" title="Transfer" icon="airport_shuttle" />} />
                  <Route path="/transfer" element={<Navigate to="/travel/transfer" replace />} />
                  <Route path="/travel/rent-a-car" element={<UnderConstruction titleKey="nav.rentACar" title="Rent A Car" icon="directions_car" />} />
                  <Route path="/rent-a-car" element={<Navigate to="/travel/rent-a-car" replace />} />
                  <Route path="/travel/vacation-rentals" element={<UnderConstruction titleKey="nav.vacationRentals" title="Kiralık Yerler" icon="home_work" />} />
                  <Route path="/vacation-rentals" element={<Navigate to="/travel/vacation-rentals" replace />} />
                  <Route path="/flight-deals" element={<UnderConstruction title="Uçuş Fırsatları" icon="auto_awesome" />} />
                  <Route path="/tracked-flight-prices" element={<UnderConstruction title="Takip Edilen Uçuş Fiyatları" icon="show_chart" />} />

                  <Route path="/finance" element={<FinancePage />} />
                  <Route path="/finance/transactions/detail" element={<TransactionDetailPage />} />
                  <Route path="/finance/limits" element={<LimitManagementPage />} />
                  <Route path="/accounting" element={<UnderConstruction title="Accounting" icon="analytics" />} />
                  
                  {/* Talep Yönetimi / Task Management Routes */}
                  <Route path="/task-management" element={<B2BTaskList />} />
                  <Route path="/task-management/:id" element={<B2BTaskDetail />} />
                  <Route path="/operations" element={<Navigate to="/task-management" replace />} />
                  <Route path="/operations/requests" element={<Navigate to="/task-management" replace />} />
                  <Route path="/operations/requests/:id" element={<B2BTaskDetail />} />
                  <Route path="/operations/tasks" element={<Navigate to="/task-management" replace />} />
                  <Route path="/operations/tasks/:id" element={<B2BTaskDetail />} />
                  
                  <Route path="/subagency/agency" element={<GSAAgencyManagement />} />
                  <Route path="/subagency/markups" element={<SubAgencyMarkups />} />
                  <Route path="/subagency/finance" element={<UnderConstruction title="GSA Finance" icon="attach_money" />} />
                  <Route path="/subagency/reports" element={<UnderConstruction title="GSA Reports" icon="assessment" />} />

                  {/* Checkout Flow */}
                  <Route path="/travel/hotels/checkout/guests" element={<CheckoutGuestDetails />} />
                  <Route path="/travel/hotels/checkout/payment" element={<CheckoutPayment />} />
                  <Route path="/travel/hotels/checkout/result" element={<CheckoutResult />} />
                  <Route path="/hotel/checkout/guests" element={<CheckoutGuestDetails />} />
                  <Route path="/hotel/checkout/payment" element={<CheckoutPayment />} />
                  <Route path="/hotel/checkout/result" element={<CheckoutResult />} />

                  {/* Error / Forbidden Pages */}
                  <Route path="/forbidden" element={<ForbiddenPage />} />
                  <Route path="/403" element={<ForbiddenPage />} />
                </Route>

                <Route path="/travel/hotels/bookings/:voucherId/voucher" element={<ProtectedRoute><VoucherPage /></ProtectedRoute>} />
                <Route path="/bookings/:voucherId/voucher" element={<ProtectedRoute><VoucherPage /></ProtectedRoute>} />

                {/* Redirect root to travel hotels (ProtectedRoute will handle auth check) */}
                <Route path="/" element={<Navigate to="/travel/hotels" replace />} />

                {/* 404 Not Found (inside PortalLayout when authenticated, standalone otherwise) */}
                <Route element={<OptionalPortalLayout />}>
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </div>
        </FavoritesProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
