import AdminNavbar from "@/components/AdminNavbar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div>
      <AdminNavbar />
      {/* pt-16 (padding-top: 4rem) correspond à la hauteur de la navbar (h-16) */}
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
