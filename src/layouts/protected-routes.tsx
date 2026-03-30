import { LoaderPage } from "@/routes/loader-page";
import { useAuth } from "@clerk/clerk-react";

const ProtectRoutes = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <LoaderPage />;
  }

  if (!isSignedIn) {
    // Redirect entirely out of the application to the Landing Page for Auth
    window.location.href = "http://localhost:3000";
    return null;
  }

  return <>{children}</>;
};

export default ProtectRoutes;
