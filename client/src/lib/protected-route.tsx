import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Redirect, Route } from "wouter";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  path: string;
  component?: () => React.JSX.Element;
  children?: ReactNode;
}

export function ProtectedRoute({
  path,
  component: Component,
  children
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      ) : user ? (
        Component ? <Component /> : children
      ) : (
        <Redirect to="/auth" />
      )}
    </Route>
  );
}

export function AdminProtectedRoute({
  path,
  component: Component,
  children
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      ) : user?.isAdmin ? (
        Component ? <Component /> : children
      ) : user ? (
        // User is logged in but not an admin
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-prime-gray max-w-md mb-6">
            You need administrator privileges to access this page. Please contact an administrator if you believe you should have access.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-prime-blue text-white rounded-md hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      ) : (
        <Redirect to="/auth" />
      )}
    </Route>
  );
}