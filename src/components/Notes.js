import axios from "axios";
import { useEffect, useState } from "react";
import FeatherButton from "./FeatherButton";
import feather from "../assets/icons/feather.svg";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Progress from "./Progress";

const api = axios.create({ baseURL: "https://christianmacarthur.com:3004/" });
// const ai_api = axios.create({ baseURL: "http://localhost:11434/" });
const ai_api = axios.create({
  baseURL: "https://fc11-34-27-14-41.ngrok-free.app/",
});

function Notes() {
  let dialogTimeout;
  let navigate = useNavigate();

  const [newTask, setNewTask] = useState({ newTask: "", isCompleted: false });
  const [notes, setNotes] = useState([]);
  const [user, setUser] = useState({ id: 0 });
  const [token, setToken] = useState("");
  const [llamaResponse, setLlamaResponse] = useState("");
  const [showDialog, setShowDialog] = useState({
    status: false,
    message: "",
    type: "",
  });
  const socket = io("https://christianmacarthur:3005/", {
    extraHeaders: {
      Authorization: token,
    },
  });

  useEffect(() => {
    isLogged();
    // fetchNotesSockets();
    fetchNotes();
  }, [user.id, token]);

  const llama = async () => {
    const prompt = newTask.newTask;
    await ai_api
      .post("/api/generate", { model: "llama2", prompt: prompt, stream: false })
      .then((res) => {
        console.log(res.data.response);
        callDialog("");
        setLlamaResponse(res.data.response);
      })
      .catch((err) => {
        console.log(err);
        callDialog("Couldn't get a llama response", "error");
      });
  };

  const isLogged = () => {
    api
      .get("/api/testToken")
      .then((res) => {
        if (
          res.data.token === "Token is invalid, Please Log in." ||
          res.data.token === null ||
          res.data.token === undefined
        )
          return navigate("/login", { replace: true });
        setUser({ id: res.data.id });
        setToken(res.data.token);
      })
      .catch((err) => {
        console.log(err);
        callDialog("", "error");
        navigate("/login", { replace: true });
      });
    callDialog("");
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

  const fetchNotesSockets = () => {
    const userId = user.id;
    socket.emit("clientData", userId);

    socket.on("serverData", (res) => {
      setNotes(res);
    });

    return () => {
      socket.disconnect();
    };
  };

  const addTaskSockets = () => {
    if (newTask === "") return alert("Add your task first");
    socket.emit("newTask", { newTask: newTask.newTask, userId: user.id });
    fetchNotesSockets();
  };

  const udpdateTaskSockets = (id) => {
    socket.emit("updateTask", { id: id, userId: user.id });
    fetchNotesSockets();
  };

  const fetchNotes = () => {
    api
      .get(`/api/notes/${user.id}`, { headers: { authorization: token } })
      .then((res) => {
        setNotes(res.data);
      })
      .catch((err) => {
        callDialog("", "error");
        console.log(err);
      });
  };

  const addTask = () => {
    if (newTask === "") return alert("Add your task first");
    api
      .post(
        "/api/newNote",
        {
          content: newTask.newTask,
          userId: user.id,
          isCompleted: 0,
        },
        { headers: { authorization: token } }
      )
      .then((res) => {
        document.getElementById("newTask").value = "";
        fetchNotesSockets();
      })
      .catch((err) => {
        console.err(err);
        callDialog("", "error");
      });
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
      <div className="flex justify-center items-center h-screen">
        <form
          onSubmit={() => addTask()}
          className="flex justify-center gap-4 flex-col duration-150 transition-all"
        >
          {/* <div className="flex flex-row items-center">
              <Progress />
            </div> */}

          {notes.length > 0 ? (
            notes
              .slice()
              .reverse()
              .map((note, id) => (
                <div key={id}>
                  <h2
                    key={id}
                    className={`${note.isCompleted === 0 ? "" : "completed"}`}
                  >
                    {note.content}
                  </h2>
                </div>
              ))
          ) : (
            <div className="flex flex-row items-center">
              {/* <h2>Click the button to create a new note</h2> */}
            </div>
          )}

          <div className="flex flex-row items-center">
            <h2>{llamaResponse}</h2>
          </div>

          <input
            id="newTask"
            className="border-[#ffffff1c] bg-transparent rounded-lg focus:cursor-text focus:h-full cursor-default border-8 h-1 focus:border-transparent duration-150 transition-all"
            placeholder=""
            onChange={(e) => {
              setNewTask({ newTask: e.target.value });
            }}
          />
        </form>
        <div className="absolute z-50 bottom-8 right-12">
          <button
            onClick={llama}
            className="hover:bg-[#ffffff10] rounded-full p-4 duration-150 transition-all"
          >
            <img src={feather} width={35} />
          </button>
        </div>
      </div>
    </>
  );
}

export default Notes;
