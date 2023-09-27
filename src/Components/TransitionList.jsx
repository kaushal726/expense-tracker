import React, { useContext } from "react";
import { GlobalContext } from "../Context/GlobalState";
import { Transition } from "./Transition";
export const TransitionList = () => {
  const { transactions } = useContext(GlobalContext);
  return (
    <div>
      <h3>History</h3>
      <ul className="list">
        {transactions.map((transaction) => (
          <Transition key={transaction.id} transaction={transaction} />
        ))}
      </ul>
    </div>
  );
};
