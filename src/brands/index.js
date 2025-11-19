// brands/index.js

import universal from "./universal.js";

const brandMap = {
  universal,
  // future brands go here, like:
  // "gutgenius": import("./gutgenius.js")
};

export default function getBrandConfig(name = "universal") {
  return brandMap[name] || brandMap["universal"];
}
