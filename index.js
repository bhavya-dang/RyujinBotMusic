// Host
const http = require("http");
require("dotenv/config")
//http server to keep the replit running
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('ok');
});
server.listen(3000);

const Discord = require("discord.js");
const { Client, Util } = require("discord.js");
const YouTube = require("simple-youtube-api");
const ytdl = require("ytdl-core");
let prefix;
const client = new Client({ disableEveryone: true });
const moment  = require("moment");

const youtube = new YouTube(process.env.GOOGLE_API_KEY.toString());
// Firebase Setup
// const firebase = require("firebase");
// const FieldValue = require("firebase-admin").firestore.FieldValue;
// const admin = require("firebase-admin");
// const serviceAccount = require("./serviceAccount.json");
// const key = process.env.F_PRIVATE_KEY;
// admin.initializeApp({
//   credential: admin.credential.cert({
//     private_key: key.replace(/\\n/g, "\n"),
//     client_email: process.env.CLIENT_EMAIL,
//     project_id: process.env.PROJECT_ID,
//   }),
//   databaseURL: "https://ryujinbot-8c6e8.firebaseio.com",
// });

// const db = admin.firestore();

//MongoDB Setup
const mongoose = require("mongoose"),
  db = require("./keys").MongoURI,
  Guild = require("./models/Guild");
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log(err));


const queue = new Map();

client.on("warn", console.warn);

client.on("error", console.error);

client.on("ready", () => {
  // setInterval(() => {
  //   dbl.postStats(client.guilds.size);
  // }, 1800000);

  console.log(
    `[${moment(new Date()).format("dddd, MMMM Do YYYY, HH:mm:ss")}] [${
      client.user.username
    }]: System booting up...\n[${moment
      .utc(new Date())
      .format("dddd, MMMM Do YYYY, HH:mm:ss")}] [${
      client.user.username
    }]: All commands loaded.\n[${moment
      .utc(new Date())
      .format("dddd, MMMM Do YYYY, HH:mm:ss")}] [${
      client.user.username
    }]: 4 events ready.`
  );
  setTimeout(() => {
    console.log(
      `[${moment(new Date()).format("dddd, MMMM Do YYYY, HH:mm:ss")}] [${
        client.user.username
      }]: Successfully booted.`
    );
  }, 2000);

});

client.on("disconnect", () =>
  console.log(
    "I just disconnected, making sure you know, I will reconnect now..."
  )
);

client.on("reconnecting", () => console.log("I am reconnecting now!"));

client.on("message", async msg => {
    let data = await Guild.findOne({
      guildId: msg.guild.id,
    });
    if (data) {
      prefix = data.prefix;
    } else {
      prefix = "r@";
    }
    msg.prefix = prefix;
  if (msg.author.bot) return undefined;
  if (!msg.content.startsWith(prefix)) return undefined;

  const args = msg.content.split(" ");
  const searchString = args.slice(1).join(" ");
  const url = args[1] ? args[1].replace(/<(.+)>/g, "$1") : "";
  const serverQueue = queue.get(msg.guild.id);

  let command = msg.content.toLowerCase().split(" ")[0];
  // console.log(command, msg.member.voiceChannel)
  command = command.slice(prefix.length);

  if (command === "play" || command === "p") {
    
    const voiceChannel = msg.member.voiceChannel;
    if (!voiceChannel)
      return msg.channel.send(
        "I'm sorry but you need to be in a voice channel to play music!"
      );
    const permissions = voiceChannel.permissionsFor(msg.client.user);
    if (!permissions.has("CONNECT")) {
      return msg.channel.send(
        "I cannot connect to your voice channel, make sure I have the proper permissions!"
      );
    }
    if (!permissions.has("SPEAK")) {
      return msg.channel.send(
        "I cannot speak in this voice channel, make sure I have the proper permissions!"
      );
    }

    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
      const playlist = await youtube.getPlaylist(url);
      const videos = await playlist.getVideos();
      for (const video of Object.values(videos)) {
        const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
        await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
      }
      return msg.channel.send({
        embed: new Discord.RichEmbed()
          .setAuthor(
            `You Requested for Music, ` + msg.author.tag,
            msg.author.avatarURL
          )
          .setDescription(
            `:notes: **PlayList Added:**
**»** ${playlist.title}`
          )
          .setColor("#ffffff")
      });
    } else {
      if (!searchString) {
        msg.channel.send({
          embed: new Discord.RichEmbed()
            .setAuthor(
              `You Requested for Music, ` + msg.author.tag,
              msg.author.avatarURL
            )
            .setDescription(
              `**Usage:**  r@play <search>

If you want to listen to music, you have
to put a search string ahead! That's all.`
            )
            .setColor("#ffffff")
        });
      } else {
        try {
          var video = await youtube.getVideo(url);
        } catch (error) {
          try {
            var videos = await youtube.searchVideos(searchString, 5);
            let index = 0;
            /*  msg.channel.send({embed: new Discord.RichEmbed()
                        .setAuthor(`You Requested for Music, ` + msg.author.tag,msg.author.avatarURL)
                        .setDescription(`<:TubeMusic:413862971865956364>__**Youtube Search Result**__
${videos.map(video2 => `**${++index}.** ${video2.title}`).join(`\n`)}

To select a song, type any number from \`1 - 5\` to choose song!
The search is cancelled in \`10 seconds\` if no number provided.`)
                        .setColor("#ffffff")
                         
                       }); 


        try {
          var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 6, {
            maxMatches: 1,
            time: 10000,
            errors: ['time']
          });
        } catch (err) {
          console.error(err);
          return msg.channel.send('Invalid numbers inserted or no received numbers. I\'m Cancelling your Search.');
        } */
            // var response = 1;
            //	const videoIndex = parseInt(response.first().content);
            var video = await youtube.getVideoByID(videos[0].id);
          } catch (err) {
            console.error(err);
            return msg.channel.send("Yo! I could not find any results!");
          }
        }
        return handleVideo(video, msg, voiceChannel);
      }
    }
  } else if (command === "skip" || command === "sk") {
    if (!msg.member.voiceChannel)
      return msg.channel.send(
        ":red_circle: **Not in a voice channel, I am talking to you**"
      );
    if (!serverQueue)
      return msg.channel.send(
        ":mailbox_with_no_mail: **I can't skip an empty queue**"
      );
    serverQueue.connection.dispatcher.end("Skip command has been used!");
    return undefined;
  } else if (command === "stop" || command === "s") {
    if (!msg.member.voiceChannel)
      return msg.channel.send(
        ":red_circle: **Not in a voice channel, I am talking to you**"
      );
    if (!serverQueue)
      return msg.channel.send(
        ":mailbox_with_no_mail: **Nothing to stop, because there is no music!**"
      );
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end("Stop command has been used!");
    msg.channel.send({
      embed: new Discord.RichEmbed()
        .setAuthor(msg.author.tag, msg.author.avatarURL)
        .setDescription(`The player has been stopped.`)
        .setColor("#ffffff")
    });
    return undefined;
  } else if (command === "volume" || command === "v") {
    if (!msg.member.voiceChannel)
      return msg.channel.send("You are not in a voice channel!");
    if (!serverQueue) return msg.channel.send("There is nothing playing.");
    if (!args[1])
      return msg.channel.send(
        `The current volume is: **${serverQueue.volume}**`
      );
    serverQueue.volume = args[1];
    serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
    return msg.channel.send(`I set the volume to: **${args[1]}**`);
  } else if (command === "np" || command === "nowplaying") {
    if (!serverQueue)
      return msg.channel.send(
        ":mailbox_with_no_mail: **Wait, there is no music playing!**"
      );
    return msg.channel.send({
      embed: new Discord.RichEmbed()
        .setAuthor("Currently Playing ♪♪", client.user.avatarURL)
        .setTitle(`${serverQueue.songs[0].title}`)
        .setURL(`${serverQueue.songs[0].url}`)
        .setColor("#ffffff")
        .setThumbnail(
          `https://img.youtube.com/vi/${serverQueue.songs[0].id}/mqdefault.jpg`
        )

        .setFooter(`Requested By: ${msg.author.tag}`)
    });
    //msg.channel.send(`Yo yo! I'm playing :notes: ,**${serverQueue.songs[0].title}**, :notes: currently!`);
  } else if (command === "queue" || command === `q`) {
    if (!serverQueue)
      return msg.channel.send(
        ":mailbox_with_no_mail: **What? Nothing is playing at all?**"
      );
    return msg.channel.send({
      embed: new Discord.RichEmbed()
        .setAuthor(msg.author.tag, msg.author.avatarURL)
        .setDescription(
          `:notes: **Song Current Queue:**\n${serverQueue.songs
            .map(song => `**»** ${song.title} \`${song.duration}\``)
            .join("\n")}`
        )
        .setColor("#ffffff")

        .setTimestamp(new Date())
    });

    msg.channel.send(`
__**Song queue:**__
${serverQueue.songs.map(song => `**-** ${song.title}`).join("\n")}

**Now playing:**
:notes: ${serverQueue.songs[0].title} :notes:
  `);
  } else if (command === "pause") {
    if (serverQueue && serverQueue.playing) {
      serverQueue.playing = false;
      serverQueue.connection.dispatcher.pause();
      return msg.channel.send(":pause_button: **The player has been paused**");
    }
    return msg.channel.send(
      ":mailbox_with_no_mail: **I don`t know how to pause empty song!**"
    );
  } else if (command === "resume" || command === "r") {
    if (serverQueue && !serverQueue.playing) {
      serverQueue.playing = true;
      serverQueue.connection.dispatcher.resume();
      return msg.channel.send(":play_pause: **The player has been resumed**");
    }
    return msg.channel.send(
      ":mailbox_with_no_mail: **I don't know how to resume an empty list!**"
    );
  }

  return undefined;




});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
  const serverQueue = queue.get(msg.guild.id);
  console.log(video);
  const song = {
    id: video.id,
    title: Discord.escapeMarkdown(video.title),
    url: `https://www.youtube.com/watch?v=${video.id}`,
    duration: `${
      video.duration.hours < 10
        ? "0" + video.duration.hours
        : video.duration.hours
    }:${
      video.duration.minutes < 10
        ? "0" + video.duration.minutes
        : video.duration.minutes
    }:${
      video.duration.seconds < 10
        ? "0" + video.duration.seconds
        : video.duration.seconds
    }`
  };
  if (!serverQueue) {
    const queueConstruct = {
      textChannel: msg.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };
    queue.set(msg.guild.id, queueConstruct);

    queueConstruct.songs.push(song);
    msg.channel.send({
      embed: new Discord.RichEmbed()
        .setTitle(`${video.title}`)
        .setURL(video.url)
        .setAuthor("Now Playing ♪♪ ", client.user.avatarURL)
        .setDescription(
          `\`Duration:\` ${
            video.duration.hours < 10
              ? "0" + video.duration.hours
              : video.duration.hours
          }:${
            video.duration.minutes < 10
              ? "0" + video.duration.minutes
              : video.duration.minutes
          }:${
            video.duration.seconds < 10
              ? "0" + video.duration.seconds
              : video.duration.seconds
          }`
        )
        .setThumbnail(`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`)
        .setFooter(`Requested By: ${msg.author.tag} | Ryu Music System`, client.user.displayAvatarURL)
        .setColor("#ffffff")
    });

    try {
      var connection = await voiceChannel.join();
      queueConstruct.connection = connection;
      play(msg.guild, queueConstruct.songs[0]);
    } catch (error) {
      console.error(`I could not join the voice channel: ${error}`);
      queue.delete(msg.guild.id);
      return msg.channel.send(`I could not join the voice channeldue to some error!`);
    }
  } else {
    serverQueue.songs.push(song);
    console.log(serverQueue.songs);
    if (playlist) return undefined;
    else
      return msg.channel.send({
        embed: new Discord.RichEmbed()
          .setAuthor(msg.author.tag, msg.author.avatarURL)
          .setDescription(`:notes: **Added Song:**\n${video.title}`)
          .setTimestamp(new Date())
          .setThumbnail(`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`)

          .setColor("#ffffff")
      });
  }
  return undefined;
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);

  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }
  console.log(serverQueue.songs);

  const dispatcher = serverQueue.connection
    .playStream(ytdl(song.url))
    .on("end", reason => {
      if (reason === "Stream is not generating quickly enough.")
        console.log("Song ended.");
      else console.log(reason);
      serverQueue.songs.shift();
      setTimeout(() => {
        play(guild, serverQueue.songs[0]);
      }, 250);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

client.login(process.env.TOKEN);
