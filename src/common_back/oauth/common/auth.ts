const { v4: uuidv4 } = require('uuid')
const { signJWT } = require('./jwt')
const { getUsersCollection } = require('../mongo')
const bcrypt = require('bcrypt')

async function getAccessTokenForUserId(userId: string) {
    return signJWT(userId)
}

type Input = {
    platformUserId: string,
    platform: string
    nickname: string[],
    profileImageURL: string[],
}

type Output = {
    userId: string,
    accessToken: string,
}


async function createUserOrLogin({
    platformUserId,
    platform,
    nickname,
    profileImageURL,
}: Input): Promise<Output> {
    const users = await getUsersCollection()

    const existingUser = await users.findOne({
        platform,
        platformUserId,
    })

    if (existingUser) {
        return {
            userId: existingUser.id,
            accessToken: await signJWT(existingUser.id),
        }
    }

    const userId = uuidv4()
    await userId.insertOne({
        id: userId,
        platformUserId,// 해당 플랫폼에서의 Id
        platform, //Kakao, facebook, naver
        nickname,
        profileImageURL,
        verified: true, // 인증은 OAuth 를 통하면 따로 필요가 없음

    })

    return {
        userId,
        accessToken: await signJWT(userId),
    }
}

function setAccessTokenCookie(res: import('express').Response, token, string) {
    res.cookie('access_token', token, {
        httpOnly: true,
        secure: true,
    })
}

async function encryptPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, res) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(res)
            }
        })
    })
}

async function comparePassword(plainText: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        bcrypt.compare(plainText, password, (err, res) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(res)
            }
        })
    })
}

export {
    getAccessTokenForUserId,
    createUserOrLogin,
    setAccessTokenCookie,
    encryptPassword,
    comparePassword,
}
