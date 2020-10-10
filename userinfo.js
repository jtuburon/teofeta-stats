const dotenv = require('dotenv')
const { ApiClient } = require('twitch');
const { ClientCredentialsAuthProvider } = require('twitch-auth');

dotenv.config()

const {
    CLIENT_ID,
    CLIENT_SECRET,
    USER_NAME
}=process.env;


const authProvider = new ClientCredentialsAuthProvider(CLIENT_ID, CLIENT_SECRET);
const apiClient = new ApiClient({ authProvider });

const main= async()=>{
    const user = await apiClient.helix.users.getUserByName(USER_NAME);
    console.log(user)
}


main();

