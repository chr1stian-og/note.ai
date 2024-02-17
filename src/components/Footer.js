const currentDay = new Date().getDay();
const currentDate = new Date().getDate();
const currentMonth = new Date().getMonth();

function Footer() {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <center>
        <h3 className="absolute bottom-4">
          {currentDay}, {currentMonth}
          {currentDate}
        </h3>
      </center>
    </div>
  );
}

export default Footer;
