const start = async () => {
  console.log("Hello world");
};

start().then(
  () => {
    process.exit(0);
  },
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
