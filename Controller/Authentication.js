const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Extract the token from the Authorization header
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Access denied. No token provided.' }); // Unauthorized
  }

  jwt.verify(token, process.env.secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token. Access denied.' }); // Forbidden
    }

    // Attach the decoded user data to req.existuser
    req.existuser = decoded;
    next(); // Proceed to the next middleware or route handler
  });
};

module.exports = authenticateToken;
