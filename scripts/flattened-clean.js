const exec = require("child_process").execSync
const os = require("os")
const fs = require("fs")

if (fs.existsSync("./contracts/flattened")) {
  switch (os.type()) {
    case "Windows_NT":
      exec("del .\\contracts\\flattened\\ /f /s /q")
      exec("rmdir .\\contracts\\flattened /s /q")
      break
    default:
      exec("rm -rf ./contracts/flattend/")
  }
}
