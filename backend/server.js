require('dotenv').config({path:"./configs/.env"})
const app = require("./app")
const http = require("http")

const server = http.createServer(app)

const port = process.env.PORT || 3000
server.listen(port,"0.0.0.0",(req,res)=>{
    console.log(`server is running on port ${port}`)
})