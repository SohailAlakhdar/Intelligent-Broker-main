import React from "react";
import * as serverFunctions from "../serverFunctions/estate";
import { UserId } from "./checkData";

export const MyContext = React.createContext();
const Provider = (props) => {
  const [saveList, setSaveList] = React.useState("Loading");
  const [estateRequests, setEstateRequests] = React.useState("Loading");
  const [categoryAndType, setCategoryAndType] = React.useState("Loading");
  const [visitRequests, setVisitRequests] = React.useState({
    approved: "Loading",
    rejected: "Loading",
    pending: "Loading",
    myVisit: "Loading",
  });

  React.useEffect(() => {
    const fetchData = async () => {
      const categoryAndType = await serverFunctions.getCategoryAndType();
      setCategoryAndType(categoryAndType);
      if (!UserId()) {
        return;
      }
      const save = await serverFunctions.getSaved();
      const estateReq = await serverFunctions.getEstateRequests();
      const visitReq = await serverFunctions.getVisits();
      setEstateRequests(estateReq);
      setSaveList(save);
      setVisitRequests({
        approved: visitReq.filter((visit) => visit.status === "approved"),
        rejected: visitReq.filter((visit) => visit.status === "rejected"),
        pending: visitReq.filter((visit) => visit.status === "pending"),
        myVisit: visitReq,
      });
    };
    fetchData();
  }, [props.auth]);

  return (
    <MyContext.Provider
      value={{
        saveList,
        categoryAndType,
        setSaveList,
        estateRequests,
        setEstateRequests,
        visitRequests,
        setVisitRequests,
      }}
    >
      {props.children}
    </MyContext.Provider>
  );
};

export default Provider;
