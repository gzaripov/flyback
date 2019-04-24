// malfromed-tape.json parse error message is expected,
// so dont pollute test logs
console.error = (message: Object) => {
  if (!message.toString().match(/(malformed-tape.json)/)) {
    console.error(message);
  }
};
