// Running ts-node [yarn start]
import http from "http2";
import fs from "fs";

interface User {
  username: string;
  id: number;
  messages: string[];
}

const users: User[] = [];
let username = "";
let id_num = 0;

const newUser = (username: string, session_id: number, messages: string[]) => {
  const user: User = {
    username: username,
    id: session_id,
    messages: messages,
  };
  return user;
};

// Appends message to an already existing user
const appendMessage = (user: string, message: string) => {
  users.map((obj) => {
    if (obj.username == user) {
      obj.messages.push(message);
    }
  });
};

const checkUserExists = (username: string) => {
  for (let i = 0; i < users.length; i++) {
    if (users[i].username === username) {
      return true;
    }
  }
  return false;
};

const getLatestMessage = (users: User[]) => {
  if (users === undefined) {
    return;
  } else {
    try {
      let currentUser = latestUser.pop() ?? username;
      let message = "";
      for (let user of users) {
        if (user.username == currentUser) {
          message = user.messages[user.messages.length - 1];
        }
      }
      return { username: currentUser, message: message };
    } catch (error) {
      console.error(error);
      return;
    }
  }
};

// create a new server instance
const server = http.createSecureServer({
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
});

// log any error that occurs when running the server
server.on("error", (err) => console.error(err));

// the 'stream' callback is called when a new
// stream is created. Or in other words, every time a
// new request is received
let latestUser: any = [];
let counter = 0
server.on("request", (request, response) => {
  request.setEncoding("utf8");
  // When the URL is requested from the client, the server extracts the username from the frontend POST request in the user form
  // POST request is made by the client to send the username to the server, then the page is redirected to /chatroom
  // The server should respond with the username to the /chatroom page
  if (request.url == "/chatroom") {
    request.once("data", (chunk) => {
      username = (chunk as string).slice(chunk.lastIndexOf("=") + 1);
      // Check if user exists then add to the users array
      if (!checkUserExists(username)) {
        users.push(newUser(username, id_num++, []));
        const userJSON = JSON.stringify(users);
        fs.writeFileSync("src/users.json", userJSON);
      }
    });
    // Getting the user messages and storing them into the JSON file
  } else if (request.method == "POST" && request.headers[":path"] == "/users") {
    request.on("data", (chunk) => {
      // User payload from canvas_input post request
      let userPkg = (chunk as string).split("&");

      // Destructure
      const [user, message] = userPkg;
      const sMessage = message.slice(message.lastIndexOf("=") + 1);
      const sUser = user.slice(user.lastIndexOf("=") + 1);
      appendMessage(sUser, sMessage);

      const userJSON = JSON.stringify(users);
      latestUser.push(sUser);
      fs.writeFileSync("src/users.json", userJSON);
      // Figure out a way to update the chatroom page when another user sends a message
      // Every time a user sends a message the server will update and grab all the messages
    });
  } else if (request.url === "/register") {
    // Connection reponse from the server with SSE
    response.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    });
    response.write(":register event\n"); // <- Comment for keep-alive mechanism
    response.write("event:registered\n");
    response.write(`id: ${counter++}\n\n`);
  }

  request.on("error", (err) => console.error("request error", err));
});
// This serves up the web page from the localhost:3000/ GET request
// After the GET request is made to the server it responds with the HTML page
// Serving up static assets
server.on("stream", (stream, headers) => {
  // we can use the `respond` method to send
  // any headers. Here, we send the status pseudo header
  const path = headers[":path"];
  stream.setEncoding("utf8");
  switch (path) {
    case "/":
      fs.readFile("src/index.html", (err, data) => {
        if (err) throw err;
        stream.end(data);
      });
      break;
    case "/styles.css": // <- Path to browser resource to resolve styles link
      fs.readFile(
        "src/chatroom/styles.css",
        /* Path to external file */ (err, data) => {
          if (err) throw err;
          stream.write(data);
          stream.end();
        }
      );
      break;
    case "/chatroom":
      fs.readFile("src/chatroom/chatroom.html", "utf8", (err, data) => {
        if (err) throw err;
        stream.respond({
          status: 200,
          "content-type": "text/html; charset=utf=8",
        });
        stream.write(data);
        stream.end();
      });
      break;
    case "/redirect.js":
      fs.readFile("src/chatroom/redirect.js", "utf8", (err, data) => {
        if (err) throw err;
        stream.respond({
          status: 200,
          "content-type": "text/javascript; charset=utf=8",
        });
        stream.write(data);
        stream.end();
      });
      break;
    case "/chat.js":
      fs.readFile("src/chatroom/chat.js", "utf8", (err, data) => {
        if (err) throw err;
        stream.respond({
          status: 200,
          "content-type": "text/javascript; charset=utf=8",
        });
        stream.write(data);
        stream.end();
      });
      break;
    case "/users":
      fs.readFile("src/users.json", (err, data) => {
        if (err) throw err;
        stream.respond({
          status: 200,
          "content-type": "application/json; charset=utf=8",
        });
        stream.write(data);
        stream.end();
      });
      break;
    case "/register":
      setInterval(() => {
        let retry = 5000;
        stream.write(":getting message\n");
        stream.write("event: message-received\n");
        stream.write(`data: ${JSON.stringify(getLatestMessage(users))}\n`);
        stream.write(`retry: ${retry}\n\n`);
      }, 100);
      break;
    default:
      stream.write("Route not found");
      stream.end();
  }
  // response streams are also stream objects, so we can
  // use `write` to send data, and `end` once we're done
});

server.on("session", (session) => {
  console.log("session started");
  session.on("connect", () => {
    console.log("User connected");
  });
  session.on("close", () => {
    console.log("session closed");
  });

  session.on("error", (err) => console.error("session error", err));
});

// start the server on port 8080
server.listen(8080);
