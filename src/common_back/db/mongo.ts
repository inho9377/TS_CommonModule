const { MongoClient } = require('mongodb')
let client: import('mongodb').MongoClient = null
let didConnect = false

function start_mongo(password: string, cluster: string, user: string, dbName: string) {
    const uri = `mongodb+srv://${user}:${password}@${cluster}/${dbName}?retryWrites=true&w=majority`
    client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })

}

async function getCollection(name: string): Promise<import('mongodb').Collection> {
    if (!didConnect) {
        await client.connect()
        didConnect = true
    }
    return client.db().collection(name)

}

async function getUsersCollection() {
    return getCollection('users')
}

async function getPostsCollection() {
    return getCollection('posts')
}


export {
    start_mongo,
    getCollection,
    getUsersCollection,
    getPostsCollection,
}
