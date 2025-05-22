const express = require("express");
const app = express();
const path = require("path");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const JWT_SECRET = "jwt_secret_key"; // FIXED: renamed to uppercase for consistency

// MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Raj@12345678',
  database: 'login',
});














connection.connect(err => {
  if (err) {
    console.log("MySQL connection error:", err);
    return;
  }
  console.log("connected to mysql database");
});

// Root route
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Signup page
app.get("/signup", (req, res) => {
  res.render("signup");
});

// Signup handler
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  connection.query(`SELECT * FROM users WHERE username = ?`, [username], async (err, result) => {
    if (err) return res.send("Database error");

    if (result.length > 0) {
      return res.send("User already exists. <a href='/signup'>Try again</a>");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    connection.query(`INSERT INTO users (username, password) VALUES (?, ?)`,
      [username, hashedPassword],
      (err) => {
        if (err) return res.send("Error inserting user");
        res.redirect("/login");
      }
    );
  });
});

// Login page
app.get("/login", (req, res) => {
  res.render("login");
});

// Login handler
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  connection.query(`SELECT * FROM users WHERE username = ?`, [username], async (err, results) => {
    if (err) return res.send("Database error");

    if (results.length === 0) return res.send('Invalid username or password. <a href="/login">Try again</a>');

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('Invalid username or password. <a href="/login">Try again</a>');

    const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.redirect(`/home?token=${token}`);
  });
});

// Logout route
app.get('/logout', (req, res) => {
  res.send(`
    <h2>You have been logged out.</h2>
    <a href="/login">Login again</a>
  `);
});


// Home route
app.get('/home', (req, res) => {
  res.render('home');
});



const port = 3000;
app.listen(port, () => {
  console.log("server running at 3000");
});
