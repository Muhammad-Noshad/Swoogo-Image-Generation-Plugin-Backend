const extractToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(400).json({ error: "Missing Authorization header" });
  }

  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res.status(400).json({ error: "Invalid Authorization format. Use 'Bearer <token>'" });
  }

  req.token = tokenParts[1];
  next();
};

module.exports = extractToken;