import React, { useContext } from "react";
import { GlobalContext } from "../Context/GlobalState";

export const Balance = () => {
  const { transactions } = useContext(GlobalContext);
  const amounts = transactions.map((transaction) => transaction.amount);

  const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
  return (
    <div className="balance-background w-3/4 flex items-start flex-col justify-center p-3 pl-5 h-40  rounded-xl text-white">
      <h1 className="text-5xl font-bold" id="balance">
        ₹{total}
      </h1>
    </div>
  );
};
