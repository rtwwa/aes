import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@core/utils/axios";
import { useAuth } from "@core/hooks/useAuth";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentCheckIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

const TestDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({
    completedCount: 0,
    averageScore: 0,
    certificatesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Получаем все данные параллельно
      const [assignmentsRes, certificatesRes] = await Promise.all([
        axiosInstance.get("/api/tests/assignments"),
        axiosInstance.get("/api/tests/certificates"),
      ]);

      // Фильтруем и сортируем назначения
      const validAssignments = assignmentsRes.data
        .filter((assignment) => assignment.testId && assignment.testId._id)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      setAssignments(validAssignments);
      setCertificates(certificatesRes.data);

      // Обновляем статистику
      const completedCount = validAssignments.filter(
        (a) => a.status === "completed"
      ).length;
      const validCertificates = certificatesRes.data.filter(
        (cert) =>
          cert.testResultId && typeof cert.testResultId.score === "number"
      );
      const averageScore =
        validCertificates.length > 0
          ? Math.round(
              validCertificates.reduce(
                (sum, cert) => sum + cert.testResultId.score,
                0
              ) / validCertificates.length
            )
          : 0;

      setStats({
        completedCount,
        averageScore,
        certificatesCount: certificatesRes.data.length,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.response?.data?.error || "Ошибка при загрузке данных");
    } finally {
      setLoading(false);
    }
  };

  // Разделяем тесты по статусу
  const pendingAssignments = assignments.filter((a) => a.status === "pending");
  const completedAssignments = assignments.filter(
    (a) => a.status === "completed"
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Вычисляем оставшееся время
  const getTimeUntilDue = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Просрочено";
    if (diffDays === 0) return "Сегодня";
    if (diffDays === 1) return "Завтра";
    return `${diffDays} дней`;
  };

  const downloadCertificate = async (certificateId) => {
    try {
      setError("");
      const response = await axiosInstance.get(
        `/api/tests/certificates/${certificateId}/download`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "certificate.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError(
        error.response?.data?.error || "Ошибка при скачивании сертификата"
      );
    }
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Statistics Section */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Пройдено тестов
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.completedCount}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentCheckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Средний балл
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.averageScore}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentCheckIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Получено сертификатов
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.certificatesCount}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Tests Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Назначенные тесты
        </h2>
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="text-red-700">{error}</div>
          </div>
        )}
        {pendingAssignments.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
            <p className="text-gray-500">
              На данный момент нет назначенных тестов
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {pendingAssignments.map((assignment) => (
                <li key={assignment._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {assignment.testId.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {assignment.testId.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <ClockIcon className="h-5 w-5 mr-1 text-gray-400" />
                            <span>
                              Длительность: {assignment.testId.duration} минут
                            </span>
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-5 w-5 mr-1 text-gray-400" />
                            <span>
                              Срок сдачи: {formatDate(assignment.dueDate)}
                            </span>
                          </div>
                          <div
                            className={`flex items-center ${
                              getTimeUntilDue(assignment.dueDate) ===
                              "Просрочено"
                                ? "text-red-500"
                                : "text-green-500"
                            }`}
                          >
                            <span>
                              До сдачи: {getTimeUntilDue(assignment.dueDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link
                          to={`/take-test/${assignment.testId._id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Начать тест
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Certificates Section */}
      {certificates.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Сертификаты
          </h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {certificates.map((certificate) => (
                <li key={certificate._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {certificate.testId.title}
                          </h3>
                          <span
                            className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                              certificate.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {certificate.status === "active"
                              ? "Активный"
                              : "Истек"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                          <div>
                            <p>Сертификат №: {certificate.certificateNumber}</p>
                            <p>Выдан: {formatDate(certificate.issueDate)}</p>
                          </div>
                          <div>
                            <p>Результат: {certificate.testResultId.score}%</p>
                            <p>
                              Действителен до:{" "}
                              {formatDate(certificate.expiryDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => downloadCertificate(certificate._id)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <DocumentCheckIcon className="h-5 w-5 mr-2" />
                          Скачать
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDashboard;
