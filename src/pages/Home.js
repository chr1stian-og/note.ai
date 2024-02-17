import Navbar from "../components/Navbar";
import Notes from "../components/Notes";
import FeatherButton from "../components/FeatherButton";
import Footer from "../components/Footer";
function Home() {
  return (
    <div>
      <Navbar />
      <Notes />
      <FeatherButton />
      {/* <Footer /> */}
    </div>
  );
}

export default Home;
