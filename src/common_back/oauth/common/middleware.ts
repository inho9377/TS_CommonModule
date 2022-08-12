const { verifyJWT } = require('./jwt')
const { getUsersCollection } = require('../mongo')

function authMiddleware(): import('express').RequestHandler {
    return async (req, res, next) => {
        const { access_token } = req.cookies
        if (access_token) {
            try {
                const userId = await verifyJWT(access_token)
                if (userId) {
                    const users = await getUsersCollection()
                    const user = await users.findOne({
                        id: userId,
                    })
                    if (user) {
                        // @ts-ignore
                        req.user = user
                    }
                }
            } catch (e) {
                console.log('Invalid token', e)
            }
        }
        next()
    }
}

export {
    authMiddleware
}