const Request = require('request');
const Utf8 = require("utf8");

// video formats with their youtube-dl codes
const formatCodes = {
    "audio only (DASH audio)": "251",
    "256x144 (144p)": "160~251",
    "426x240 (240p)": "133~251",
    "640x360 (360p)": "134~251",
    "854x480 (480p)": "135~251",
    "1280x720 (720p)": "136~251",
    "1920x1080 (1080p)": "137~251",
    "2560x1440 (1440p)": "271~251",
    "3840x2160 (2160p)": "313~251"
};

// get video info from s1 api
const getVidInfo = (link) => {
    return new Promise((resolve, reject) => {
        const url = `https://s1.navinda.xyz/youtube/info.php?url=${Utf8.encode(link)}`;
        try {
            Request(url, { json: true, timeout: 20000 }, (err, res, info) => {
                let result;

                if (err.code === 'ETIMEDOUT') {
                    result = "Sorry!. YTDL server is unreachable at the moment.";
                    reject(result);
                }

                if (info) {
                    result = getFormats(info);
                } else {
                    result = "Sorry!. I was unable to extract video info!.";
                }

                resolve(result);
            });

        } catch (err) {
            let errorMsg = "Sorry!. MediaBuddy Bot has encountered a problem!.";
            reject(errorMsg);
        }

    });
};

// get download link from s1 api
const getVidDownLink = (link, format) => {
    return new Promise((resolve, reject) => {

        const code = formatCodes[format];
        const url = `https://s1.navinda.xyz/youtube/download.php?url=${Utf8.encode(link)}&code=${code}`;

        try {
            Request(url, { json: true, timeout: 120000 }, (err, res, downLink) => {
                let result;

                if (err.code === 'ETIMEDOUT') {
                    result = "Sorry!. YTDL server is unreachable at the moment.";
                    reject(result);
                }

                if (downLink) {
                    result = downLink;
                } else {
                    result = "Sorry!. I was unable to get the download link!.";
                }

                resolve(result);
            });

        } catch (err) {
            let errorMsg = "Sorry!. MediaBuddy Bot has encountered a problem!.";
            reject(errorMsg);
        }

    });
};

// create and return formats array from video info (json)
const getFormats = (info) => {
    let prevFormat = "";
    let formats = [];
    for (code in info.formats) {
        let formatInfo = info.formats[code];
        let format = (formatInfo.format).split("-")[1].trim();
        let skip = ['640x360 (medium)', '1280x720 (hd720)', '1920x1080 (1080p60)', '1280x720 (720p60)', '2560x1440 (1440p60)', '3840x2160 (2160p60)'];

        if (skip.indexOf(format) > -1) continue;

        if (prevFormat !== format) {
            prevFormat = format;
        } else {
            continue;
        }

        formats.push(format);
    }

    return formats;
};


module.exports = {
    getVidInfo,
    getVidDownLink,
    formatCodes
};