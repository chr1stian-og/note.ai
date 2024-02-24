import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import Signin from "../pages/Signin";
import Home from "../pages/Home";
import { useState } from "react";

function RoutesComponent() {
  const [user, setUser] = useState({ id: 0, email: "", password: "" });

  const updateUserId = (newId) => {
    setUser((prevUser) => ({ ...prevUser, id: newId }));
  };

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={<Login user={user} updateUserId={updateUserId} />}
        />
        <Route
          path="/signin"
          element={<Signin user={user} updateUserId={updateUserId} />}
        />
        <Route path="/" element={<Home user={user} />} />
        <Route path="/home" element={<Home user={user} />} />
      </Routes>
    </>
  );
}

export default RoutesComponent;
