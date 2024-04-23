// const fs = require("fs");
// const https = require("https");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const cookieParse = require("cookie-parser");
const { base64url } = require("./helper");

const app = express();
const port = 3001;
const jwtSecret =
  "9232a817f7fef0d0fdadd31464291eb298da1e9f90271d00642cef283caacead";

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParse());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessions = {};

const db = {
  users: [
    {
      id: 1,
      email: "hoangconghuy@gmail.com",
      password: "1",
      name: "Hoang Cong Huy",
    },
  ],
  posts: [
    {
      id: 1,
      title: "Title 1",
      description: "Description 1",
    },
    {
      id: 2,
      title: "Title 2",
      description: "Description 2",
    },
    {
      id: 3,
      title: "Title 3",
      description: "Description 3",
    },
  ],
};

// [GET] /api/posts
app.get("/api/posts", (req, res) => {
  res.json(db.posts);
});

//[POST] /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(
    (user) => user.email === email && user.password === password
  );
  // console.log(user)
  if (!user) {
    res.status(401).json({
      message: "unauthorized",
    });
  }
  // Tạo header + payload
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const payload = {
    sub: user.id,
    exp: Date.now() + 3600000,
  };

  // Mã hóa base 64(json(header & payload))
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  // Tạo token data header.payload
  const tokenData = `${encodedHeader}.${encodedPayload}`;
  // Tạo chữ ký
  const hmac = crypto.createHmac("sha256", jwtSecret);
  const signature = hmac.update(tokenData).digest("base64url");

  res.json({
    token: `${tokenData}.${signature}`,
  });
});
// Dạng của token là header.payload.signature

//[POST] /api/auth/me
app.get("/api/auth/me", (req, res) => {
  const token = req.headers.authorization?.slice(7);
  if (!token) {
    return res.status(401).json({
      message: "unauthorized",
    });
  }

  const [encodedHeader, encodedPayload, tokenSignature] = token.split(".");
  const tokenData = `${encodedHeader}.${encodedPayload}`;
  const hmac = crypto.createHmac("sha256", jwtSecret);
  const signature = hmac.update(tokenData).digest("base64url");

  if (signature !== tokenSignature) {
    return res.status(401).json({
      message: "unauthorized",
    });
  }
  const payload = JSON.parse(atob(encodedPayload));
  const user = db.users.find((user) => user.id === payload.sub);
  if (!user) {
    return res.status(401).json({
      message: "unauthorized",
    });
  }
  if (payload.exp < Date.now()) {
    return res.status(401).json({
      message: "unauthorized",
    });
  }

  res.json(user);
});

// app.

// https
//   .createServer(
//     {
//       key: fs.readFileSync("localhost-key.pem"),
//       cert: fs.readFileSync("localhost.pem"),
//     },
//     app
//   )
app.listen(port, () => {
  console.log(`Demo app is running on port ${port}`);
});
