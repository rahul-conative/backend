const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;


const socketAuthMiddleware = (socket, next) => {

    // Extract token from `Authorization` header or `auth` object
    const authHeader = socket?.handshake?.auth?.token || socket?.handshake?.headers['authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
        console.log("Authorization header missing or invalid")
        return
    }

    if (authHeader !== undefined) {
        const token = authHeader && authHeader?.startsWith("Bearer ") ? authHeader?.slice(7) : null;

        if (!token) {
            console.log("Authentication error: Token missing")
            return
        }

        jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
            if (err) {
                console.log("Authentication error: Invalid token")
                return
            }
            socket.user = decoded;
            next();
        });
    } else {
        console.log("Authentication error: Invalid token")
        return
    }
};


module.exports = {
    socketAuthMiddleware
}
