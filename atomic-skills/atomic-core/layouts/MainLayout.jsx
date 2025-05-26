import React, { useEffect } from "react";
import {
  Outlet,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { useAuth } from "@core/hooks/useAuth";
import {
  HomeIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  UserCircleIcon,
  PencilSquareIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const navigation = (role) =>
  [
    {
      name: "Мои тесты",
      href: "/my-tests",
      icon: DocumentTextIcon,
    },
    {
      name: "Управление тестами",
      href: "/tests",
      icon: ClipboardDocumentCheckIcon,
      adminOnly: true,
    },
    {
      name: "Управление пользователями",
      href: "/users",
      icon: UserCircleIcon,
      adminOnly: true,
    },
    role === "admin" && {
      name: "Прогресс сотрудников",
      href: "/user-progress",
      icon: ChartBarIcon,
    },
  ].filter(Boolean);

export const Layout = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-2xl font-bold text-gray-900">AES</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation(user.role)
                  .filter((item) => !item.adminOnly || user?.role === "admin")
                  .map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        location.pathname === item.href
                          ? "border-b-2 border-primary-500 text-gray-900"
                          : "text-gray-500 hover:border-b-2 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="relative ml-3">
                <div className="flex items-center">
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <button
                      onClick={logout}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
