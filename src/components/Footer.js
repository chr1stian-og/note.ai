import Progress from "./Progress";
const currentDay = new Date().getDay();
const currentDate = new Date().getDate();
const currentMonth = new Date().getMonth();

function Footer() {
  return (
    // <div className="footer footer center fixed w-full p-40 bg-white">
    //   <center>
    //     <h3 className="absolute bottom-4">
    //       {currentDay}, {currentMonth}
    //       {currentDate}
    //     </h3>
    //   </center>
    // </div>
    <>
      <footer className="z-30 absolute bottom-0 bg-black footer footer-center py-10 text-base-content">
        <aside>
        </aside>
      </footer>
    </>
  );
}

export default Footer;
