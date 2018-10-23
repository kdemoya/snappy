var SLACK_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');
var PERSIST_LOG_ID = PropertiesService.getScriptProperties().getProperty('PERSIST_LOG_ID');
var DATA_SHEET_ID = PropertiesService.getScriptProperties().getProperty('DATA_SHEET_ID');
var ADMIN_USER_ID = PropertiesService.getScriptProperties().getProperty('ADMIN_USER_ID');
var SLACK_EPHEMERAL_WEBHOOK = 'https://slack.com/api/chat.postEphemeral';

/**
 * Google App Script callback for POST requests received.
 *
 * @param {Object} e - Google App Script event.
*/
function doPost(e) {
    var event = JSON.parse(e.postData.contents).event;
    
    if (event.type === 'url_verification') {
        return ContentService.createTextOutput(event.challenge);
    } else if (event.type === 'reaction_added') {
        validatePermissions(event.user, handleReaction(event));
    }
}


/**
 * Handles reaction added event and decides what to do
 * based on the given reaction.
 *
 * @param {Object} event - Slack event.
*/
function handleReaction(event) {
    if (event.reaction === 'camera_with_flash') {
        persistLog(JSON.stringify(event));
        saveEntryToSheet(event);
    }
}


/**
 * Save user and message permalink to the main spreadsheet.
 *
 * @param {Object} event - Slack event.
*/
function saveEntryToSheet(event) {
    var userId = event.item_user;
    var channel = event.item.channel;
    var timestamp = event.item.ts;
    var spreadSheet = SpreadsheetApp.openById(DATA_SHEET_ID).getSheetByName('Snappy');
    var permalink = getSlackPermalink(channel, timestamp);
    spreadSheet.appendRow([userId, permalink])
    postMessage(event, 'Entry saved!');
}


/**
 * Builds slack permalink url.
 *
 * @param {String} channel - Channel where the reaction took place.
 * @param {String} timestamp - Timestamp of the message.
*/
function getSlackPermalink(channel, timestamp) {
    var baseArchiveUrl = 'https://x-team.slack.com/archives/';
    return baseArchiveUrl + channel + '/p' + timestamp.replace('.', '')
}


/**
 * Post an ephemeral message to the user that
 * gave the reaction to confirm it was processed.
 *
 * @param {Object} event - Slack event.
 * @param {String} message - Message to show.
*/
function postMessage(event, message) {
    var message = {
        token: SLACK_ACCESS_TOKEN,
        channel: event.item.channel,
        user: event.user,
        text: message
    }
    
    var response = UrlFetchApp.fetch(SLACK_EPHEMERAL_WEBHOOK, {
        method: 'post',
        payload: message
    });
    
    persistLog(response.getContentText());
}


/**
 * Verify the user is an admin before executing a function.
 *
 * @param {String} userId - ID of the user triggering the event.
 * @param {Function} callback - Function to execute if the user has permissions.
*/
function validatePermissions(userId, callback) {
    if (userId === ADMIN_USER_ID) {
        callback()
    }
}


/**
 * Save a given message in a spreadsheet.
 *
 * @param {String} message - Message to save.
*/
function persistLog(message) {
    var spreadsheet = SpreadsheetApp.openById(PERSIST_LOG_ID).getSheetByName('Sheet1');
    spreadsheet.appendRow([new Date(), message]);
} 


/**
 * Google App Script callback for GET requests received.
 *
 * @param {Object} e - Google App Script event.
*/
function doGet(e) {
    return ContentService.createTextOutput('Nothing to do here');
}
