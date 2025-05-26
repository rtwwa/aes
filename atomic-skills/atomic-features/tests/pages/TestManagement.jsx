import React, { useState, useEffect } from "react";
import axiosInstance from "@core/utils/axios";
import { useAuth } from "@core/hooks/useAuth";
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import TestAssignment from "../components/TestAssignment";

const skillLevels = [
  { id: "beginner", name: "Начальный" },
  { id: "intermediate", name: "Средний" },
  { id: "advanced", name: "Продвинутый" },
  { id: "expert", name: "Эксперт" },
];

const TestManagement = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    skillLevel: "beginner",
    duration: 60,
    passingScore: 70,
    questions: [],
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    type: "multiple_choice",
    text: "",
    options: [{ text: "", isCorrect: false }],
    sampleAnswer: "",
    maxScore: 1,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAssignment, setShowAssignment] = useState(false);
  const [selectedTestForAssignment, setSelectedTestForAssignment] =
    useState(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setError("");
      const response = await axiosInstance.get("/api/tests");
      setTests(response.data);
    } catch (error) {
      console.error("Error fetching tests:", error);
      setError(error.response?.data?.error || "Ошибка при загрузке тестов");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (e) => {
    setCurrentQuestion({ ...currentQuestion, [e.target.name]: e.target.value });
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...currentQuestion.options];
    if (field === "isCorrect") {
      newOptions.forEach((opt) => (opt.isCorrect = false));
    }
    newOptions[index] = { ...newOptions[index], [field]: value };
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { text: "", isCorrect: false }],
    });
  };

  const removeOption = (index) => {
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addQuestion = () => {
    if (!currentQuestion.text) {
      setError("Заполните текст вопроса");
      return;
    }

    if (
      currentQuestion.type === "multiple_choice" &&
      (!currentQuestion.options.length ||
        !currentQuestion.options.some((opt) => opt.isCorrect))
    ) {
      setError("Добавьте варианты ответов и отметьте правильный");
      return;
    }

    if (currentQuestion.type === "essay" && !currentQuestion.sampleAnswer) {
      setError("Добавьте пример правильного ответа");
      return;
    }

    setFormData({
      ...formData,
      questions: [...formData.questions, currentQuestion],
    });

    setCurrentQuestion({
      type: "multiple_choice",
      text: "",
      options: [{ text: "", isCorrect: false }],
      sampleAnswer: "",
      maxScore: 1,
    });

    setError("");
  };

  const removeQuestion = (index) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      if (formData.questions.length === 0) {
        setError("Добавьте хотя бы один вопрос");
        return;
      }

      if (editingTest) {
        await axiosInstance.put(`/api/tests/${editingTest._id}`, formData);
      } else {
        await axiosInstance.post("/api/tests", formData);
      }

      setSuccess(editingTest ? "Тест успешно обновлен" : "Тест успешно создан");
      setFormData({
        title: "",
        description: "",
        category: "",
        skillLevel: "beginner",
        duration: 60,
        passingScore: 70,
        questions: [],
      });
      setShowForm(false);
      setEditingTest(null);
      fetchTests();
    } catch (error) {
      console.error("Error saving test:", error);
      setError(error.response?.data?.error || "Ошибка при сохранении теста");
    }
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setFormData(test);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот тест?")) {
      return;
    }

    try {
      setError("");
      await axiosInstance.delete(`/api/tests/${id}`);
      setSuccess("Тест успешно удален");
      fetchTests();
    } catch (error) {
      console.error("Error deleting test:", error);
      setError(error.response?.data?.error || "Ошибка при удалении теста");
    }
  };

  const handleAssignTest = (test) => {
    setSelectedTestForAssignment(test);
    setShowAssignment(true);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Управление тестами
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            {showForm ? "Скрыть форму" : "Создать тест"}
          </button>
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

        {showAssignment && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowAssignment(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Закрыть</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <TestAssignment
                testId={selectedTestForAssignment?._id}
                onClose={() => {
                  setShowAssignment(false);
                  setSelectedTestForAssignment(null);
                }}
              />
            </div>
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow rounded-lg p-6 mb-8"
          >
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Название теста
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Описание теста
                </label>
                <textarea
                  name="description"
                  id="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700"
                >
                  Категория
                </label>
                <input
                  type="text"
                  name="category"
                  id="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="skillLevel"
                  className="block text-sm font-medium text-gray-700"
                >
                  Уровень квалификации
                </label>
                <select
                  name="skillLevel"
                  id="skillLevel"
                  required
                  value={formData.skillLevel}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  {skillLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-gray-700"
                >
                  Длительность (минут)
                </label>
                <input
                  type="number"
                  name="duration"
                  id="duration"
                  min="1"
                  required
                  value={formData.duration}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="passingScore"
                  className="block text-sm font-medium text-gray-700"
                >
                  Проходной балл (%)
                </label>
                <input
                  type="number"
                  name="passingScore"
                  id="passingScore"
                  min="1"
                  max="100"
                  required
                  value={formData.passingScore}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Вопросы
              </h3>

              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="grid grid-cols-1 gap-y-6">
                  <div>
                    <label
                      htmlFor="questionType"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Тип вопроса
                    </label>
                    <select
                      name="type"
                      id="questionType"
                      value={currentQuestion.type}
                      onChange={handleQuestionChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="multiple_choice">
                        С вариантами ответа
                      </option>
                      <option value="essay">С развернутым ответом</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="questionText"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Текст вопроса
                    </label>
                    <textarea
                      name="text"
                      id="questionText"
                      value={currentQuestion.text}
                      onChange={handleQuestionChange}
                      rows={2}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  {currentQuestion.type === "multiple_choice" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Варианты ответов
                      </label>
                      {currentQuestion.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 mb-2"
                        >
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) =>
                              handleOptionChange(index, "text", e.target.value)
                            }
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Вариант ответа"
                          />
                          <input
                            type="radio"
                            checked={option.isCorrect}
                            onChange={(e) =>
                              handleOptionChange(
                                index,
                                "isCorrect",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addOption}
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <PlusIcon className="-ml-1 mr-1 h-4 w-4" />
                        Добавить вариант
                      </button>
                    </div>
                  )}

                  {currentQuestion.type === "essay" && (
                    <div>
                      <label
                        htmlFor="sampleAnswer"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Пример правильного ответа
                      </label>
                      <textarea
                        name="sampleAnswer"
                        id="sampleAnswer"
                        value={currentQuestion.sampleAnswer}
                        onChange={handleQuestionChange}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="maxScore"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Максимальный балл за вопрос
                    </label>
                    <input
                      type="number"
                      name="maxScore"
                      id="maxScore"
                      min="1"
                      value={currentQuestion.maxScore}
                      onChange={handleQuestionChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addQuestion}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Добавить вопрос
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {formData.questions.map((question, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-md p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">
                          Вопрос {index + 1}:{" "}
                          <span className="font-normal">{question.text}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Тип:{" "}
                          {question.type === "multiple_choice"
                            ? "С вариантами ответа"
                            : "С развернутым ответом"}
                        </p>
                        {question.type === "multiple_choice" && (
                          <ul className="mt-2 space-y-1">
                            {question.options.map((option, optIndex) => (
                              <li
                                key={optIndex}
                                className={`text-sm ${
                                  option.isCorrect
                                    ? "text-green-600 font-medium"
                                    : "text-gray-600"
                                }`}
                              >
                                {option.text}
                                {option.isCorrect && " ✓"}
                              </li>
                            ))}
                          </ul>
                        )}
                        {question.type === "essay" && (
                          <p className="text-sm text-gray-600 mt-2">
                            Пример ответа: {question.sampleAnswer}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-800 ml-4"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTest(null);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {editingTest ? "Сохранить изменения" : "Создать тест"}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {tests.map((test) => (
              <li key={test._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {test.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {test.description}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className="mr-4">Категория: {test.category}</span>
                        <span className="mr-4">
                          Уровень:{" "}
                          {
                            skillLevels.find((l) => l.id === test.skillLevel)
                              ?.name
                          }
                        </span>
                        <span>Длительность: {test.duration} мин</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAssignTest(test)}
                        className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        title="Назначить тест"
                      >
                        <UserGroupIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(test)}
                        className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(test._id)}
                        className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
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

export default TestManagement;
