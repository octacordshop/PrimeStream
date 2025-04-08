import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
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