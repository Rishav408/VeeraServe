import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import HomeScreen from "./screens/HomeScreen";
import MenuScreen from "./screens/MenuScreen";
import ItemDetailsScreen from "./screens/ItemDetailsScreen";
import CartScreen from "./screens/CartScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import OrdersScreen from "./screens/OrdersScreen";
import TrackOrderScreen from "./screens/TrackOrderScreen";
import OffersScreen from "./screens/OffersScreen";
import ProfileScreen from "./screens/ProfileScreen";
import LoginScreen from "./screens/LoginScreen";
import FeedbackScreen from "./screens/FeedbackScreen";
import ChatScreen from "./screens/ChatScreen";
import AdminDashboardScreen from "./screens/AdminDashboardScreen";
import AdminMenuScreen from "./screens/AdminMenuScreen";
import AdminOrdersScreen from "./screens/AdminOrdersScreen";
import NotFoundScreen from "./screens/NotFoundScreen";

function AnimatedRoutes() {
  const location = useLocation();
  const MotionContainer = motion.div;

  return (
    <AnimatePresence mode="wait">
      <MotionContainer
        key={location.pathname}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Routes location={location}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/menu" element={<MenuScreen />} />
            <Route path="/menu/:id" element={<ItemDetailsScreen />} />
            <Route path="/cart" element={<CartScreen />} />
            <Route path="/checkout" element={<CheckoutScreen />} />
            <Route path="/orders" element={<OrdersScreen />} />
            <Route path="/track/:id" element={<TrackOrderScreen />} />
            <Route path="/offers" element={<OffersScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/feedback" element={<FeedbackScreen />} />
            <Route path="/chat" element={<ChatScreen />} />
            <Route path="/admin" element={<AdminDashboardScreen />} />
            <Route path="/admin/menu" element={<AdminMenuScreen />} />
            <Route path="/admin/orders" element={<AdminOrdersScreen />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundScreen />} />
          </Route>
        </Routes>
      </MotionContainer>
    </AnimatePresence>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}
