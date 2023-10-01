import React, { useContext } from "react";
import { GlobalContext } from "../Context/GlobalState";

export const IncomeExpenses = () => {
  const { transactions } = useContext(GlobalContext);
  const expense = transactions.reduce((acc, transaction) => {
    transaction.amount < 0 && (acc += transaction.amount);
    return acc;
  }, 0);

  const income = transactions.reduce((acc, transaction) => {
    transaction.amount > 0 && (acc += transaction.amount);
    return acc;
  }, 0);
  return (
    <div className="inc-exp-container w-4/5  h-36 mt-12 ">
      <div className="bg-green-200 rounded-3xl mr-1 flex flex-col justify-center items-center">
        <h4 className="font-bold">Income</h4>
        <p id="money-plus" className=" font-bold money plus">
          +₹{income}
        </p>
      </div>
      <div className="bg-red-200 rounded-3xl ml-1 flex flex-col justify-center items-center">
        <h4 className="font-bold">Expense</h4>
        <p id="money-minus" className="font-bold money minus">
          -₹{expense * -1}
        </p>
      </div>
    </div>
  );
};
