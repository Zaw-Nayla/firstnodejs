const express = require("express");
const app = express();
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const filePath = `./dev-data/data/users.json`;
const users = JSON.parse(fs.readFileSync(filePath));

app.use(express.json());

// Response Handler Functions
const getAllUsers = (request, response) => {
  response.status(200).json({
    status: "success",
    total: users.length,
    data: {
      users,
    },
  });
};

const Signup = async (request, response) => {
  if (!request.body.email || !request.body.password || !request.body.name) {
    response.status(404).json({
      status: "fail",
      message: "Invalid Input",
    });
    return;
  }
  const user = users.find((user) => user.email === request.body.email);
  if (user) {
    response.status(301).json({
      status: "fail",
      message: "user already registered",
    });
    return;
  }
  const id = uuidv4();
  const textPassword = request.body.password;
  try {
    const hashedPassword = await bcrypt.hash(textPassword, 10);
    const thenewone = { _id: id, ...request.body, password: hashedPassword };
    users.push(thenewone);
    fs.writeFileSync(filePath, JSON.stringify(users), () => {
      response.status(200).json({
        status: "success",
        data: {
          newuser: thenewone,
        },
      });
    });
  } catch (err) {
    response.status(500).json({
      status: "fail",
      message: "Internal Server Error",
    });
  }
};

const Login = async (request, response) => {
  const { email, password } = request.body;
  if (!email || !password) {
    response.status(404).json({
      status: "fail",
      message: "Invalid Input",
    });
    return;
  }
  const user = users.find((user) => user.email == email);

  if (!user) {
    response.status(404).json({
      status: "fail",
      message: "user not found",
    });
    return;
  }
  try {
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      response.status(200).json({
        status: "success",
        user_data: user,
      });
    } else {
      response.status(401).json({
        status: "fail",
        message: "Password  Incorrect",
      });
    }
  } catch (err) {
    response.status(500).json({
      status: "fail",
      message: "Internal Server Error",
    });
  }
};

const editingval = async (request, response) => {
  const { email, password, newpassword } = request.body;
  if (!email || !password || !newpassword) {
    response.status(404).json({
      status: "fail",
      message: "Invalid Input",
    });
    return;
  }
  const filter = users.find((user) => user.email === email);
  if (!filter) {
    response.status(404).json({
      status: "fail",
      message: "user not found",
    });
    return;
  }
  const isPasswordValid = await bcrypt.compare(password, filter.password);
  if (isPasswordValid) {
    const hashed = await bcrypt.hash(newpassword, 10);
    const edit = {
      ...filter,
      password: hashed,
      name: request.body.name ?? filter.name,
    };
    users.map((val) => {
      if (filter.id == val.id) {
        val = edit;
      }
    });
    fs.writeFileSync(filePath, JSON.stringify(users), () => {
      return response.status(200).json({
        status: "success",
        data: edit,
      });
    });
  } else {
    response.status(401).json({
      status: "fail",
      message: "Password is not correct",
    });
  }
};

app.route("/api/users").get(getAllUsers);

app.route("/api/signup").post(Signup);

app.route("/api/signin").post(Login);

app.route("/api/edit").put(editingval);

app.listen(2022, () => {
  console.log("Server is running on port 2022");
});
