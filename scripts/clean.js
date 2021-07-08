const exec = require("child_process").execSync
const os = require("os")
const fs = require("fs")

if (fs.existsSync("./migrations")) {
  if (os.type() === "Windows_NT") {
    exec("del .\\migrations\\2_witnet_core.js .\\migrations\\3_user_contracts.js /f /q")
  } else {
    exec("rm -f ./migrations/2_witnet_core.js ./migrations/3_user_contracts.js")
  }
}

if (fs.existsSync("./contracts/requests")) {
  if (os.type() === "Windows_NT") {
    exec("del .\\contracts\\requests\\*.sol /f /q")
  } else {
    exec("rm -f ./contracts/requests/*.sol")
  }
}
