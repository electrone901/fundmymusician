import React, { createContext, useReducer } from 'react';
import AppReducer from './AppReducer';

const inititalState = {
    fmmBlockchain: null
}

export const GlobalContext = createContext(inititalState);

export const GlobalProvider = ({ children }) => {
    const [state, dispatch] = useReducer(AppReducer, inititalState);

    return (<GlobalContext.Provider value={{
        fmmBlockchain: state.fmmBlockchain
    }}>
        {children}
    </GlobalContext.Provider>);
}