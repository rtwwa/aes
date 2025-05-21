import React, { useEffect, useState } from "react";
import { useAuth } from "@core/hooks/useAuth";
import axios from "axios";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSkills: 0,
    completedSkills: 0,
    pendingAssessments: 0,
    recentActivities: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get("/api/dashboard", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Добро пожаловать, {user?.firstName}!
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Статистика навыков */}
        <div className="card">
          <div className="p-5">
            <dt className="text-base font-normal text-gray-900">
              Всего навыков
            </dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-primary-600">
                {stats.totalSkills}
              </div>
            </dd>
          </div>
        </div>

        {/* Подтвержденные навыки */}
        <div className="card">
          <div className="p-5">
            <dt className="text-base font-normal text-gray-900">
              Подтверждено
            </dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-green-600">
                {stats.completedSkills}
              </div>
            </dd>
          </div>
        </div>

        {/* Ожидающие проверки */}
        <div className="card">
          <div className="p-5">
            <dt className="text-base font-normal text-gray-900">На проверке</dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-yellow-600">
                {stats.pendingAssessments}
              </div>
            </dd>
          </div>
        </div>
      </div>

      {/* Последние активности */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Последние активности
          </h3>
        </div>
        <div className="card-body">
          <ul className="divide-y divide-gray-200">
            {stats.recentActivities.map((activity, index) => (
              <li key={index} className="py-4">
                <div className="flex space-x-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">{activity.title}</h3>
                      <p className="text-sm text-gray-500">{activity.date}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {activity.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
