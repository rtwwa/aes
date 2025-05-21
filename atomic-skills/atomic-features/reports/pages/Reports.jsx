import React from "react";
import { useAuth } from "@core/hooks/useAuth";

const Reports = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Отчеты по навыкам
          </h2>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center text-gray-500">
            {user?.role === "admin" || user?.role === "supervisor" ? (
              <p>Функционал отчетов находится в разработке</p>
            ) : (
              <p>У вас нет доступа к просмотру отчетов</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
