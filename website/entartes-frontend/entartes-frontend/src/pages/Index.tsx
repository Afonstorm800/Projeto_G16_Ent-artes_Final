import { useState, useEffect } from "react";
import AppSidebar from "@/components/AppSidebar";
import DashboardPage from "@/pages/DashboardPage";
import BookingPage from "@/pages/BookingPage";
import ValidationPage from "@/pages/ValidationPage";
import BillingPage from "@/pages/BillingPage";
import InventoryPage from "@/pages/InventoryPage";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/LoginPage";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

const pages: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  booking: BookingPage,
  validation: ValidationPage,
  billing: BillingPage,
  inventory: InventoryPage,
  profile: ProfilePage,
};

const allowedByRole: Record<UserRole, string[]> = {
  direcao: ["dashboard", "booking", "validation", "inventory", "billing", "profile"],
  professor: ["dashboard", "validation", "profile"],
  encarregado: ["dashboard", "booking", "validation", "inventory", "profile"],
};

const Index = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const { isAuthenticated, user } = useAuth();

  // Redirect to dashboard if current page not allowed for this role
  useEffect(() => {
    if (user && !allowedByRole[user.tipo].includes(currentPage)) {
      setCurrentPage("dashboard");
    }
  }, [user, currentPage]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const PageComponent = pages[currentPage] || DashboardPage;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 p-8 overflow-y-auto">
        <PageComponent />
      </main>
    </div>
  );
};

export default Index;
