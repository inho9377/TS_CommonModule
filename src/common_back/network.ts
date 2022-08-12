
/**
 * @param {Object.<string, *>} query
 */
function makeQueryString(query: any): string {
    const keys = Object.keys(query)
    return keys
        .map((key) => [key, query[key]])
        .filter(([, value]) => value)
        .map(
            ([key, value]) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        )
        .join('&')
}


type RedirectInfo = {
    res: import('express').Response,
    dest: string,
    error: string[],
    info: string[],
}

function redirectWithMsg({ res, dest, error, info }: RedirectInfo) {
    res.redirect(`${dest}?${makeQueryString({ info, error })}`)
}

module.exports = {
    redirectWithMsg,
}