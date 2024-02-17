import React, { useState } from "react";
import axios from "axios";

const api = axios.create({ baseURL: process.env.REACT_APP_LOCAL_API });

const FeatherButton = ({ newTask }) => {
  const [task, setTask] = useState(""); // Use useState inside the functional component

  const addTask = () => {
    console.log(task);
  };

  return (
    <div className="absolute z-50 bottom-6 right-6">
      <button onClick={addTask} className="btn btn-dark">
        Add Task
      </button>
    </div>
  );
};

export default FeatherButton;
