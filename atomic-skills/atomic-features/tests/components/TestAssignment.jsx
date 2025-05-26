import React, { useState, useEffect } from "react";
import axiosInstance from "@core/utils/axios";
import { useAuth } from "@core/hooks/useAuth";
import DEPARTMENTS from "@infrastructure/config/departments";

const TestAssignment = ({ testId, onClose }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    assignmentType: "users", // or "department"
    selectedUsers: [],
    selectedDepartment: "",
    dueDate: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/api/users");
      setUsers(response.data.filter((u) => u._id !== user._id));
    } catch (error) {
      setError("Ошибка при загрузке пользователей");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        testId,
        dueDate: formData.dueDate,
        ...(formData.assignmentType === "users"
          ? { assignedTo: formData.selectedUsers }
          : { department: formData.selectedDepartment }),
      };

      await axiosInstance.post("/api/tests/assign", payload);
      setSuccess("Тест успешно назначен");
      setTimeout(onClose, 2000);
    } catch (error) {
      setError(error.response?.data?.error || "Ошибка при назначении теста");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUserSelect = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({
      ...prev,
      selectedUsers: selectedOptions,
    }));
  };

  const renderDepartmentSelect = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Выберите отдел
      </label>
      <select
        name="selectedDepartment"
        value={formData.selectedDepartment}
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
      {formData.selectedDepartment && (
        <p className="mt-2 text-sm text-gray-500">
          {
            DEPARTMENTS.find((d) => d.id === formData.selectedDepartment)
              ?.description
          }
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Назначить тест</h2>

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Тип назначения
          </label>
          <select
            name="assignmentType"
            value={formData.assignmentType}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="users">Конкретным пользователям</option>
            <option value="department">Всему отделу</option>
          </select>
        </div>

        {formData.assignmentType === "users" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Выберите пользователей
            </label>
            <select
              multiple
              name="selectedUsers"
              value={formData.selectedUsers}
              onChange={handleUserSelect}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              size={5}
            >
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} -{" "}
                  {DEPARTMENTS.find((d) => d.id === user.department)?.name ||
                    user.department}
                </option>
              ))}
            </select>
          </div>
        ) : (
          renderDepartmentSelect()
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Срок выполнения
          </label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            min={new Date().toISOString().split("T")[0]}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? "Назначение..." : "Назначить"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestAssignment;
