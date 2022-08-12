const { default: fetch } = require('node-fetch')
const { getUsersCollection } = require('../mongo')
const { FB_APP_ID, FB_CLIENT_SECRET } = require('../common/env')
const { createUserOrLogin, setAccessTokenCookie } = require('../auth/auth')

async function getFacebookProfileFromAccessToken(accessToken: string): Promise<string> {
    // https://developers.facebook.com/docs/facebook-login/access-tokens/#generating-an-app-access-token
    // https://developers.facebook.com/docs/graph-api/reference/v10.0/debug_token
    const appAccessTokenReq = await fetch(
        `https://graph.facebook.com/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_CLIENT_SECRET}&grant_type=client_credentials`
    )
    const appAccessToken = (await appAccessTokenReq.json()).access_token

    const debugReq = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`
    )
    const debugResult = await debugReq.json()

    if (debugResult.data.app_id !== FB_APP_ID) {
        throw new Error('Not a valid access token.')
    }

    const facebookId = debugResult.data.user_id

    const profileRes = await fetch(
        `https://graph.facebook.com/${facebookId}?fields=id,name,picture&access_token=${accessToken}`
    )
    return profileRes.json()
}

async function getUserIdWithFacebookId(facebookId: string): Promise<string> {
    const users = await getUsersCollection()
    const user = await users.findOne({
        facebookId,
    })

    if (user) {
        return user.id
    }
    return undefined
}

/**
 * facebook 토큰을 검증하고, 해당 검증 결과로부터 우리 서비스의 유저를 만들거나,
 * 혹은 이미 있는 유저를 가져와서, 그 유저의 액세스 토큰을 돌려줍니다.
 */

async function getUserAccessTokenForFacebookAccessToken(token: string) {
    const fbProfile: {id: string} = (await getFacebookProfileFromAccessToken(token)) as unknown as {id: string}
    const { id: facebookUserId } = fbProfile

    const res = await createUserOrLogin({
        platform: 'facebook',
        platformUserId: facebookUserId,
    })
    return res.accessToken
}

function setupFacebookLogin(app: import('express').Express) {
    app.post('/auth/facebook/signin', async (req, res) => {
        const { access_token: fbUserAccessToken } = req.query

        if (typeof fbUserAccessToken !== 'string') {
            res.sendStatus(400)
            return
        }

        const userAccessToken = await getUserAccessTokenForFacebookAccessToken(
            fbUserAccessToken
        )
        setAccessTokenCookie(res, userAccessToken)
        res.sendStatus(200)
    })
}

export {
    getFacebookProfileFromAccessToken,
    getUserIdWithFacebookId,
    getUserAccessTokenForFacebookAccessToken,
    setupFacebookLogin,
}
