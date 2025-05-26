import React, { useState, useEffect } from "react";
import axios from "@core/utils/axios";
import { useAuth } from "@core/hooks/useAuth";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const statusIcons = {
  pending: ClockIcon,
  "in-progress": ClockIcon,
  completed: CheckCircleIcon,
  rejected: XCircleIcon,
};

const statusColors = {
  pending: "text-yellow-500",
  "in-progress": "text-blue-500",
  completed: "text-green-500",
  rejected: "text-red-500",
};

const AssessmentList = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const endpoint =
          user.role === "supervisor"
            ? "/api/assessments/pending"
            : "/api/assessments/user";
        const response = await axios.get(endpoint);
        setAssessments(response.data);
      } catch (err) {
        setError("Ошибка при загрузке данных");
        console.error("Error fetching assessments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [user.role]);

  const handleUpdateAssessment = async (
    assessmentId,
    status,
    level,
    feedback
  ) => {
    try {
      await axios.put(
        `/api/assessments/${assessmentId}`,
        { status, currentLevel: level, feedback },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // Обновляем список оценок
      const endpoint =
        user.role === "supervisor"
          ? "/api/assessments/pending"
          : "/api/assessments/user";
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAssessments(response.data);
    } catch (err) {
      console.error("Error updating assessment:", err);
      alert("Ошибка при обновлении оценки");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );

  if (error) return <div className="text-center text-red-600 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {user.role === "supervisor" ? "Проверка навыков" : "Мои оценки"}
          </h2>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {assessments.map((assessment) => {
            const StatusIcon = statusIcons[assessment.status];
            return (
              <li key={assessment._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <StatusIcon
                        className={`h-5 w-5 ${
                          statusColors[assessment.status]
                        } mr-2`}
                      />
                      <p className="text-sm font-medium text-primary-600 truncate">
                        {assessment.skill.name}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Уровень: {assessment.currentLevel}
                      </p>
                    </div>
                  </div>

                  {user.role === "supervisor" &&
                    assessment.status === "pending" && (
                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={() =>
                            handleUpdateAssessment(
                              assessment._id,
                              "completed",
                              assessment.currentLevel,
                              "Навык подтвержден"
                            )
                          }
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          Подтвердить
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateAssessment(
                              assessment._id,
                              "rejected",
                              assessment.currentLevel,
                              "Требуется дополнительная практика"
                            )
                          }
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          Отклонить
                        </button>
                      </div>
                    )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {assessments.length === 0 && (
        <div className="text-center text-gray-500 p-4">Оценки не найдены</div>
      )}
    </div>
  );
};

export default AssessmentList;
