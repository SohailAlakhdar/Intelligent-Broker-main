import { Waiting } from "../components/waiting.jsx";
import { callServer, url } from "./callServer.jsx";

export function getEstates(partition) {
  const requestOptions = {
    method: "get",
    headers: { "Content-Type": "application/json" },
  };
  return callServer(url + "getEstates/" + partition, requestOptions, true);
}

export function deleteEstate(id) {
  const requestOptions = {
    method: "delete",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
    body: JSON.stringify({ _id: id }),
  };
  Waiting.Waiting(true);
  return callServer(url + "deleteEstate", requestOptions);
}

export function getCategoryAndType() {
  const requestOptions = {
    method: "get",
    headers: { "Content-Type": "application/json" },
  };
  return callServer(url + "getCategoryAndType", requestOptions);
}

export function addEstate(formData) {
  const requestOptions = {
    method: "POST",
    headers: { "x-access-token": localStorage.getItem("HomExplorerToken") },
    body: formData,
  };
  Waiting.Waiting(true);
  return callServer(url + "addEstate", requestOptions);
}

export function updateEstate(formData) {
  const requestOptions = {
    method: "put",
    headers: { "x-access-token": localStorage.getItem("HomExplorerToken") },
    body: formData,
  };
  Waiting.Waiting(true);
  return callServer(url + "updateEstate", requestOptions);
}

export function approveEstateRequests(data) {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
    body: JSON.stringify(data),
  };
  return callServer(url + "approveEstate", requestOptions);
}

export function getMyEstates() {
  const requestOptions = {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
  };
  return callServer(url + "myEstates", requestOptions, true);
}

export function getEstateRequests(formData) {
  const requestOptions = {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
  };
  return callServer(url + "getApproveEstateRequests", requestOptions, true);
}

/*----------------------Sprint 2----------------------*/

export function rate(data) {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
    body: JSON.stringify(data),
  };
  Waiting.Waiting(true);
  return callServer(url + "addAndUpdateRate", requestOptions);
}

export function getRate(id) {
  const requestOptions = {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
  };
  return callServer(url + "getRates", requestOptions);
}

export function saveAndUnsave(estateId) {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
    body: JSON.stringify({ estateId: estateId }),
  };
  Waiting.Waiting(true);
  return callServer(url + "saveAndUnsave", requestOptions);
}

export function getSaved(id) {
  const requestOptions = {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
  };
  return callServer(url + "getSavedEstates", requestOptions);
}

export function searchData(data) {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
  return callServer(url + "search", requestOptions, true);
}

/*----------------------Sprint 3----------------------*/

export function getVisits(id) {
  const requestOptions = {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
  };
  return callServer(url + "getVisitsDates/" + id, requestOptions, true);
}

export function scheduleVisit(data) {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
    body: JSON.stringify(data),
  };
  Waiting.Waiting(true);
  return callServer(url + "scheduleVisit", requestOptions);
}

export function approveScheduleVisit(data) {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
    body: JSON.stringify(data),
  };
  Waiting.Waiting(true);
  return callServer(url + "approveScheduleVisit", requestOptions);
}

/*----------------------Sprint 4----------------------*/
export function placeBid(data) {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
    body: JSON.stringify(data),
  };
  Waiting.Waiting(true);
  return callServer(url + "placaBid", requestOptions);
}

export function auctionOperations(data) {
  const requestOptions = {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
  };
  Waiting.Waiting(true);
  return callServer(url + "auctionOperations/" + data, requestOptions);
}

export function updateAuctionStatus(formData) {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
    body: JSON.stringify(formData),
  };
  Waiting.Waiting(true);
  return callServer(url + "approveAuction", requestOptions);
}

/*----------------------Sprint 5----------------------*/

export function estateReport() {
  const requestOptions = {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
  };
  return callServer(url + "estateReport", requestOptions);
}

/*----------------------Sprint 6----------------------*/

export function predictEstate(formData) {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
    body: JSON.stringify(formData),
  };
  Waiting.Waiting(true);
  return callServer(url + "ai/predictEstatePrice", requestOptions);
}

export function getRecommendetEstates() {
  const requestOptions = {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": localStorage.getItem("HomExplorerToken"),
    },
  };
  return callServer(url + "ai/getRecommendedEstate", requestOptions);
}
