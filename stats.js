const dotenv = require('dotenv')
const { ApiClient } = require('twitch');
const { ClientCredentialsAuthProvider } = require('twitch-auth');
const fs= require('fs');

const OUTPUT_PATH = './output';
const FOLLOWERS_LIST_PATH = `./${OUTPUT_PATH}/followers_list.txt`;
const FOLLOWERS_COUNT_PATH = `./${OUTPUT_PATH}/followers_count.txt`;
const VIEWS_COUNT_PATH = `./${OUTPUT_PATH}/views_count.txt`;
const ONLINE_COUNT_PATH = `./${OUTPUT_PATH}/online_count.txt`;

const FOLLOWERS_LIST_SEPARATOR= ' --//-- ';


if (!fs.existsSync(OUTPUT_PATH)){
    fs.mkdirSync(OUTPUT_PATH);
}

dotenv.config()

const {
    CLIENT_ID,
    CLIENT_SECRET,
    USER_ID
}=process.env;


const authProvider = new ClientCredentialsAuthProvider(CLIENT_ID, CLIENT_SECRET);
const apiClient = new ApiClient({ authProvider });

const saveData= (filename, data)=>{
    fs.writeFileSync(filename, data);
}

const getFollowers= async ()=>{
    let _follows= apiClient.helix.users.getFollowsPaginated({followedUser: USER_ID})
    const followersCount= await _follows.getTotalCount();
    const followersList= await _follows.getAll()
    const followersNameList =followersList.map( f=> f.userDisplayName)
    return{followersCount, followersList: followersNameList}
}

const reportData= (stats)=>{
    saveData(VIEWS_COUNT_PATH, stats.viewsCount);
    
    saveData(ONLINE_COUNT_PATH, stats.onlineCount);
    
    saveData(FOLLOWERS_COUNT_PATH, stats.followers.followersCount);
    saveData(FOLLOWERS_LIST_PATH, stats.followers.followersList.join(FOLLOWERS_LIST_SEPARATOR)+ FOLLOWERS_LIST_SEPARATOR);

    console.log(`Viewers Count: ${stats.viewsCount}`);
    console.log(`Followers Count: ${stats.followers.followersCount}`);
    console.log(`Online Count: ${stats.onlineCount}`);
}



const main= async()=>{
  const user = await apiClient.helix.users.getUserById(USER_ID);
  const viewsCount= user.views;
  const followers=await getFollowers()
  const stream= await user.getStream()
  const onlineCount = stream?  stream.viewers: 0
  const stats ={onlineCount, viewsCount, followers}
  reportData(stats)
}


main();

