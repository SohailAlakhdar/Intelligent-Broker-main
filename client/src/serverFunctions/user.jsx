import * as Waiting from "../components/waiting.jsx";
import { callServer, url } from "./callServer.jsx";

export function login(formData) {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  };
  Waiting.Waiting(true);
  return callServer(url + "user/login", requestOptions).then((res) => {
    if (res.token) {
      localStorage.setItem("HomExplorerToken", res.token);
      localStorage.setItem("HomExplorerUserId", res.userId);
    }
    return res.message;
  });
}

export function addUser(formData) {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  };
  Waiting.Waiting(true);
  return callServer(url + "user/addUser", requestOptions).then((res) => {
    if (res.token) {
      localStorage.setItem("HomExplorerToken", res.token);
      localStorage.setItem("HomExplorerUserId", res.userId);
    }
    return res.message;
  });
}

export function checkAdmin(id) {
  const requestOptions = {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
  };
  Waiting.Waiting(true);
  return callServer(url + "user/checkAdmin", requestOptions);
}

export function logOut() {
  localStorage.removeItem("HomExplorerToken");
  localStorage.removeItem("HomExplorerUserId");
}

export function getUsers() {
  const requestOptions = {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
  };
  Waiting.Waiting(true);
  return callServer(url + "user/getUsers", requestOptions);
}

export function changeRole(data) {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
    body: JSON.stringify(data),
  };
  Waiting.Waiting(true);
  return callServer(url + "user/changeRole", requestOptions);
}
