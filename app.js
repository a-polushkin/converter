const fs = require("fs");
const stream = require("stream");
const util = require("util");

const Transform = stream.Transform;

function Upper(options) {
  Transform.call(this, options);
}

util.inherits(Upper, Transform);

let headers = "";
let residueFromPreviousChunk = "";

const createJson = (headers, line) => {
  const headerArray = headers.split(",");
  const lineArray = line.split(",");
  const resultArray = [];
  for (let i = 0; i < headerArray.length; i++) {
    resultArray.push(`"${headerArray[i]}":"${lineArray[i]}"`);
  }
  const resultString = resultArray.join(",");
  return `{${resultString}}, \n`;
};

Upper.prototype._transform = function (chunk, enc, callback) {
  const arr = chunk.toString().split("\r");
  if (arr.length === 1) {
    residueFromPreviousChunk = residueFromPreviousChunk + arr[0];
  } else {
    const line = residueFromPreviousChunk + arr[0];
    if (headers !== "") {
      this.push(Buffer.from(createJson(headers, line)));
    }
    if (headers === "") {
      headers = line;
    }
    residueFromPreviousChunk = arr[1];
  }
  callback();
};

Upper.prototype._flush = function (callback) {
  this.push(Buffer.from(createJson(headers,residueFromPreviousChunk)));
  callback();
};


const upper = new Upper();

const readableStream = new fs.createReadStream("test.csv", {
  flags: "r",
  encoding: "utf-8",
  highWaterMark: 50,
});
const writableStream = new fs.createWriteStream("test.json");

readableStream
  .pipe(upper)
  .pipe(writableStream)
  .on("finish", () => {
    console.log("done");
  });
