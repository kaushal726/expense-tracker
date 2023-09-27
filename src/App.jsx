import "./App.css";
import React from "react";
import { Header } from "./Components/Header";
import { Balance } from "./Components/Balance";
import { IncomeExpenses } from "./Components/IncomeExpenses";
import { TransitionList } from "./Components/TransitionList";
import { AddTransition } from "./Components/AddTransition";
import { GlobalProvider } from "./Context/GlobalState";

function App() {
  return (
    <GlobalProvider>
      <Header />
      <div className="container">
        <Balance />
        <IncomeExpenses />
        <TransitionList />
        <AddTransition />
      </div>
    </GlobalProvider>
  );
}

export default App;
