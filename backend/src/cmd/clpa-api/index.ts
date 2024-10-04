import "module-alias/register";

import server from "./server";

const port = process.env.PORT || 8080;

server.listen(port, () => {
  console.log(`http server listening on port ${port}`);
});
