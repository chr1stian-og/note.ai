import login from "../assets/icons/log-in.svg";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import chevron_right from "../assets/icons/chevron-right.svg";

const api = axios.create({ baseURL: "http://localhost:3001" });

function Navbar() {
  const navigat = useNavigate();

  const signout = () => {
    api
      .get("/api/signout")
      .then((res) => {
        if (
          res.data.token === "Token is invalid, Please Log in." ||
          res.data.token === null ||
          res.data.token === undefined
        ) {
          window.open("http://localhost:3000/", "_self");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
  return (
    <>
      <div className="navbar">
        <div className="navbar-start">
          <a className="hover:cursor-default ml-4 font-bold text-white text-xl">
            note.ai - llama2
          </a>
        </div>
        <div className="navbar-end">
          <button
            onClick={signout}
            className="hover:bg-[#ffffff10] rounded-full p-4 duration-150 transition-all"
          >
            <img src={login} />
          </button>
        </div>
      </div>

      
    </>
  );
}

export default Navbar;
