import React, { createContext, useEffect, useReducer, useRef } from "react";
import AppReducer from "./AppReducer";

const initialState = {
  transactions: [],
};

export const GlobalContext = createContext(initialState);

export const GlobalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AppReducer, initialState);
  const isInitialRender = useRef(true);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("transactions"));
    if (items) {
      dispatch({
        type: "SET_LOCALSTORAGE_VALUE",
        payload: items,
      });
    }
  }, []);

  useEffect(() => {
    if (!isInitialRender.current) {
      localStorage.setItem("transactions", JSON.stringify(state.transactions));
    } else {
      isInitialRender.current = false;
    }
  }, [state.transactions]);

  function deleteTransition(id) {
    dispatch({
      type: "DELETE_TRANSACTION",
      payload: id,
    });
  }

  function createTransition(transaction) {
    dispatch({
      type: "CREATE_TRANSACTION",
      payload: transaction,
    });
  }

  return (
    <GlobalContext.Provider
      value={{
        transactions: state.transactions,
        deleteTransition,
        createTransition,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
