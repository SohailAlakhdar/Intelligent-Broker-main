import * as Waiting from "../components/waiting.jsx";

// const url = "https://homeexplorerapi.herokuapp.com/";
const url = "http://localhost:3000/";

const callServer = (url, requestOptions, noDataReply) => {
  return fetch(url, requestOptions)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw response;
    })
    .then((data) => {
      Waiting.Waiting(false);
      return data.length !== 0 ? data : noDataReply ? "NoData" : [];
    })
    .catch((error) => {
      console.error("Error fetching data: ", error);
      Waiting.Waiting(false);
      return "error";
    });
};

export { callServer, url };
