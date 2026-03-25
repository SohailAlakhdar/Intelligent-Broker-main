export const scheduleVisitEmailTemplate = (body) => {
  return `
<!DOCTYPE html>
<html>
  <head>
    <title>Hello, World!</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
   <div style="font-family:Arial;background:#f4f6f7;padding:30px">

 <div style="
 background:white;
 padding:25px;
 border-radius:12px;
 box-shadow:0 5px 15px rgba(0,0,0,0.08);
 max-width:600px;
 margin:auto;
 ">

  <h1 style="color:#1B4F72">
    🏠 Intelligent Broker
  </h1>

  <p style="font-size:18px;color:#2C3E50">

    ${body}

  </p>

  <a href="#" style="
    display:inline-block;
    background:#3498DB;
    color:white;
    padding:12px 25px;
    border-radius:6px;
    text-decoration:none;
    margin-top:15px;
  ">

    View Details

  </a>

  <hr>

  <p style="color:gray;font-size:12px">

    Intelligent Broker Real Estate Platform

  </p>

 </div>

</div>

  </body>
</html>
`;
};
