function Progress() {
  return (
    <>
      <progress
        className="progress w-full rounded-xl h-2"
        value={15}
        max="100"
      ></progress>
    </>
  );
}

export default Progress;
