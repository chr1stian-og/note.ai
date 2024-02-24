import { useEffect } from "react";

function Progress({ notesTotal, notesCompleted }) {
  return (
    <>
      <progress
        className="progress w-[150px] rounded-xl h-2"
        value={notesTotal - notesCompleted || 0}
        max="100"
      ></progress>
    </>
  );
}

export default Progress;
