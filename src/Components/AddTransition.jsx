import React, { useState } from "react";
import { useContext } from "react";
import { GlobalContext } from "../Context/GlobalState";
export const AddTransition = () => {
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const { createTransition } = useContext(GlobalContext);

  function addTransition(e) {
    e.preventDefault();
    let value = {
      text: text,
      amount: +amount,
      id: Math.floor(Date.now() / 1000),
    };
    createTransition(value);
    setAmount("");
    setText("");
  }
  return (
    <div className="w-3/4">
      <h3 className="text-3xl font-bold">Add new transaction</h3>
      <form id="form" onSubmit={addTransition}>
        <div className="form-control">
          <label htmlFor="text">Text</label>
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            id="text"
            placeholder="Enter text..."
            required
          />
        </div>
        <div className="form-control">
          <label htmlFor="amount">
            Amount <br />
            (negative - expense, positive - income)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
            }}
            id="amount"
            placeholder="Enter amount..."
            required
          />
        </div>
        <button className="btn flex justify-center items-center">
          Add transaction
        </button>
      </form>
    </div>
  );
};
