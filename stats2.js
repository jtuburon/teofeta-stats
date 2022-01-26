const dotenv = require('dotenv');
const chunks = require('chunk-array').chunks;
const { ApiClient } = require('twitch');
const { ClientCredentialsAuthProvider } = require('twitch-auth');
const fs = require('fs');
const path = require('path');
const { setIntervalAsync } = require('set-interval-async/dynamic');

const OUTPUT_PATH = path.join(__dirname, 'output');

const FOLLOWERS_LIST_PATH = path.join(OUTPUT_PATH, 'followers_list.txt');
const FOLLOWERS_COUNT_PATH = path.join(OUTPUT_PATH, 'followers_count.txt');
const VIEWS_COUNT_PATH = path.join(OUTPUT_PATH, 'views_count.txt');
const ONLINE_COUNT_PATH = path.join(OUTPUT_PATH, 'online_count.txt');

if (!fs.existsSync(OUTPUT_PATH)) {
    fs.mkdirSync(OUTPUT_PATH);
}

let index = 0;
dotenv.config();

const {
    CLIENT_ID,
    CLIENT_SECRET,
    USER_ID,
    ENABLE_FOLLOWS_LIST,
    FOLLOWERS_LIST_SEPARATOR,
    DELAY_IN_SECONDS,
} = process.env;

const authProvider = new ClientCredentialsAuthProvider(CLIENT_ID, CLIENT_SECRET);
const apiClient = new ApiClient({ authProvider });

const saveData = (filename, data) => {
    fs.writeFileSync(filename, data);
};

const getFollowers = async () => {
    let _follows = apiClient.helix.users.getFollowsPaginated({
        followedUser: USER_ID,
    });
    const followersCount = await _follows.getTotalCount();

    if (ENABLE_FOLLOWS_LIST) {
        const followersList = await _follows.getAll();
        const _followersNameList = followersList.map((f) => f.userDisplayName);
        const partitions = chunks(_followersNameList, 10);
        const followersNameList = partitions[index % partitions.length];
        index++;
        return { followersCount, followersList: followersNameList };
    }
    return { followersCount };
};

const reportData = (stats) => {
    saveData(VIEWS_COUNT_PATH, stats.viewsCount);

    saveData(ONLINE_COUNT_PATH, stats.onlineCount);

    saveData(FOLLOWERS_COUNT_PATH, stats.followers.followersCount);
    if (ENABLE_FOLLOWS_LIST)
        saveData(
            FOLLOWERS_LIST_PATH,
            stats.followers.followersList.join(FOLLOWERS_LIST_SEPARATOR) + FOLLOWERS_LIST_SEPARATOR,
        );

    console.log('');
    console.log(`Viewers Count: ${stats.viewsCount}`);
    console.log(`Followers Count: ${stats.followers.followersCount}`);
    console.log(`Online Count: ${stats.onlineCount}`);
};

const main = async () => {
    const user = await apiClient.helix.users.getUserById(USER_ID);
    const viewsCount = user.views;
    const followers = await getFollowers();
    const stream = await user.getStream();
    const onlineCount = stream ? stream.viewers : 0;
    const stats = { onlineCount, viewsCount, followers };
    reportData(stats);
};

if (DELAY_IN_SECONDS) {
    setIntervalAsync(main, DELAY_IN_SECONDS * 1000);
} else {
    main();
}
