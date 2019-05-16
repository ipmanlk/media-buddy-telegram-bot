const TelegramBot = require('node-telegram-bot-api');
const Config = require('../config/config.json');
const Commands = require('../config/commands.json');
const Ytdl = require('../libs/ytdl');
const TinyURL = require('tinyurl');

// for holding the bot
let bot;
// store user request video with his name
let userVideo = {};

const videoFormats = Object.keys(Ytdl.formatCodes);

const init = () => {
    bot = new TelegramBot(Config.BOT_TOKEN, { polling: true });
    registerListeners();
};

const registerListeners = () => {
    bot.on('message', (msg) => {
        let msgStr = msg.text.toString();

        // check for custom commands
        if (Commands[msgStr]) {
            sendTextResponse(msg, Commands[msgStr]);
            return;
        }

        // check if start with bot command 
        if ((msgStr).startsWith(Config.BOT_TRIGGER)) {
            let link = (msgStr).split(Config.BOT_TRIGGER)[1].trim();

            // check if link is present
            const regEx = new RegExp("^(http(s)?:\/\/)?((w){3}.)?(m.)?youtu(be|.be)?(\.com)?\/.+");

            if (!regEx.test(link)) {
                sendTextResponse(msg, "<b>Please enter a valid url!.</b>");
                return;
            }

            // get and send video formats 
            sendTextResponse(msg, "<b>Fetching video formats. Please be patient.</b>");

            Ytdl.getVidInfo(link).then(formats => {
                sendVideoFormats(msg, formats);
                userVideo[msg.from.first_name] = link;
            }).catch(err => {
                sendTextResponse(msg, err);
            });
        }

        // check if msg is a video format
        if (videoFormats.indexOf(msgStr) > -1) {

            // check the user has a link 
            if (!userVideo[msg.from.first_name]) {
                sendTextResponse(msg, "<b>Please send a video link first!.</b>");
                return;
            }


            // get download link from s1 server
            let link = (userVideo[msg.from.first_name]);
            let format = (msgStr).trim();
            sendTextResponse(msg, "<b>Generating your download link. Please be patient.</b>");

            Ytdl.getVidDownLink(link, format).then(downLink => {
                // shorten the url
                TinyURL.shorten(downLink).then(function (shortUrl) {
                    sendTextResponse(msg, `<b>${msg.from.first_name},</b> here is your download link : ${shortUrl}`);
                    delete userVideo[msg.from.first_name];
                }, function (err) {
                    sendTextResponse(msg, `<b>Unable to shorten the url!. Please report this error to the developer.</b>\n\n<b>${msg.from.first_name},</b> here is your download link : ${downLink}`);
                });
            }).catch(err => {
                sendTextResponse(msg, err);
            });
        }

    });
};

// send video formats as a keyboard
const sendVideoFormats = (msg, formats) => {
    let formatsArr = [];
    formats.forEach(format => formatsArr.push([format]));
    bot.sendMessage(msg.chat.id, "<b>Please select the format you want,</b>", {
        parse_mode: "HTML", "reply_markup": {
            "keyboard": formatsArr
        }
    });
}

// text plain text with html markdown
const sendTextResponse = (msg, str) => {
    bot.sendMessage(msg.chat.id, `${str}`, { parse_mode: "HTML" });
};


module.exports = {
    init
};