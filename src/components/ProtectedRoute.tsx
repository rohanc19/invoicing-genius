
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if email is verified (optional)
  // if (!user.emailVerified) {
  //   return (
  //     <div className="min-h-screen flex flex-col items-center justify-center p-4">
  //       <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg">
  //         <h1 className="text-2xl font-bold mb-4">Email Verification Required</h1>
  //         <p className="mb-4">Please verify your email address before accessing this page.</p>
  //         <p className="text-sm text-muted-foreground">
  //           A verification email has been sent to {user.email}.
  //           Please check your inbox and follow the instructions.
  //         </p>
  //         <button
  //           className="mt-4 w-full bg-primary text-primary-foreground py-2 rounded-md"
  //           onClick={() => window.location.reload()}
  //         >
  //           I've verified my email
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return <Outlet />;
}
