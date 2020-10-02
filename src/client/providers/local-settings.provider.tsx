import React, { createContext, useCallback, useState } from 'react';

type LocalSettingsContext = {
  showStatsOverlay: boolean,

  setShowStatsOverlay: (value: boolean) => unknown,
};

export const LocalSettingsContext = createContext<LocalSettingsContext>(null as never);

type LocalSettingsState = {
  showStatsOverlay: LocalSettingsContext['showStatsOverlay'],
};

const LOCAL_STORAGE_SETTINGS_KEY = 'userSettings';

/**
 * Load the local settings from the browser local storage
 */
const loadSettingsFromLocalStorage = (): LocalSettingsState => {
  const previousData = JSON.parse(localStorage[LOCAL_STORAGE_SETTINGS_KEY] || null) ?? {};

  return {
    showStatsOverlay: false,

    ...previousData,
  };
};

/**
 * @description
 * Maintain the local settings for the device by reading / writing into and out of local storage
 */
export const LocalSettingsProvider: React.FC = function LocalSettingsProvider({ children }) {
  const [localSettings, setLocalSettings] = useState<LocalSettingsState>(loadSettingsFromLocalStorage());

  const doSetLocalSettings = useCallback((changedSettings: Partial<LocalSettingsState>) => {
    // Combine the existing and new settings
    const newLocalSettings: LocalSettingsState = {
      ...localSettings,
      ...changedSettings,
    };

    // Store the data to the local browser storage
    localStorage[LOCAL_STORAGE_SETTINGS_KEY] = JSON.stringify(newLocalSettings);

    // Update the state data
    setLocalSettings(newLocalSettings);
  }, [localSettings]);

  return (
    <LocalSettingsContext.Provider value={{
      showStatsOverlay: localSettings.showStatsOverlay,

      setShowStatsOverlay: (showStatsOverlay: LocalSettingsContext['showStatsOverlay']) => doSetLocalSettings({ showStatsOverlay }),
    }}
    >
      {children}
    </LocalSettingsContext.Provider>
  );
};
