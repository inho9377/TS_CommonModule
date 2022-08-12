const { KAKAO_REST_KEY, KAKAO_REDIRECT_URI } = require('../common')
const { createUserOrLogin, setAccessTokenCookie } = require('../auth/auth')

type kakaoTokenRes = {
    access_token:string,
}

type KakaoProfile = {
    nickname: string,
    thumbnail_image_url: string,
    profile_image_url: string,
    is_default_image: boolean,
}

type KakaoAccount = {
    email: string,
    profile: KakaoProfile,
}

type KakaoMeAPIResult = {
    id: number,
    kakao_account: KakaoAccount,
}

function setupKakaoLogin(app: import('express').Express) {
    // https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api
    app.get('/auth/kakao/callback', async (req, res) => {
        const { code } = req.query

        if (!code || typeof code !== 'string') {
            res.status(400).end()
            return
        }

        // 카카오 유저 프로필을 알아낼 수 있는 액세스 토큰 (유저의) 받아오기 (URL에 요청)
        const url = new URL('https://kauth.kakao.com/oauth/token')
        url.searchParams.append('grant_type', 'authorization_code')
        url.searchParams.append('client_id', KAKAO_REST_KEY)
        url.searchParams.append('redirect_uri', KAKAO_REDIRECT_URI)
        url.searchParams.append('code', code)

        const kakaoTokenRes = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
        })

        const accessToken = (await kakaoTokenRes.json()).access_token

        const userInfoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
        })

        const me: KakaoMeAPIResult = await userInfoRes.json()
        if (!me.id) {
            res.status(500).end()
            return
        }
        const user = await createUserOrLogin({
            platform: 'kakao',
            platformUserId: me.id.toString(),
            nickname: me.kakao_account.profile.nickname,
            profileImageURL: me.kakao_account.profile.profile_image_url,
        })// 유저를 데이터베이스에 등록 (유저가 이미 있으면 가져오고, 아니면 새로 만듬)

        setAccessTokenCookie(res, user.accessToken)
        res.redirect('/')
    })
}

export {
    setupKakaoLogin,
}
