import Swal from "sweetalert2";

const errorMsg = "Somthing went wrong try again later";
const successMsg = "successfully";

export function StatusAlert(props, msg) {
  let icon;
  let message;

  if (props === "error") {
    icon = "error";
    message = msg || errorMsg;
  } else if (props === "AuthError") {
    icon = "info";
    message = "Email exists";
  } else {
    icon = "success";
    message = props + " " + successMsg;
  }
  Swal.fire({
    position: "top",
    icon: icon,
    title: message,
    showConfirmButton: false,
    timer: 5000,
    width: "80%",
  });
}

export function CompareMood(on) {
  Swal.fire({
    toast: on,
    position: "top",
    icon: "info",
    title:
      on === true
        ? "Compare Mood On: Choose another estate to compare with "
        : "Compare Mood Off",
    showConfirmButton: false,
    width: "80%",
  });
}

export function ShowData(msg) {
  Swal.fire(msg);
}

export function CheckOperation(props) {
  return Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "confirm",
    width: "60%",
  }).then((result) => {
    return result;
  });
}

export function ValidationMsg(props) {
  Swal.fire({
    icon: "error",
    title: "Please check the following inputs :",
    html: "<pre>" + props + "</pre>",
    width: "80%",
  });
}
