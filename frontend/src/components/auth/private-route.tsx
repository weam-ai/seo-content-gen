interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  // For single-user application, always allow access
  return <>{children}</>;
}
