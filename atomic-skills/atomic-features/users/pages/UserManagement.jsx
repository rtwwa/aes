import React, { useState, useEffect } from "react";
import axios from "@core/utils/axios";
import { useAuth } from "@core/hooks/useAuth";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import DEPARTMENTS from "@infrastructure/config/departments";

const generateCredentials = () => {
  const generateRandomString = (length) => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  };

  const login = generateRandomString(6);
  const password = generateRandomString(8);
  return { login, password };
};

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    position: "",
    department: "",
    email: "",
    password: "",
    employeeId: "",
    role: "employee",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users");
      setUsers(response.data);
    } catch (error) {
      setError("Ошибка при загрузке пользователей");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerateCredentials = () => {
    const { login, password } = generateCredentials();
    setFormData((prev) => ({
      ...prev,
      email: `${login}@aes.com`,
      password,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/users", formData);
      setSuccess("Пользователь успешно создан");
      setFormData({
        firstName: "",
        lastName: "",
        middleName: "",
        position: "",
        department: "",
        email: "",
        password: "",
        employeeId: "",
        role: "employee",
      });
      fetchUsers();
    } catch (error) {
      setError(
        error.response?.data?.error || "Ошибка при создании пользователя"
      );
    }
  };

  const renderForm = () => {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">
          Добавить нового пользователя
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
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
                required
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                required
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                value={formData.middleName}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="employeeId"
                className="block text-sm font-medium text-gray-700"
              >
                Табельный номер
              </label>
              <input
                type="text"
                name="employeeId"
                id="employeeId"
                required
                value={formData.employeeId}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                required
                value={formData.position}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                required
                value={formData.department}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Выберите отдел</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <div className="flex justify-between items-end">
                <div className="flex-1 mr-4">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Логин (email)
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div className="flex-1 ml-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Пароль
                  </label>
                  <input
                    type="text"
                    name="password"
                    id="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateCredentials}
                  className="ml-4 mt-6 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Сгенерировать
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Создать пользователя
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (user?.role !== "admin") {
    return <div className="text-center p-4">Доступ запрещен</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Управление пользователями
          </h1>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
            <div className="text-green-700">{success}</div>
          </div>
        )}

        {renderForm()}

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Список пользователей
          </h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-primary-600 truncate">
                        {user.lastName} {user.firstName} {user.middleName}
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role === "admin"
                            ? "Администратор"
                            : "Сотрудник"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <div className="flex items-center text-sm text-gray-500">
                          {user.position}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          {user.department}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
