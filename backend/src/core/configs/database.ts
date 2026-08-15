import mongoose from "mongoose";

const connectToDatabase = () => {
  mongoose
    .connect(String(process.env.DB_URI))
    .then((con) => console.log(`connected to database ${con.connection.host}`))
    .catch((error) => console.log(error.message));
};

export default connectToDatabase;

