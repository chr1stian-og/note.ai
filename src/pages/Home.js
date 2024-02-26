import Navbar from "../components/Navbar";
import Notes from "../components/Notes";
import Footer from "../components/Footer";

function Home({ user }) {
  return (
    <div className="h-screen overflow-y-hidden">
      <Navbar />
      <Notes user={user} />
      <Footer />
    </div>
  );
}

export default Home;
