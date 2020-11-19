const fs = require("fs");
const stream = require("stream");

const Transform = stream.Transform;

class Upper extends Transform {
  headers = "";
  residueFromPreviousChunk = "";
  separator = "";

  constructor(separator) {
    super();
    this.separator = separator;
  }

  createJson = (headers, line, isLast) => {
    const headerArray = headers.split(this.separator);
    const lineArray = line.split(this.separator);
    const resultArray = [];
    for (let i = 0; i < headerArray.length; i++) {
      resultArray.push(`"${headerArray[i]}":"${lineArray[i]}"`);
    }
    const resultString = resultArray.join(",");
    return isLast ?`{${resultString}}]`:`{${resultString}}, \n`;
  };

  _transform(chunk, encoding, callback) {
    const arr = chunk.toString().split("\r");
    if (arr.length === 1) {
      this.residueFromPreviousChunk = this.residueFromPreviousChunk + arr[0];
    } else {
      const line = this.residueFromPreviousChunk + arr[0];
      if (this.headers !== "") {
        this.push(Buffer.from(this.createJson(this.headers, line, false)));
      }
      if (this.headers === "") {
        this.headers = line;
        this.push(Buffer.from("["))
      }
      this.residueFromPreviousChunk = arr[1];
    }
    callback();
  }

  _flush(callback) {
    this.push(
      Buffer.from(this.createJson(this.headers, this.residueFromPreviousChunk,true))
    );
    callback();
  }
}

const myArgs = process.argv.slice(2);
let sourceFile = '';
let resultFile = '';
let separator = '';

for (let i=0; i<myArgs.length; i++){
  switch (myArgs[i]) {
    case "--sourceFile":
      sourceFile = myArgs[i+1];
      break;
    case "--resultFile":
      resultFile = myArgs[i+1];
      break;
    case "--separator":
      separator = myArgs[i+1];
      break;
  }
}

const upper = new Upper(separator);
const readableStream = new fs.createReadStream(sourceFile, {
  flags: "r",
  encoding: "utf-8",
  highWaterMark: 50,
});
const writableStream = new fs.createWriteStream(resultFile);

readableStream
  .pipe(upper)
  .pipe(writableStream)
  .on("finish", () => {
    console.log("done");
  });
