import Navbar from "../components/Navbar";
import Notes from "../components/Notes";
import FeatherButton from "../components/FeatherButton";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function Home({ user }) {
  let navigate = useNavigate();

  // useEffect(() => {
  //   if (user.id === 0) return navigate("/login", { replace: true });
  // }, [user]);

  return (
    <div className="h-screen overflow-y-hidden">
      <Navbar />
      <Notes user={user} />
      {/* <FeatherButton /> */}
      <Footer />
    </div>
  );
}

export default Home;
