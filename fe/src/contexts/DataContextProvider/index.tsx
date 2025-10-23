"use client"

import React from "react";
import type { DataContextProps } from './storageContext';
import { DataContext } from "./dataContext";

export interface LearnaProviderProps {
    value: DataContextProps;
    children: React.ReactNode;
}

export const DataContextProvider = ({ value, children } : LearnaProviderProps) => {
    return(
        <DataContext.Provider value={value}>
            { children }
        </DataContext.Provider>
    );
}

