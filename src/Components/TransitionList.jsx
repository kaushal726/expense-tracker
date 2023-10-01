import React, { useContext } from "react";
import { GlobalContext } from "../Context/GlobalState";
import { Transition } from "./Transition";
export const TransitionList = () => {
  const { transactions } = useContext(GlobalContext);
  return (
    <div className="w-3/4  my-8">
      <h3 className="text-3xl font-bold">History</h3>
      <ul className="list h-72 overflow-y-auto p-5 fancy-scrollbar scroll-smooth w-full">
        {transactions.map((transaction) => (
          <Transition key={transaction.id} transaction={transaction} />
        ))}
      </ul>
    </div>
  );
};
