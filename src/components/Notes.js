import axios from "axios";
import { useEffect, useState } from "react";
import FeatherButton from "./FeatherButton";

const api = axios.create({ baseURL: process.env.REACT_APP_LOCAL_API });

function Notes() {
  const [newTask, setNewTask] = useState({ newTask: ""  , isCompleted: false });
  const [userId, setUserId] = useState(2);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = () => {
    if (userId === "") return console.log("No user id");

    api
      .get(`/api/notes/${userId}`)
      .then((res) => {
        console.log(res);
        setNotes(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const addTask = () => {
    if (newTask === "") return console.log("no task add a task");
    api
      .post("/api/newNote", { content: newTask.newTask, userId: userId })
      .then((res) => {
        document.getElementById("newTask").value = "";
        fetchNotes();
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex justify-center gap-6 flex-col">
        <input
          id="newTask"
          className="w-full border-2 text-xl bg-transparent px-2 py-2 border-[#ffffff13] focus:border-white "
          placeholder="New task..."
          onChange={(e) => {
            setNewTask({ newTask: e.target.value });
          }}
        />

        {notes
          .slice()
          .reverse()
          .map((note, id) => {
            return (
              <div key={id}>
                <h2 key={id}>{note.content}</h2>
              </div>
            );
          })}

        <h2 className="completed">Read the assigned book for the book </h2>
        <h2 className="completed">
          Review and update the monthly budget spreadsheet.
        </h2>
        <div className="absolute z-50 bottom-6 right-6">
          <button onClick={() => addTask()} className="btn btn-dark">
            Add Task
          </button>
        </div>
      </div>{" "}
    </div>
  );
}

export default Notes;
