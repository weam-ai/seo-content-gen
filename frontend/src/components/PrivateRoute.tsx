import { Outlet } from 'react-router-dom';
// Removed authentication imports - single user application

export default function PrivateRoute() {
  // Single user application - no authentication or permission checks needed
  return <Outlet />;
}
