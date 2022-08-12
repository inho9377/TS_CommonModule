
const { createUserOrLogin, setAccessTokenCookie } = require('../common/auth')
const { APP_CONFIG_JSON } = require('../common/env')

type NaverProfileResponse = {
    id: string,
    email: string,
    name: string,
}

function setupNaverLogin(app: import('express').Express) {
    app.get('/auth/naver/callback', (req, res) => {
        res.render('naver-callback', {
            APP_CONFIG_JSON,
        })
    })

    app.post('/auth/naver/signin', async (req, res) => {
        const { token } = req.query
        if (!token) {
            res.status(400)
            return
        }

        // https://developers.naver.com/docs/login/profile/profile.md
        const tokenVerifyResult = await fetch(
            `https://openapi.naver.com/v1/nid/me`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )

        const json = await tokenVerifyResult.json()
        const profile: NaverProfileResponse = json.response
        const user = await createUserOrLogin({
            platform: 'naver',
            platformUserId: profile.id,
            nickname: profile.name,
        })
        setAccessTokenCookie(res, user.accessToken)
        res.status(200).end()
    })
}

export {
    setupNaverLogin,
}