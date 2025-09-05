const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    // Check if Authorization header exists and is in the correct format
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized - Missing or invalid token format' });
    }
    const token = authHeader.split(' ')[1]; // Extract token
    // Verify token
    jwt.verify(
        token,
        process?.env?.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            // Handle token verification errors
            if (err) {
                return res.json({
                    message: `error = ${err.message}`
                });
            }
            if (decoded.companyinfo) {
                req.companyinfo = {
                    company: decoded.companyinfo.company,
                };
            }
            // For User tokens (from createNewUser )
            if (decoded.UserInfo) {
                req.userInfo = {
                    username: decoded.UserInfo.username,
                    roles: decoded.UserInfo.roles,
                    company: decoded.UserInfo.company // Ensure this is included in the User JWT
                };
            }})}
