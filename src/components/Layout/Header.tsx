import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';

export function Header() {
  const project = useProjectStore((state) => state.project);
  const isDirty = useProjectStore((state) => state.isDirty);
  const saveCurrentProject = useProjectStore((state) => state.saveCurrentProject);
  const closeProject = useProjectStore((state) => state.closeProject);
  const view = useUIStore((state) => state.view);
  const setView = useUIStore((state) => state.setView);
  const openDialog = useUIStore((state) => state.openDialog);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const toggleDarkMode = useSettingsStore((state) => state.toggleDarkMode);
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const handleSave = async () => {
    await saveCurrentProject();
  };

  const handleBack = () => {
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      closeProject();
      setView('projects');
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedModal(false);
    closeProject();
    setView('projects');
  };

  const handleSaveAndClose = async () => {
    await saveCurrentProject();
    setShowUnsavedModal(false);
    closeProject();
    setView('projects');
  };

  return (
    <>
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        {/* Menu button */}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          title="Toggle sidebar"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Logo/Title */}
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          {view === 'editor' && project ? (
            <span className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Back to projects"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              {project.name}
              {isDirty && <span className="text-sm text-gray-400">*</span>}
            </span>
          ) : (
            'StitchFizzle'
          )}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Editor-specific actions */}
        {view === 'editor' && project && (
          <>
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              onClick={() => openDialog('export')}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Export
            </button>
          </>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={() => toggleDarkMode()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          title="Toggle dark mode"
        >
          {isDarkMode() ? (
            <svg
              className="w-5 h-5 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>

        {/* Settings */}
        <button
          onClick={() => openDialog('settings')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          title="Settings"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

    </header>

      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Unsaved Changes
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                You have unsaved changes. Would you like to save before leaving?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowUnsavedModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscardChanges}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                Don't Save
              </button>
              <button
                onClick={handleSaveAndClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
