import React from "react";
import { AcademicCapIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

const SkillCard = ({ skill, progress }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <AcademicCapIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {skill.name}
              </dt>
              <dd>
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 bg-primary-600 rounded-full"
                        style={{
                          width: `${(progress / skill.requiredLevel) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="ml-3 flex items-center text-sm">
                    {progress >= skill.requiredLevel && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                    <span className="ml-1 text-gray-500">
                      {progress} / {skill.requiredLevel}
                    </span>
                  </span>
                </div>
              </dd>
            </dl>
          </div>
        </div>
        <div className="mt-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {skill.category}
          </span>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <a
            href="#"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Подробнее
          </a>
        </div>
      </div>
    </div>
  );
};

export default SkillCard;
