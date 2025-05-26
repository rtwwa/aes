import React, { useState, useEffect } from "react";
import axiosInstance from "@core/utils/axios";
import {
  ChartBarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import DEPARTMENTS from "@infrastructure/config/departments";

const UserProgress = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    position: "",
    department: "",
    password: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/api/users");
      const filteredUsers = response.data.filter(
        (user) => user.role === "employee"
      );
      setUsers(filteredUsers);
    } catch (error) {
      setError("Ошибка при загрузке списка пользователей");
      console.error(error);
    }
  };

  const fetchUserStats = async (userId) => {
    try {
      setLoading(true);
      setError("");
      const [testsRes, certificatesRes] = await Promise.all([
        axiosInstance.get(`/api/tests/user-progress/${userId}`),
        axiosInstance.get(`/api/certificates/user/${userId}`),
      ]);

      setUserStats({
        tests: testsRes.data,
        certificates: certificatesRes.data,
      });

      setSelectedUser(users.find((u) => u._id === userId));
    } catch (error) {
      setError("Ошибка при загрузке статистики пользователя");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCertificate = async (certId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот сертификат?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/certificates/${certId}`);
      // Refresh user stats
      fetchUserStats(selectedUser._id);
    } catch (error) {
      setError("Ошибка при удалении сертификата");
      console.error(error);
    }
  };

  const handleEditUser = (user) => {
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName || "",
      position: user.position,
      department: user.department,
      password: "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await axiosInstance.put(
        `/api/users/${selectedUser._id}`,
        editFormData
      );

      // Update local state
      setSelectedUser(updatedUser.data);
      // Update users list
      setUsers(
        users.map((u) =>
          u._id === updatedUser.data._id ? updatedUser.data : u
        )
      );
      setIsEditModalOpen(false);
      setError("");
    } catch (error) {
      setError(
        error.response?.data?.error || "Ошибка при обновлении пользователя"
      );
    }
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Отчеты по прогрессу сотрудников
          </h2>
        </div>
      </div>

      <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Поиск по имени или email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Список пользователей */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Сотрудники</h3>
          </div>
          <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {filteredUsers.map((user) => (
              <li
                key={user._id}
                className={`cursor-pointer hover:bg-gray-50 ${
                  selectedUser?._id === user._id ? "bg-blue-50" : ""
                }`}
                onClick={() => fetchUserStats(user._id)}
              >
                <div className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.lastName} {user.firstName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Статистика пользователя */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600">Загрузка...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="text-red-700">{error}</div>
            </div>
          ) : selectedUser && userStats ? (
            <div className="space-y-6">
              {/* Общая информация */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {" "}
                    {selectedUser.lastName} {selectedUser.firstName}{" "}
                    {selectedUser.middleName}
                    <button
                      onClick={() => handleEditUser(selectedUser)}
                      className="ml-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <PencilIcon className="h-4 w-4 mr-1.5" />
                      Редактировать
                    </button>
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Должность: {selectedUser.position} | Отдел:{" "}
                    {selectedUser.department}
                  </p>

                  {/* Edit Modal */}
                  {isEditModalOpen && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">
                            Редактировать информацию
                          </h3>
                          <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                          <div>
                            <label
                              htmlFor="lastName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Фамилия
                            </label>
                            <input
                              type="text"
                              name="lastName"
                              id="lastName"
                              value={editFormData.lastName}
                              onChange={handleEditChange}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="firstName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Имя
                            </label>
                            <input
                              type="text"
                              name="firstName"
                              id="firstName"
                              value={editFormData.firstName}
                              onChange={handleEditChange}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="middleName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Отчество
                            </label>
                            <input
                              type="text"
                              name="middleName"
                              id="middleName"
                              value={editFormData.middleName}
                              onChange={handleEditChange}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="position"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Должность
                            </label>
                            <input
                              type="text"
                              name="position"
                              id="position"
                              value={editFormData.position}
                              onChange={handleEditChange}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="department"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Отдел
                            </label>
                            <select
                              name="department"
                              id="department"
                              value={editFormData.department}
                              onChange={handleEditChange}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              {DEPARTMENTS.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                  {dept.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor="password"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Новый пароль
                            </label>
                            <input
                              type="password"
                              name="password"
                              id="password"
                              value={editFormData.password}
                              onChange={handleEditChange}
                              placeholder="Оставьте пустым, чтобы не менять"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                              type="submit"
                              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                              Сохранить
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditModalOpen(false)}
                              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                              Отмена
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Список тестов */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    История тестов
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Тест
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Статус
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Результат
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Дата
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {" "}
                        {userStats.tests.map((test) => (
                          <tr key={test._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {test.testId.title}
                              {test.testId.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {test.testId.description}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  test.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : test.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {test.status === "completed"
                                  ? "Завершен"
                                  : test.status === "pending"
                                  ? "Ожидает выполнения"
                                  : "В процессе"}
                              </span>
                              {test.dueDate && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Срок сдачи: {formatDate(test.dueDate)}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {test.score !== null ? `${test.score}%` : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(test.updatedAt)}
                              {test.testId.duration && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Длительность: {test.testId.duration} мин
                                </p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Сертификаты */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Полученные сертификаты
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {userStats.certificates.map((cert) => (
                      <div key={cert._id} className="border rounded-lg p-4">
                        {" "}
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {cert.testId.title}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Номер: {cert.certificateNumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              Выдан: {formatDate(cert.issueDate)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                cert.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {cert.status === "active" ? "Активный" : "Истек"}
                            </span>
                            <button
                              onClick={() => handleDeleteCertificate(cert._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Удалить сертификат"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <button
                            onClick={() => handleDeleteCertificate(cert._id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Удалить сертификат
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg shadow p-6 text-center text-gray-500">
              Выберите сотрудника для просмотра статистики
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно редактирования пользователя */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Редактировать пользователя
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                  title="Закрыть"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                  <div className="text-red-700">{error}</div>
                </div>
              )}

              <form onSubmit={handleEditSubmit}>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Имя
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={editFormData.firstName}
                      onChange={handleEditChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Фамилия
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={editFormData.lastName}
                      onChange={handleEditChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="middleName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Отчество
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      id="middleName"
                      value={editFormData.middleName}
                      onChange={handleEditChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="position"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Должность
                    </label>
                    <input
                      type="text"
                      name="position"
                      id="position"
                      value={editFormData.position}
                      onChange={handleEditChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="department"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Отдел
                    </label>
                    <select
                      name="department"
                      id="department"
                      value={editFormData.department}
                      onChange={handleEditChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Выберите отдел</option>{" "}
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Пароль
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      value={editFormData.password}
                      onChange={handleEditChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Сохранить изменения
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProgress;
