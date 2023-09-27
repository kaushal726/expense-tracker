import React, { useContext } from "react";
import { GlobalContext } from "../Context/GlobalState";

export const Transition = ({ transaction }) => {
  const { deleteTransition } = useContext(GlobalContext);

  const sign = transaction.amount > 0 ? "+" : "-";
  return (
    <div>
      <li className={transaction.amount > 0 ? "plus" : "minus"}>
        {transaction.text}{" "}
        <span>
          {sign}
          {Math.abs(transaction.amount)}
        </span>
        <button
          onClick={() => deleteTransition(transaction.id)}
          className="delete-btn"
        >
          x
        </button>
      </li>
    </div>
  );
};
