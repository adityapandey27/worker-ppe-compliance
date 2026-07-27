const mongoose = require("mongoose");

const uri =
  "mongodb+srv://adityapandeycyber272002:adityapandeycyber@cybercluster.v5iigzi.mongodb.net/workerPpe?retryWrites=true&w=majority&appName=cybercluster";

mongoose
  .connect(uri)
  .then(() => {
    console.log("Connected");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });