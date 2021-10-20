import axios from "axios";
import React, { useState, useEffect } from "react";

//Daily diff change
const getColor = (change) => {
  if (change == 0) {
    return "yellow";
  } else if (change > 0) {
    return "green";
  } else {
    return "red";
  }
};
function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [username, setUsername] = useState("");
  const refreshLeaderboard = () => {
    axios
      .get("/leaderboard", { params: { username: username } })
      .then((response) => setLeaderboardData(response.data));
  };

  return (
    <div className="container">
      <div>
        <input
          placeholder="vrawetd0"
          onChange={(e) => setUsername(e.target.value)}
        />
        <button className="btn btn-secondary m-2 " onClick={refreshLeaderboard}>
          Search
        </button>
        <button className="btn btn-secondary m-2 " onClick={refreshLeaderboard}>
          Refresh
        </button>
        <div className="mb-2"></div>
      </div>
      <table className="table table-dark">
        <thead>
          <tr>
            <th>Rank</th>

            <th scope="colSpan">Country</th>
            <th scope="colSpan">Username</th>
            <th scope="colSpan">Money</th>
            <th scope="colSpan">Daily Diff</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((data) => (
            <tr
              style={{
                color: data.player.username == username ? "aqua" : "white",
              }}
            >
              <th scope="row">{data.rank}</th>

              <td>{data.player.country}</td>
              <td>{data.player.username}</td>
              <td>{data.player.money} $</td>
              <td style={{ color: getColor(data.change) }}>{data.change} </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
