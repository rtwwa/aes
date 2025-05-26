import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "@core/utils/axios";
import { useAuth } from "@core/hooks/useAuth";
import {
  ClockIcon,
  DocumentCheckIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const TestTaking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { testId } = useParams();
  const [currentTest, setCurrentTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [passingScore, setPassingScore] = useState(null);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`/api/tests/${testId}`);
      if (!response.data) {
        throw new Error("Тест не найден");
      }
      setCurrentTest(response.data);
      setPassingScore(response.data.passingScore);
      setTimeLeft(response.data.duration * 60); // Convert minutes to seconds
    } catch (error) {
      console.error("Error fetching test:", error);
      const errorMessage =
        error.response?.status === 403
          ? "У вас нет доступа к этому тесту. Возможно, срок выполнения истек."
          : error.response?.data?.error || "Ошибка при загрузке теста";
      setError(errorMessage);
      // Даем пользователю время прочитать сообщение об ошибке перед перенаправлением
      setTimeout(() => {
        navigate("/my-tests");
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (timeLeft > 0 && currentTest && !testCompleted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTestSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, currentTest, testCompleted]);

  const handleAnswer = (e, questionId, answer) => {
    e.preventDefault();
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  const handleTestSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      // Submit test answers
      const testResponse = await axios.post(`/api/tests/${testId}/submit`, {
        answers,
        timeSpent: currentTest.duration * 60 - timeLeft,
      });
      const { score, passed, testResultId } = testResponse.data;
      console.log("Test submission response:", testResponse.data);

      // Update states in the correct order
      setScore(score);
      setTestCompleted(true);

      console.log(
        "States updated - Score:",
        score,
        "Passing score:",
        passingScore,
        "Test completed:",
        true
      );

      if (passed) {
        try {
          // Generate certificate only if test is passed
          const certResponse = await axios.post(
            `/api/tests/${testId}/certificate`,
            {
              testResultId,
            }
          );
          setCertificate(certResponse.data);
        } catch (certError) {
          console.error("Error generating certificate:", certError);
          setError(
            "Тест пройден успешно, но возникла ошибка при создании сертификата"
          );
        }
      }
    } catch (error) {
      console.error("Error submitting test:", error);
      setError(
        error.response?.data?.error || "Произошла ошибка при отправке теста"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const renderQuestion = () => {
    if (!currentTest) return null;

    const question = currentTest.questions[currentQuestionIndex];
    return (
      <div className="bg-white shadow sm:rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Вопрос {currentQuestionIndex + 1} из {currentTest.questions.length}
          </h3>
          <div className="flex items-center text-gray-500">
            <ClockIcon className="h-5 w-5 mr-1" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-900 mb-4">{question.text}</p>
          {question.type === "multiple_choice" ? (
            <div className="space-y-2">
              {" "}
              {question.options.map((option, index) => (
                <label key={index} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name={`question-${question._id}`}
                    value={option.text}
                    checked={answers[question._id] === option.text}
                    onChange={(e) => handleAnswer(e, question._id, option.text)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="text-gray-900">{option.text}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={answers[question._id] || ""}
              onChange={(e) => handleAnswer(question._id, e.target.value)}
              rows={4}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Введите ваш ответ..."
            />
          )}
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
            disabled={currentQuestionIndex === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            Назад
          </button>
          <button
            type="button"
            onClick={() => {
              if (currentQuestionIndex === currentTest.questions.length - 1) {
                handleTestSubmit();
              } else {
                setCurrentQuestionIndex((prev) => prev + 1);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {currentQuestionIndex === currentTest.questions.length - 1
              ? "Завершить тест"
              : "Следующий вопрос"}
          </button>
        </div>
      </div>
    );
  };
  const renderResults = () => {
    console.log(
      "Rendering results with score:",
      score,
      "test:",
      currentTest,
      "passingScore:",
      passingScore
    );

    // Show loading if we don't have all the data yet
    if (!currentTest || score === null || passingScore === null) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Загрузка результатов...</p>
        </div>
      );
    }

    const passed = score >= passingScore;

    return (
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-xl font-medium text-gray-900 mb-6">
          Результаты теста "{currentTest.title}"
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Ваш результат</div>
            <div className="text-3xl font-bold text-gray-900">{score}%</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Проходной балл</div>
            <div className="text-3xl font-bold text-gray-900">
              {passingScore}%
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg p-4 mb-6 ${
            passed
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {passed ? (
            <div className="space-y-3">
              <h4 className="text-lg font-medium text-green-800">
                Поздравляем! Вы успешно прошли тест
              </h4>
              {certificate ? (
                <div className="text-green-700 space-y-2">
                  <p>Сертификат успешно сформирован</p>
                  <ul className="text-sm space-y-1">
                    <li>Номер: {certificate.certificateNumber}</li>
                    <li>
                      Действителен до:{" "}
                      {new Date(certificate.expiryDate).toLocaleDateString()}
                    </li>
                  </ul>
                </div>
              ) : (
                <p className="text-green-700">Формируется сертификат...</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-lg font-medium text-red-800">
                Тест не пройден
              </h4>
              <p className="text-red-700">
                К сожалению, вы не набрали необходимый минимум в {passingScore}
                %. Изучите материал и попробуйте снова.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            onClick={() => navigate("/my-tests")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />К списку тестов
          </button>

          {certificate && (
            <button
              onClick={() =>
                window.open(
                  `/api/tests/certificates/${certificate._id}/download`,
                  "_blank"
                )
              }
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <DocumentCheckIcon className="h-5 w-5 mr-2" />
              Скачать сертификат
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <svg
          className="animate-spin h-5 w-5 mr-3 text-primary-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v16a8 8 0 01-8-8z"
          />
        </svg>
        <span className="text-gray-700 text-lg">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Прохождение тестов
          </h1>
        </div>
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="text-red-700">{error}</div>
          </div>
        )}{" "}
        {testCompleted ? (
          renderResults()
        ) : currentTest ? (
          renderQuestion()
        ) : (
          <div className="text-center">
            <p className="text-gray-500">Загрузка теста...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestTaking;
