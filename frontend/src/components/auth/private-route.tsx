// Single user application - no authentication needed
interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  // Always allow access in single user mode
  return <>{children}</>;
}
