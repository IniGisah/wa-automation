const wa = require("@open-wa/wa-automate");
const { create, decryptMedia, ev } = wa;
const { default: PQueue } = require("p-queue");
const fs = require("fs");
const express = require("express");
const axios = require("axios").default;

const helpOnInPM = ["hello", "hi", "hii", "hey", "heyy", "#help", "#menu"];
const helpOnInGroup = ["#help", "#menu"];

const helpText =
  process.env.HELP_TEXT ||
  `Commands:
#sticker: write in caption of a image/video/gif to turn it into sticker
#spam: tag everyone in a message in a group (only works in a group)
#join https://chat.whatsapp.com/shdkashdh: joing a group with invite link
#leave: i hope you dont use this (only works in a group if sent by an admin)
#help: to recive this same message
#menu: same as help but some people prefer it
#run languages: Returns all languages supported
#run {language}
halo: show haloo message
asep: ngirim stiker asep
#kick: kick orang dengan tag
#loginvr: tag orang2 yg maen vr
#addtugas 'isi tugas disini' : nambah list tugas
#listtugas: nge list tugas yg ada
#hapustugas 'nomor tugas' : buat ngapus tugas
dll saia mager nulis help lagi
Add '#nospam' in group description to stop spam commands
`;

const leaveText =
  process.env.LEAVE_TEXT ||
  "babay, gw keluar dulu";

const server = express();
const PORT = parseInt(process.env.PORT) || 3000;
const queue = new PQueue({
  concurrency: 2,
  autoStart: false,
});
const tugas = [];
var tlen,i;
tlen = tugas.length;
/**
 * WA Client
 * @type {null | import("@open-wa/wa-automate").Client}
 */
let cl = null;

/**
 * Process the message
 * @param {import("@open-wa/wa-automate").Message} message
 */

async function procMess(message) {
  if (message.type === "chat") {
    if (
      message.isGroupMsg &&
      helpOnInGroup.includes(message.body.toLowerCase())
    ) {
      await cl.sendText(message.from, helpText);
    } else if (
      !message.isGroupMsg &&
      helpOnInPM.includes(message.body.toLowerCase())
    ) {
      await cl.sendText(message.from, helpText);
    } else if (message.isGroupMsg && message.body.toLowerCase() === "#spam") {
      if (
        message.chat.groupMetadata.desc &&
        message.chat.groupMetadata.desc.includes("#nospam")
      ) {
        await cl.sendText(message.chatId, "Gaboleh spam disini");
      } else {
        const text = `hello ${message.chat.groupMetadata.participants.map(
          (participant) =>
            `\n🌚 @${
              typeof participant.id === "string"
                ? participant.id.split("@")[0]
                : participant.user
            }`
        )}`;
        await cl.sendTextWithMentions(message.chatId, text);
      }
    } else if (message.body === "#run languages") {
      const response = await axios.get(
        "https://emkc.org/api/v1/piston/versions"
      );
      const reply = response.data
        .map((item) => `${item.name} - v${item.version}`)
        .join("\n");
      cl.sendText(message.chatId, reply);
    } else if (message.body.startsWith("#run ")) {
      const { chatId, body } = message;
      try {
        let msg = body.replace("#run ", "").split("\n");
        const lang = msg.splice(0, 1)[0];
        const source = msg.join("\n");
        const response = await axios.post(
          "https://emkc.org/api/v1/piston/execute",
          {
            language: lang,
            source: source,
          }
        );
        const { ran, language, output, version, code, message } = response.data;
        const reply = `${
          ran ? "Ran" : "Error running"
        } with ${language} v${version}\nOutput:\n${output}`;
        cl.sendText(chatId, reply);
      } catch (e) {
        console.log(e);
        cl.sendText(chatId, "Unsupported language");
      }
    } else if (message.body.startsWith("#join https://chat.whatsapp.com/")) {
      await cl.joinGroupViaLink(message.body);
      await cl.reply(message.chatId, "Joined group", message.id);
    } else if (message.body.toLowerCase() === "#nospam") {
      await cl.reply(
        message.chatId,
        "Tambah #nospam di deskripsi grup biar #spam gabisa",
        message.id
      );
    } else if (message.isGroupMsg && message.body.toLowerCase() === "#leave") {
      const user = message.chat.groupMetadata.participants.find(
        (pat) => pat.id === message.author
      );
      if (user && user.isAdmin) {
        await cl.sendText(message.chatId, "gamao, gw gamao leave");
        //await cl.leaveGroup(message.chat.id);
      } else {
        await cl.reply(message.chatId, "Gabisa, lu bukan admin", message.id);
      }
    } else if (message.isGroupMsg && message.body.startsWith("#kick ")){
      if (user && user.isAdmin) {
        await cl.removeParticipant(message.chat.Id, message.body.split("#kick "));
      } else {
        await cl.reply(message.chatId, "Gabisa, lu bukan admin", message.id);
      }
    } else if (message.isGroupMsg && message.body.toLowerCase() === "#loginvr"){
      const vr = "Login vr dong \n yasman @6281285600258 \n hadid @6281329989383 \n junas @628978113198 \n barra @6281388088047 \n titan @6287788087760 \n sean @6283818448972 \n ari @6281299115053 \n dito @6285155277438";
      await cl.sendTextWithMentions(message.chatId, vr);
    } else if (message.body.toLowerCase() === "#halo"){
      await cl.sendFileFromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/haloo.mp3', "halo.aac", "Haloo", null, null, null, true);
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/haloo.png');
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/halo2.jpeg');
    } else if (message.body.toLowerCase() === "#asep"){
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/asep1.png');
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/asep2.png');
    } else if (message.body.toLowerCase() === "#tabah"){
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/tabah1.jpeg');
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/tabah2.jpg');
    } else if (message.body.toLowerCase() === "#lutelat"){
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/lotelat.jpeg');
    } else if (message.body.toLowerCase() === "#bayu"){
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/bayu1.jpeg');
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/bayu2.jpeg');
    } else if (message.body.toLowerCase() === "#payoy"){
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/payoy.jpg');
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/payoy.jpg');
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/payoy.jpg');
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/payoy.jpg');
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/payoy2.jpeg');
    } else if (message.body.toLowerCase() === "#teja"){
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/teja1.jpg');
      await cl.sendStickerfromUrl(message.chatId, 'https://tesuu.luii-index.workers.dev/2:/stiker/teja2.webp');
    } else if (message.body.startsWith("#addtugas ")){
      const tugasadd = message.body.split("#addtugas ");
      tugas.push(tugasadd);
      await cl.reply(message.chatId, "Tugas sudah ditambahkan!", message.id);
    } else if (message.body.startsWith("#listtugas")){
      await cl.reply(message.chatId, "Daftar tugas : ", message.id);
      tugas.forEach(function (item, index){
        await cl.sendText(message.chatId, (index+1) + item);
      });
    } else if (message.body.startsWith("#hapustugas ")){
      const nomer = message.body.split("#hapustugas ");
      delete tugas[nomer];
      await cl.reply(message.chatId, "Tugas dengan nomor " + nomer + " sudah dihapus", message.id);
    }
  } else if (
    ["image", "video"].includes(message.type) &&
    message.caption === "#sticker"
  ) {
    await cl.reply(message.chatId, "Bentar, stiker lagi di proses...", message.id);
    const mediaData = await decryptMedia(message);
    const dataUrl = `data:${message.mimetype};base64,${mediaData.toString(
      "base64"
    )}`;
    message.type === "image" &&
      (await cl.sendImageAsSticker(message.chatId, dataUrl, message.id));
    message.type === "video" &&
      (await cl.sendMp4AsSticker(message.chatId, dataUrl));
  }
}

/**
 * Add message to process queue
 */
const processMessage = (message) =>
  queue.add(async () => {
    try {
      await procMess(message);
    } catch (e) {
      console.log(e);
    }
  });

/**
 * Initialize client
 * @param {import("@open-wa/wa-automate").Client} client
 */
async function start(client) {
  cl = client;
  queue.start();
  const unreadMessages = await client.getAllUnreadMessages();
  unreadMessages.forEach(processMessage);
  client.onMessage(processMessage);
}

ev.on("qr.**", async (qrcode) => {
  const imageBuffer = Buffer.from(
    qrcode.replace("data:image/png;base64,", ""),
    "base64"
  );
  fs.writeFileSync("./public/qr_code.png", imageBuffer);
});

create({
  qrTimeout: 0,
  cacheEnabled: false,
}).then((client) => start(client));

server.use(express.static("public"));
server.listen(PORT, () =>
  console.log(`> Listining on http://localhost:${PORT}`)
);

process.on("exit", () => {
  if (fs.existsSync("./session.data.json")) {
    fs.unlinkSync("./session.data.json");
  }
});
