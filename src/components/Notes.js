import axios from "axios";
import { useEffect, useState, useRef } from "react";
import FeatherButton from "./FeatherButton";
import feather from "../assets/icons/feather.svg";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import check from "../assets/icons/check.svg";
import x from "../assets/icons/x.svg";
import Progress from "./Progress";

//Glabal Variables
const loading = require("../assets/loading.gif");

const api = axios.create({ baseURL: process.env.REACT_APP_LOCAL_API });
// const ai_api = axios.create({ baseURL: "http://localhost:11434/" });
const ai_api = axios.create({
  baseURL: "https://92ac-35-199-151-168.ngrok-free.app/",
});

function Notes() {
  const inputRef = useRef(null);
  let dialogTimeout;
  let navigate = useNavigate();

  //states
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newTask, setNewTask] = useState({ newTask: "", isCompleted: false });
  const [notes, setNotes] = useState([]);
  const [notesAi, setNotesAi] = useState([]);
  const notesTotal = notes.length;
  const notesCompleted = notes.filter((note) => note.isCompleted === 1).length;
  const [user, setUser] = useState({ id: 0 });
  const [token, setToken] = useState("");
  const [llamaResponse, setLlamaResponse] = useState("");
  const [showDialog, setShowDialog] = useState({
    status: false,
    message: "",
    type: "",
  });

  // const socket = io("https://christianmacarthur:3004/", {
  //   extraHeaders: {
  //     Authorization: token,
  //   },
  // });

  useEffect(() => {
    inputRef.current.focus();
    isLogged();
    fetchNotes();
  }, [user.id, token]);

  const llama = async () => {
    callDialog("The AI model is not operating.", "error");
    // var notesObjects = [];
    // for (var i = notes.length - 1; i >= 0; i--) {
    //   notesObjects.push(notes[i].content);
    // }
    // const prompt =
    //   "Organize the following list of tasks based on priority, just return the tasks: " +
    //   JSON.stringify(notesObjects);
    // console.log(prompt);
    // await ai_api
    //   .post("/api/generate", { model: "llama2", prompt: prompt, stream: false })
    //   .then((res) => {
    //     console.log(res.data.response);
    //     setNotesAi(res.data.response.split(", "));
    //     callDialog("", "success", 0);
    //     setLlamaResponse(res.data.response);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //     callDialog("Couldn't get a llama response", "error");
    //   });
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
        callDialog("", "error", 0);
        navigate("/login", { replace: true });
      });
    callDialog("", "success", 0);
  };

  const callDialog = (message, type, timer) => {
    //so that the dialog stays on permanently
    if (timer !== 0) {
      if (dialogTimeout) {
        clearTimeout(dialogTimeout);
      }
      dialogTimeout = setTimeout(() => {
        setShowDialog({ status: false, message: "", type: "" });
      }, timer || 5000);
    }
    setShowDialog({
      status: true,
      message: message,
      type: type ? type : "success",
    });
  };

  // const fetchNotesSockets = () => {
  //   const userId = user.id;
  //   socket.emit("clientData", userId);

  //   socket.on("serverData", (res) => {
  //     setNotes(res);
  //   });

  //   return () => {
  //     socket.disconnect();
  //   };
  // };

  // const addTaskSockets = () => {
  //   if (newTask === "") return alert("Add your task first");
  //   socket.emit("newTask", { newTask: newTask.newTask, userId: user.id });
  //   fetchNotesSockets();
  // };

  // const udpdateTaskSockets = (id) => {
  //   socket.emit("updateTask", { id: id, userId: user.id });
  //   fetchNotesSockets();
  // };

  const fetchNotes = () => {
    api
      .get(`/api/notes/${user.id}`, { headers: { authorization: token } })
      .then((res) => {
        setNotes(res.data);
        callDialog("", "success", 0);
      })
      .catch((err) => {
        callDialog("", "error");
        console.log(err);
      });
  };

  const addTask = () => {
    if (newTask.newTask === "")
      return callDialog("Write your task first", "error");
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
        fetchNotes();
      })
      .catch((err) => {
        console.log(err);
        callDialog("", "error");
      });
  };

  const updateTask = (updatedTask, noteId) => {
    if (updatedTask === "") return callDialog("Write your task first", "error");

    api
      .post(
        "/api/updateNote",
        {
          content: updatedTask,
          noteId: noteId,
        },
        { headers: { authorization: token } }
      )
      .then((res) => {
        fetchNotes();
      })
      .catch((err) => {
        console.log(err);
        callDialog("", "error");
      });
  };

  const finishTask = (noteId) => {
    api
      .post(
        "/api/completeNote",
        { noteId: noteId },
        { headers: { authorization: token } }
      )
      .then((res) => {
        fetchNotes();
      })
      .catch((err) => {
        callDialog("Couldn't finish the task", "error");
        console.log(err);
      });
  };

  const deleteTask = (noteId) => {
    api
      .post(
        "/api/deleteNote",
        { noteId: noteId },
        { headers: { authorization: token } }
      )
      .then((res) => {
        fetchNotes();
      })
      .catch((err) => {
        callDialog("Couldn't delete the task", "error");
        console.log(err);
      });
  };

  //automatically deletes passed 24 hours
  const autoDeleteTask = (noteId) => {
    api
      .post(
        "/api/deleteNote",
        { noteId: noteId },
        { headers: { authorization: token } }
      )
      .then((res) => {
        callDialog(res.data.message);
        fetchNotes();
      })
      .catch((err) => {
        callDialog("Couldn't delete the task", "error");
        console.log(err);
      });
  };

  //hangle the Enter key response
  function handleKeyDown(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      addTask();
    }
  }

  return (
    <>
      <div
        className={`${!showDialog.status ? "hidden" : "fixed"} alert ${
          showDialog.type === "success" ? "alert-success" : "alert-error"
        } shadow-lg  rounded-full z-50 ${
          showDialog.message === "" ? "w-4 h-4" : "w-fit"
        } bottom-8 left-6`}
      >
        <div>
          <span className="font-bold">{showDialog.message}</span>
        </div>
      </div>
      <div className="flex justify-center my-20 items-center align-center flex-col duration-150 transition-all">
        <div className="flex gap-2 flex-row">
          <div className="flex justify-center mx-10 items-center align-center flex-col duration-150 transition-all">
            {notes.length > 0 ? (
              notes
                .slice()
                .reverse()
                .map((note, id) => {
                  var updatedNote = note.content;
                  return (
                    <div
                      draggable
                      key={id}
                      className="min-w-[200px] flex flex-row items-center"
                    >
                      <span
                        onClick={() => deleteTask(note.id)}
                        className={` ${
                          notes.length !== 0 ? "w-[200px]" : "w-[50px]"
                        } flex justify-end p-5 align-center duration-300 transition-all items-center opacity-0 hover:opacity-100 hover:cursor-pointer `}
                      >
                        <img
                          src={x}
                          width={15}
                          className="duration-300 transition-all"
                        />
                      </span>

                      <h2
                        key={id}
                        // onKeyDown={handleKeyDown}
                        className={`${
                          note.isCompleted === 0 ? "" : "completed"
                        } px-5 py-2 `}
                        onClick={() => {
                          note.isCompleted === 0 && setIsEditing(true);
                        }}
                        onBlur={() => updateTask(updatedNote, note.id)}
                        contentEditable={isEditing}
                        onInput={(e) => {
                          updatedNote = e.target.textContent;
                        }}
                      >
                        {note.content}
                      </h2>
                      <span
                        onClick={() => finishTask(note.id)}
                        className={`${
                          notes.length !== 0 ? "w-[200px]" : "w-[50px]"
                        } flex justify-start p-5 align-center duration-300 transition-all items-center opacity-0 hover:opacity-100 hover:cursor-pointer`}
                      >
                        <img
                          src={check}
                          width={15}
                          className=" duration-300 transition-all"
                        />
                      </span>
                    </div>
                  );
                })
            ) : (
              <div className="flex flex-row items-center">
                {/* <h2>Click below to create a new note</h2> */}
              </div>
            )}
          </div>

          {notesAi.length !== 0 && (
            <div className="flex justify-center mx-10 items-center align-center flex-col duration-150 transition-all">
              {notesAi.length > 0 ? (
                notes
                  .slice()
                  .reverse()
                  .map((note, id) => {
                    return (
                      <div
                        key={id}
                        className=" min-w-[200px] flex flex-row items-center"
                      >
                        <span
                          onClick={() => deleteTask(note.id)}
                          className={`${
                            notes.length !== 0 ? "w-[200px]" : "w-[50px]"
                          } flex justify-end p-5 align-center duration-300 transition-all items-center opacity-0 hover:opacity-100 hover:cursor-pointer`}
                        >
                          <img
                            src={x}
                            width={15}
                            className=" duration-300 transition-all"
                          />
                        </span>

                        <h2
                          key={id}
                          className={`${
                            note.isCompleted === 0 ? "" : "completed"
                          }`}
                        >
                          {note.content}
                        </h2>
                        <span
                          onClick={() => finishTask(note.id)}
                          className={`${
                            notes.length !== 0 ? "w-[200px]" : "w-[50px]"
                          } flex justify-start p-5 align-center duration-300 transition-all items-center opacity-0 hover:opacity-100 hover:cursor-pointer`}
                        >
                          <img
                            src={check}
                            width={15}
                            className="duration-300 transition-all"
                          />
                        </span>
                      </div>
                    );
                  })
              ) : (
                <div className="flex flex-row items-center">
                  {/* <h2>Click below to create a new note</h2> */}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-row items-center">
          <h2>{llamaResponse}</h2>
        </div>
        <div className="absolute z-50 bottom-8 w-full flex justify-center">
          <input
            ref={inputRef}
            onKeyDown={handleKeyDown}
            id="newTask"
            className=" border-[#ffffff1c] hover:border-[#ffffff28] z-50 bg-transparent rounded-lg focus:w-[500px] focus:cursor-text focus:h-full cursor-default border-8 h-1 focus:border-transparent duration-150 transition-all"
            placeholder=""
            onChange={(e) => {
              setNewTask({ newTask: e.target.value });
            }}
          />
        </div>
      </div>
      <div className="absolute z-50 bottom-8 right-6">
        <button
          onClick={llama}
          className="hover:bg-[#ffffff10] rounded-full p-4 duration-150 transition-all"
        >
          <img src={feather} width={35} />
        </button>
      </div>
      <div className="absolute z-50 top-8 w-full flex justify-center">
        <Progress notesTotal={notesTotal} notesCompleted={notesCompleted} />
      </div>
    </>
  );
}

export default Notes;
