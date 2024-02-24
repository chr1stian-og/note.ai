import login from "../assets/icons/log-in.svg";
import axios from "axios";

// const api = axios.create({ baseURL: "http://localhost:3001" });
const api = axios.create({ baseURL: process.env.REACT_APP_LOCAL_API });

function Navbar() {
  const signout = () => {
    api
      .get("/api/signout")
      .then((res) => {
        if (
          res.data.token === "Token is invalid, Please Log in." ||
          res.data.token === null ||
          res.data.token === undefined
        ) {
          window.open(process.env.REACT_APP_REMOTE_URL, "_self");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
  return (
    <div className="navbar fixed bg-black z-50">
      <div className="navbar-start">
        <a className="hover:cursor-default ml-6 font-bold text-white text-xl">
          <span className="text-2xl">note.ai</span> v1.0.2
        </a>
      </div>
      <div className="navbar-end">
        <div
          onClick={signout}
          className="hover:bg-[#ffffff10] hover:cursor-pointer mr-6 rounded-full p-4 duration-150 transition-all"
        >
          <img src={login} className="hover:cursor-pointer" />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
