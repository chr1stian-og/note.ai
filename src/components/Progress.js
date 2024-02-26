import { useEffect } from "react";

function Progress({ notesTotal, notesCompleted }) {
  const percentage = (notesCompleted / notesTotal) * 100;

  return (
    <>
      <progress
        className="progress w-[150px] rounded-xl h-2 duration-300 transition-all"
        value={percentage}
        max="100"
      ></progress>
    </>
  );
}

export default Progress;
