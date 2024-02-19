import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import validator from "validator";

const api = axios.create({ baseURL: "http://localhost:3001" });

function Signin({ updateUserId }) {
  let dialogTimeout;
  let navigate = useNavigate();

  const [user, setUser] = useState({ id: 0, email: "", password: "" });
  const [passwordToMatch, setPasswordToMatch] = useState("");
  const [token, setToken] = useState("");
  const [showDialog, setShowDialog] = useState({
    status: false,
    message: "",
    type: "",
  });

  useEffect(() => {
    checkLogin();
  }, [token]);

  const checkLogin = () => {
    api.get("/api/testToken").then((res) => {
      if (
        res.data.token === "Token is invalid, Please Log in." ||
        res.data.token === null ||
        res.data.token === undefined
      )
        return;
      callDialog("");
      return navigate("/home", { replace: true });
    });
  };

  const callDialog = (message, type, timer) => {
    if (dialogTimeout) {
      clearTimeout(dialogTimeout);
    }
    setShowDialog({
      status: true,
      message: message,
      type: type ? type : "success",
    });
    dialogTimeout = setTimeout(() => {
      setShowDialog({ status: false, message: "", type: "" });
    }, timer || 5000);
  };

  const signup = () => {
    if (!validator.isEmail(user.email))
      return callDialog("The email format is incorrect", "error");

    if (user.password === passwordToMatch) {
      api
        .post("/api/signin", { email: user.email, password: user.password })
        .then((res) => {
          setToken(res.data.token);
          checkLogin();
        })
        .catch((err) => {
          callDialog("Check email or password", "error");
        });
    } else {
      callDialog("Passwords do not match", "error");
    }
  };

  return (
    <>
      <div
        className={`${!showDialog.status ? "hidden" : "fixed"} alert ${
          showDialog.type === "success" ? "alert-success" : "alert-error"
        } shadow-lg  rounded-full z-50 ${
          showDialog.message === "" ? "w-4 h-4" : "w-fit"
        } bottom-8 left-12`}
      >
        <div>
          <span className="font-bold">{showDialog.message}</span>
        </div>
      </div>
      <div className="h-screen mt-36 overflow-y-hidden">
        <span className="flex my-10 text-[#ffffff] min-w-max font-bold text-3xl justify-center items-center align-center">
          <h1>note.ai</h1>
        </span>
        <form onSubmit={signup} className="flex flex-col gap-2 items-center">
          <input
            onChange={(e) => {
              setUser({ ...user, email: e.target.value });
            }}
            max={30}
            placeholder="Email account"
            className="rounded-lg border-[#ffffff] px-6 py-2 w-[200px] sm:w-[350px] text-lg"
            min={5}
          />
          <input
            onChange={(e) => {
              setUser({ ...user, password: e.target.value });
            }}
            min={6}
            max={30}
            type="password"
            placeholder="Password"
            className="rounded-lg  border-[#ffffff] px-6 py-2 w-[200px] sm:w-[350px] text-lg"
          />
          <input
            onChange={(e) => {
              setPasswordToMatch(e.target.value);
            }}
            min={6}
            max={30}
            type="password"
            placeholder="Confirm Password"
            className="rounded-lg border-[#ffffff] px-6 py-2 w-[200px] sm:w-[350px] text-lg"
          />
        </form>
        <div className="flex flex-col justify-center align-center items-center gap-2">
          <button
            onClick={signup}
            className="bg-[#ffffff] mt-4 px-4 py-3 font-bold w-[200px] sm:w-[350px] text-black rounded-xl"
          >
            SIGNUP
          </button>
          <Link to="/login">
            <button
              type="submit"
              className="border-2 border-[#ffffff] font-bold text-[#ffffff] text-md mt-[5px] px-4 py-2 w-[200px] sm:w-[350px] rounded-xl"
            >
              LOGIN{" "}
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}

export default Signin;
