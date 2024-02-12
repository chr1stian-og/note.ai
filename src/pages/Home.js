import Navbar from "../components/Navbar";

function Home() {
  return (
    <>
      <Navbar />
      {/* <div className="flex flex-row justify-center mt-10">
        <h1 className="text-3xl text-white font-bold ">note.ai</h1>
      </div> */}
      <div className="h-screen justify-center align-center flex flex-col">
        <center>
          <h1>Note 1</h1>
          <h1>Note 2</h1>
          <h1>Note 3</h1>
          <h1>Note 4</h1>
          <h1>Note 5</h1>
          <h1>Note 6</h1>
          <h1>...</h1>
        </center>
      </div>
    </>
  );
}

export default Home;
