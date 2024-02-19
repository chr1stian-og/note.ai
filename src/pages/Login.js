import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import validator from "validator";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:3001" });

function Login({ updateUserId }) {
  let navigate = useNavigate();

  const [user, setUser] = useState({ id: 0, email: "", password: "" });
  const [token, setToken] = useState("");

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
      return navigate("/home", { replace: true });
    });
  };

  const login = async () => {
    if (!validator.isEmail(user.email))
      return alert("the email format is incorrect");

    if (user.password.length === 0) {
      return alert(" Type in a password");
    }
    api
      .post("/api/login", { email: user.email, password: user.password })
      .then((res) => {
        updateUserId(res.data.id);
        setToken(res.data.token);
        checkLogin();
      })
      .catch((err) => {
        alert("Incorret email or password");
      });
  };

  return (
    <div className="h-screen mt-36 overflow-y-hidden">
      <span className="flex my-10 text-[#ffffff] min-w-max font-bold text-3xl justify-center items-center align-center">
        <h1>note.ai</h1>
      </span>

      <form
        onSubmit={() => login()}
        className="flex flex-col gap-2 items-center"
      >
        <input
          onChange={(e) => {
            setUser({ ...user, email: e.target.value });
          }}
          max={30}
          placeholder="Email"
          className="rounded-lg border-[#ffffff] px-6 py-2 w-[200px] sm:w-[350px] text-lg"
          min={5}
        />
        <input
          onChange={(e) => {
            setUser({ ...user, password: e.target.value });
          }}
          min={5}
          max={30}
          autoComplete="true"
          type="password"
          placeholder="Password"
          className="rounded-lg border-[#ffffff] px-6 py-2 w-[200px] sm:w-[350px] text-lg"
        />
      </form>
      <div className="flex flex-col justify-center align-center items-center gap-2 m-2">
        <button
          onClick={login}
          className="bg-[#ffffff]  px-4 py-2 w-[200px] sm:w-[350px] text-black font-bold  rounded-xl"
        >
          LOGIN
        </button>

        <Link to="/signin">
          <button
            type="submit"
            className="border-[#ffffff] text-[#ffffff] border-2 font-bold  px-4 py-2 w-[200px] sm:w-[350px] rounded-xl"
          >
            SIGNUP{" "}
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Login;
