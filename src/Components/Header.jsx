import React from "react";
import bgImage from "../assets/19198913.jpg";
export const Header = () => {
  return (
    <>
      <div className="flex justify-center items-center w-full">
        <img className=" flex-start w-28" src={bgImage} />
        <h2 className=" w-full text-left p-2 md:p-4 head md:text-5xl  text-3xl">
          Expense Tracker
        </h2>
      </div>
    </>
  );
};
