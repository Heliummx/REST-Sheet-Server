const express = require("express");
const basic_route = require("./routes.js");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const basicAuth = require('express-basic-auth')

app.use(express.json());

const HTTP_USER = process.env.HTTP_USER;
const HTTP_PASS = process.env.HTTP_PASS

app.use(basicAuth({
  users: { HTTP_USER : process.env.HTTP_PASS }
}))

app.use(process.env.ROUTE || "/", basic_route);



const server = app.listen(PORT, () => {
  console.log(`Started on PORT ${PORT}`);
})

server.setTimeout(300000);
