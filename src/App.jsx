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
    <div className="h-screen overflow-y-auto  fancy-scrollbar scroll-smooth w-full">
      <GlobalProvider>
        <div className="flex flex-col w-full items-center justify-center ">
          <Header />
          <div className="container md:px-20 flex flex-col w-full items-center justify-center">
            <Balance />
            <IncomeExpenses />
            <TransitionList />
            <AddTransition />
          </div>
        </div>
      </GlobalProvider>
    </div>
  );
}

export default App;
