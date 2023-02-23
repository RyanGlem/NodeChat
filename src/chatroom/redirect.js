"use strict";
const redirect = () => {
    const exit_btn = document.getElementById("exit");
    exit_btn.addEventListener("click", () => {
        window.location.href = "/";
    });
};
redirect();
