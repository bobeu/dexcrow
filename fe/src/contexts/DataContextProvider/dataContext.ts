import React from "react";
import type { DataContextProps } from './storageContext';

export const DataContext = React.createContext<DataContextProps | null>(null);
