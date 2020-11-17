const fs = require('fs');
const stream = require('stream');
const util = require('util');

const Transform = stream.Transform

function Upper(options) {
    Transform.call(this, options);
}
util.inherits(Upper, Transform);

Upper.prototype._transform = function (chunk, enc, cb) {
    var upperChunk = chunk.toString().toUpperCase();
    this.push(upperChunk);
    cb();
};
const upper = new Upper();

const readableStream = new fs.createReadStream('test.csv',{flags:'r',encoding:'utf-8'});
const writableStream = new fs.createWriteStream('test.json');

readableStream.pipe(upper).pipe(writableStream).on('finish',()=>{console.log('done');})


