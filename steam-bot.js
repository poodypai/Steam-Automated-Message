const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamWebAPI = require('steam-webapi');
const SteamTotp = require('steam-totp');

const client = new SteamUser();
const community = new SteamCommunity();
const steamAPI = new SteamWebAPI();

// Steam bot credentials
const username = 'XXXX'; // Stea, Username
const password = 'XXXX'; // Steam Password
const code = 'XXXXX'; //Shared Secret

// Object to store last message timestamps and message counts per user
const userStats = {};

// Object to track whether automated response has been sent
const responseSent = {};

// Log in to Steam
client.logOn({
  accountName: username,
  password: password,
  twoFactorCode: SteamTotp.generateAuthCode(code),
});

client.on('loggedOn', () => {
  client.setPersona(SteamUser.EPersonaState.Online);
  console.log('Logged into Steam as ' + client.steamID.getSteam3RenderedID());
  client.gamesPlayed([
    { game_id: '730' } // Replace with a valid App ID (e.g., '730' for Counter-Strike: Global Offensive)
  ]);
});

client.on("friendMessage", function(steamID, message) {
  // Get the current timestamp
  const currentTimestamp = Date.now();

  // Fetch user profile information to get the Steam name
  community.getSteamUser(steamID, (err, user) => {
    if (err) {
      console.error(`Error fetching user profile for ${steamID.getSteam3RenderedID()}:`, err);
      return;
    }

    const steamName = user ? user.name : steamID.getSteam3RenderedID();

    console.log(`Received message from ${steamName}: ${message}`);
  
    // Initialize user stats if not present
    if (!userStats[steamID]) {
      userStats[steamID] = {
        lastMessageTimestamp: 0,
        messageCount: 0,
      };

      // Set the flag to indicate response not sent
      responseSent[steamID] = false;
    }

    // Check if the user has sent a message within the last minute
    if (currentTimestamp - userStats[steamID].lastMessageTimestamp < 60000) {
      // User has sent a message within the last minute
      userStats[steamID].messageCount++;

      // Check if the user has sent 10 messages within a minute
      if (userStats[steamID].messageCount >= 10) {
        client.removeFriend(steamID, (removeErr) => {
          
            console.log(`User ${steamName} unfriended due to excessive messages.`);
          
        });
      }

      // Check if the automated response has not been sent
      if (!responseSent[steamID]) {
        // Send the automated message
        client.chatMessage(steamID, "XXXXXXXXXXXXXXXXXXXXXXXXXXX [Automated Message]");

        // Set the flag to indicate response sent
        responseSent[steamID] = true;
      }
    } else {
      // Reset the message count and response flag if the user hasn't sent a message within the last minute
      userStats[steamID].messageCount = 1;
      responseSent[steamID] = false;
    }

    // Update the last message timestamp for the user
    userStats[steamID].lastMessageTimestamp = currentTimestamp;
  });
});
