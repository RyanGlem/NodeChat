import mysql from 'mysql';
import 'dotenv/config'

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.DB_PASSWORD,
    database: "chatDB"
})

db.connect ((err) => {
    if (err) throw err;
    console.log("Connected")
    db.query ("CREATE DATABASE IF NOT EXISTS chatDB", (err, result) => {
        if (err) throw err;
        console.log("Database created: ", result)
    })

    let q_string = "CREATE TABLE IF NOT EXISTS Users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), session_id INT(255))"
    db.query (q_string, (err, result) => {
        if (err) throw err;
        console.log ("Table created: ", result)
    })

    // This has to be put inside of the server
    let user = {username: "example_user", session_id: 154}
    q_string = "INSERT INTO users SET ?"
    db.query (q_string, user, (err, result) => {
        if (err) throw err;
        console.log ("Logged user: ", result)
    })
})