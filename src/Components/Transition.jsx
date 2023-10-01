import React, { useContext } from "react";
import { GlobalContext } from "../Context/GlobalState";

export const Transition = ({ transaction }) => {
  const { deleteTransition } = useContext(GlobalContext);
  let a = new Date(transaction.id * 1000);
  let months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  let year = a.getFullYear();
  let month = months[a.getMonth()];
  let date = a.getDate();
  let hour = a.getHours();
  let min = a.getMinutes();
  let sec = a.getSeconds();
  let time =
    date + " " + month + " " + year + " " + hour + ":" + min + ":" + sec;
  const sign = transaction.amount > 0 ? "+" : "-";
  const bgColor =
    transaction.amount > 0 ? " border-green-700" : "border-red-700";
  return (
    <div className={`w-full `}>
      <li className={` border-2 rounded-md  ${bgColor}`}>
        <span className="text-lg font-semibold">
          {transaction.text}
          <span className=" text-xs font-light">
            {""} ({time})
          </span>
        </span>
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
