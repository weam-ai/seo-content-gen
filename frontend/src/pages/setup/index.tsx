import { Outlet } from "react-router-dom";

export default function Setup() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}
