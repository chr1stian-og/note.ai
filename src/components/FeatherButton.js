const newTask = () => {
  alert("New Task Added");
};
function FeatherButton() {
  return (
    <div className="absolute z-50 bottom-6 right-6">
      <button onClick={newTask} className="btn btn-dark">
        Click Me
      </button>
    </div>
  );
}

export default FeatherButton;
