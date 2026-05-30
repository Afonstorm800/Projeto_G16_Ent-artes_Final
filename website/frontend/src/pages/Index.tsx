import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import DashboardPage from "@/pages/DashboardPage";
import BookingPage from "@/pages/BookingPage";
import ValidationPage from "@/pages/ValidationPage";
import BillingPage from "@/pages/BillingPage";
import InventoryPage from "@/pages/InventoryPage";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/LoginPage";
import WeekPage from "@/pages/WeekPage";
import SchedulePage from "@/pages/SchedulePage";
import AvailabilityPage from "@/pages/AvailabilityPage";
import GeneralSchedulePage from "@/pages/GeneralSchedulePage";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

const pages: Record<string, React.ComponentType<any>> = {
  dashboard: DashboardPage,
  week: WeekPage,
  schedule: SchedulePage,
  availability: AvailabilityPage,
  generalSchedule: GeneralSchedulePage,
  booking: BookingPage,
  validation: ValidationPage,
  billing: BillingPage,
  inventory: InventoryPage,
  profile: ProfilePage,
};

const allowedByRole: Record<UserRole, string[]> = {
  direcao: ["dashboard", "generalSchedule", "booking", "validation", "inventory", "billing", "profile"],
  professor: ["dashboard", "schedule", "availability", "validation", "profile"],
  encarregado: ["week", "booking", "validation", "inventory", "billing", "profile"],
};

const defaultByRole: Record<UserRole, string> = {
  direcao: "dashboard",
  professor: "dashboard",
  encarregado: "week",
};

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");

  console.log(`Index: Rendering with user=${user?.nome}, role=${user?.tipo}, currentPage=${currentPage}`);

  // Redirect to default page for role if current page not allowed
  useEffect(() => {
    if (user && allowedByRole[user.tipo]) {
      if (!allowedByRole[user.tipo].includes(currentPage)) {
        const defaultPage = defaultByRole[user.tipo];
        console.log(`Index: Redirecting from ${currentPage} to ${defaultPage} for role ${user.tipo}`);
        setCurrentPage(defaultPage);
      }
    } else if (user) {
      console.warn(`Index: Unknown role ${user.tipo} for user ${user.nome}`);
    }
  }, [user, currentPage]);

  if (!isAuthenticated) {
    console.log("Index: Not authenticated, showing LoginPage");
    return <LoginPage />;
  }

  // Safety check: don't render the component if the role isn't allowed yet
  if (user && (!allowedByRole[user.tipo] || !allowedByRole[user.tipo].includes(currentPage))) {
    console.log(`Index: Page ${currentPage} not yet allowed for ${user.tipo}, showing loader`);
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const PageComponent = pages[currentPage] || DashboardPage;
  console.log(`Index: Rendering PageComponent for ${currentPage}`);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 p-8 overflow-y-auto h-full">
        <PageComponent onNavigate={setCurrentPage} />
      </main>
    </div>
  );
};

export default Index;
