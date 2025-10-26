import { useContext } from 'react';
import { DataContext } from './index';

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a StorageContextProvider');
  }
  return context;
};
