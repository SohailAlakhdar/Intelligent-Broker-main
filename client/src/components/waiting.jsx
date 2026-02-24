import React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Backdrop from "@mui/material/Backdrop";

export const Waiting = (props) => (
  <Backdrop
    sx={{ color: "#FAF9F6", zIndex: (theme) => theme.zIndex.drawer + 1 }}
    open={true}
  >
    <CircularProgress color="success" />
  </Backdrop>
);
