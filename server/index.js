const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = express();
const PlayerModel = require("./models/Player");
const PoolModel = require("./models/Pool");
const redis = require("redis");
const client = redis.createClient();

const PORT = process.env.PORT || 5000;

//Print redis connection error
client.on("error", (err) => {
  console.log(err);
});

dotenv.config();
//Copying players to redis
const addToRedis = () => {
  PlayerModel.find({})
    .sort({
      money: -1,
    })
    .exec((err, doc) => {
      let i = 1;
      //Clear Redis
      client.flushdb();
      //Add players to redis
      doc.forEach((item) => {
        client.zadd("players", i, item.username);
        i++;
      });
    });
};
//Define the prize pool
const createPool = () => {
  PoolModel.count(async (err, count) => {
    if (count == 0) {
      const pool = new PoolModel({
        pool: 0,
      });
      await pool.save();
    }
  });
};
// Connect to Mongo
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database is connected");
    createPool();
    addToRedis();
  })
  .catch((err) => console.log(err));
//add money to given user

app.post("/earnmoney", (req, noderesponse) => {
  const userId = req.body.userId;
  const amount = req.body.amount;
  PoolModel.updateMany(
    {},
    {
      $inc: {
        pool: amount * 0.02,
      },
    }
  ).then((res) => {
    PlayerModel.findOneAndUpdate(
      { _id: userId },
      {
        $inc: {
          money: amount,
        },
      }
    ).then((respons) => {
      noderesponse.json({ message: "ok" });
    });
  });
});

//Brings leaderboard and ranking for given username
app.get("/leaderboard", (request, response) => {
  response.setHeader("Content-Type", "application/json");
  const username = request.query.username;

  //Ranking top 100 players
  PlayerModel.find({})
    .sort({
      money: -1,
    })
    .limit(100)
    .exec((err, doc) => {
      let i = 1;
      let in100 = false;
      let array = [];
      doc.forEach((item) => {
        //Sort by money
        client.zscore("players", item.username, (err, res) => {
          const tmp = {
            player: item,
            change: res - i,
            rank: i,
          };

          if (item.username == username) {
            in100 = true;
          }
          array.push(tmp);

          i++;
          if (in100 && i == 101) {
            response.json(array);
          }
        });
      });

      if (!in100) {
        PlayerModel.find({})
          .sort({
            money: -1,
          })
          .skip(100)
          .exec((err, players) => {
            players.forEach((player, j) => {
              if (player.username == username) {
                const array2 = [j - 3, j - 2, j - 1, j, j + 1, j + 2];
                array2.forEach((index) => {
                  client.zscore(
                    "players",
                    players[index].username,
                    (err, res) => {
                      const tmp = {
                        player: players[index],
                        change: res - (index + 101),
                        rank: index + 101,
                      };

                      array.push(tmp);

                      if (array.length == 106) {
                        response.json(array);
                      }
                    }
                  );
                });
              }
            });
          });
      }
    });
});

//Add new player
app.post("/newplayer", async (req, res) => {
  try {
    const newPlayer = new PlayerModel({
      username: req.body.username,
      country: req.body.country,
      money: req.body.money,
    });

    const player = await newPlayer.save();
    res.status(200).json(player);

    if (client.connected) {
      const data = JSON.stringify(player);
      client.set(player.username, data, (err, res) => {});
    }
  } catch (err) {
    console.log(err);
  }
});
//Weekly prize distribution
const checkForDay = () => {
  const date = new Date();
  if (date.getDate() == 0) {
    PoolModel.findOne().then((pool) => {
      PlayerModel.find()
        .sort({ money: 1 })
        .limit(100)
        .exec((err, res) => {
          //Pool prize distribution
          res.forEach((player, i) => {
            if (i == 0) {
              player.money += pool.pool * 0.2;
            } else if (i == 1) {
              player.money += pool.pool * 0.15;
            } else if (i == 2) {
              player.money += pool.pool * 0.1;
            } else {
              const value = (pool.pool * 0.55) / 97 + 0.001 * (53 - i);
              player.money += value;
            }
            player.update();
          });
          PoolModel.updateMany(
            {},
            {
              pool: 0,
            }
          );
        });
    });
  }
};

app.listen(PORT, () => {
  console.log("Server is connected!");
  //Start Timer, Refresh once a day
  setInterval(() => {
    checkForDay();
    addToRedis();
  }, 24 * 60 * 60 * 1000);
});
