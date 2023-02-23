"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let line = 0; //<- Y-axis value of the message
let height = 0; // <- Height of the viewbox
var eventSource = new EventSource("/register"); // Connection request from the client
var prevMsg;
const canvas_input = () => {
    const chat_input = document.getElementById("chatinput");
    let username = "";
    $.getJSON("https://localhost:8080/users", (data) => {
        username = data[data.length - 1].username;
    });
    // Firing off an onchange event when user inputs a message
    chat_input.addEventListener("change", (e) => {
        prevMsg = createMessage(username, true, e.target.value);
        postMessages(username, e.target.value);
    });
};
const createMessage = (user, append, e) => {
    const chatbox = document.getElementById("container");
    let message = document.createElementNS("http://www.w3.org/2000/svg", "text");
    message.insertAdjacentText("beforeend", (user += ": "));
    message.insertAdjacentText("beforeend", e);
    message.setAttribute("id", "message");
    message.setAttribute("class", "small");
    message.setAttribute("y", `${(line += 10)}`); // Increasing the line y-value for message spacing
    message.setAttribute("x", "10");
    if (append) {
        chatbox.appendChild(message);
    }
    // When the messages reach the bottom of the screen, increase the canvas size on the y-axis
    if (line >= 100) {
        height = line;
        chatbox.setAttribute("viewBox", `0 0 320 ${(height += 10)}`);
    }
    return message;
};
const postMessages = (username, message) => {
    $.post("https://localhost:8080/users", {
        user: username,
        messages: message,
    });
};
const clientRegistered = (event) => {
    if (event.type === "registered") {
        console.log("Client registered " + "Id: " + event.id);
    }
    else if (event.type === "message-received") {
        let current = JSON.parse(event.data);
        let { username: username, message: message } = current;
        if (message !== undefined && message !== prevMsg) {
            createMessage(username, true, message);
        }
        prevMsg = message;
    }
};
const getMessages = () => __awaiter(void 0, void 0, void 0, function* () {
    $.getJSON("https://localhost:8080/users", (data) => {
        let sMessage = [];
        let message = "";
        data.map((obj) => {
            for (let index in obj.messages) {
                if (obj.messages[index].includes("+")) {
                    message = obj.messages[index];
                    sMessage = message.split("+");
                    message = sMessage.join(" ");
                }
                else {
                    message = obj.messages[index];
                }
                createMessage(obj.username, true, message);
            }
        });
    });
});
canvas_input();
getMessages();
eventSource.addEventListener("registered", clientRegistered);
eventSource.addEventListener("message-received", clientRegistered);
eventSource.addEventListener("error", (error) => {
    if (error.readyState === eventSource.CLOSED) {
        console.log("The connection was closed");
    }
    else {
        console.error("Event Source Failed", error);
        console.log("Closing");
        eventSource.close();
    }
});
