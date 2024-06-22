import jwtToken from 'jsonwebtoken'

export function generationToken (payload) {

    const accessToken = jwtToken.sign(payload, process.env.JWT_ACCESS_SECRET, {expiresIn: '15m'})
    const refreshToken = jwtToken.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn: '30d'})

    return { 
        accessToken,
        refreshToken
    }
}


