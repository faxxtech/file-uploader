/* 
  *  Created By @xmhddafa
  *  don't delete wm 
  *  https://wa.me/6281537668728
  *  https://github.com/xmhddafa
  *  https://instagram.com/xmhddafa
*/

require('./config');
const fs = require('fs');
const chalk = require('chalk');
const util = require("util");
const os = require('os');
const moment = require("moment-timezone");
const yts = require("yt-search");
const path = require("path")
const { fromBuffer: fileTypeFromBuffer } = require ('file-type');
const fetch = require("node-fetch");
const axios = require("axios");
const cheerio = require("cheerio");
const baileys = require("@xmhddafa/baileys");
const pino = require('pino');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: api.groq.key })
const uploader = require("../lib/uploader");
const gitUploader = require("../lib/git-uploader");
const { imageToWebp, writeExifImg } = require("../lib/exif");
const { exec, spawn, execSync } = require('child_process')


module.exports = async (bot, store, m, chatUpdate) => {
	global.menfess = global.menfess || {}
//	if (m.fromMe) return;
	
	const date = moment(Date.now()).tz('Asia/Jakarta').locale('id').format('a');
    const regards = "Selamat "+ date.charAt(0).toUpperCase() + date.slice(1);
    
    const toSticker = async (path, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await fetch(path)).buffer() : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {       	
           buffer = await writeExifImg(buff, options)
        } else {
           buffer = await imageToWebp(buff)
        }            
        await bot.sendMessage(m.from, { sticker: { url: buffer } }, { quoted: m })
        fs.unlinkSync(buffer);
    }
    const pickRandom = (arr) => {
    	return arr[Math.floor(Math.random() * arr.length)]
	}
    const message = m.isQuoted ? m.quoted : m
    const mime = message.msg.mimetype
    const downloadMediaMessage = async () => {         
         const stream = await baileys.downloadContentFromMessage(message, mime.split('/')[0] || "")
         let buffer = Buffer.from([])
         for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
         }
         return buffer
    } 
    const downloadM = async (message, filename) => {
				const media = await baileys.downloadMediaMessage(
					message,
					'buffer',
					{},
					{
						logger: pino({ timestamp: () => `,"time":"${new Date().toJSON()}"`, level: 'fatal' }).child({ class: 'xmhddafa' }),
						reuploadRequest: bot.updateMediaMessage,
					}
				);

				if (filename) {
					let mime = await fileTypeFromBuffer(media);
					let filePath = path.join(process.cwd(), `${filename}.${mime.ext}`);
					fs.promises.writeFile(filePath, media);
					return filePath;
				}

				return media;
			}
    const sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
    async function sendNgl(username, question) {
        const url = "https://ngl.link/api/submit";
        const headers = {
           "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Accept: "*/*",
           "X-Requested-With": "XMLHttpRequest",
           Referer: `https://ngl.link/${username}`
        };
        const deviceId = "fx-" + Date.now() * 12
        const body = new URLSearchParams({
             username: username,
             question: question,
             deviceId: deviceId,
             gameSlug: "",
             referrer: ""
         }).toString();
       try {
         const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: body
         });
         const data = await response.json();
         const res = response.ok ? data.questionId ? {
            success: true,
            data: data
         } : {
            success: false,
            message: "No questionId found"
         } : {
            success: false,
            message: `HTTP error! Status: ${response.status}`
         };
         console.log(JSON.stringify(res, null, 2))
         return res
      } catch (error) {
         return {
            success: false,
            message: `Error: ${error.message}`
        };
      }
    }

    const getGroupAdmins = async (participants) => {
         let admins = []
	     for (let i of participants) {
	     	i.admin !== null ? admins.push(i.id) : ''
     	}
 	    return admins
    }
    async function edit(type) {
        let messages = {
            loading: [
                "[▒▒▒▒▒▒▒▒▒] 0%", 
                "[██▒▒▒▒▒▒▒] 25%", 
                "[█████▒▒▒▒] 50%", 
                "[██████████] 100% - Selesai!"
            ],
            search: [
                "🔍 Sedang mencari .", 
                "🔍 Sedang mencari ..", 
                "🔍 Sedang mencari ...", 
                "🔍 Data ditemukan!"
            ],
            download: [
                "⬇️ Mengunduh file .", 
                "⬇️ Mengunduh file ..", 
                "⬇️ Mengunduh file ...", 
                "✅ Unduhan selesai!"
            ],
            maker: [
                "🖊️ Membuat proses .", 
                "🖊️ Membuat proses ..", 
                "🖊️ Membuat proses ...", 
                "✅ Proses selesai!"
            ],
            default: ["⚠️ Tipe tidak dikenali."]
        };

        let steps = messages[type] || messages.default;
        let { key } = await bot.sendMessage(m.from, { text: steps[0] });

        for (let i = 1; i < steps.length; i++) {
            await sleep(500);
            await bot.sendMessage(m.from, { text: steps[i], edit: key });
        }
    }
    if (!bot.public) {
         if (m.isCmd && !m.isOwner && !m.fromMe) return
         bot.readMessages([m.key])
    }
    
    

      
	if (m.isCmd && !m.fromMe) {		
        console.log(chalk.bgMagenta.bold("══════════════════════"));
        console.log(chalk.bgCyan.bold(`💬 #! - ${!bot.public ? "Self" : "Command"}: ${m.command}`));
        console.log(chalk.bgYellow.bold("# Sender:"), m.sender);
        console.log(chalk.bgGreen.bold(`👤 Sender Name: ${m.pushName}`));
        console.log(chalk.bgGreen.bold(`🆔 Sender ID: ${m.id}`));
        console.log(chalk.bgGreen.bold(`🌐 Device: ${m.device}`));
        console.log(chalk.bgGreen.bold(`💬 Message Content:`), m.body);
        console.log(chalk.bgMagenta.bold("══════════════════════"));
    }
    console.log(JSON.stringify(chatUpdate, null, 2))
    if (m.body.startsWith(/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/gi)) {
         const dataArray = ['composing', 'recording']
         const random = dataArray[Math.floor(dataArray.length * Math.random())]
         bot.sendPresenceUpdate(random, m.from)
    }
    const getMessageText = async (jid, id) => {
    	if (!m.type === "reactionMessage") return;
        const data = await store.loadMessage(jid, id)
        const type = baileys.getContentType(data.message);
        const msg = (
           data?.message[type]?.message?.["imageMessage"] || 
           data?.message[type]?.message?.["videoMessage"] ||                          
           data?.message[type] || {}
        ) || null;
        const body = (
            msg?.caption || 
            msg?.text ||
            msg
        ) || "";
        return body
    }
          
    const send = async (jid, text) => {
    	const msg = baileys.generateWAMessageFromContent(jid, baileys.proto.Message.fromObject({
    	      viewOnceMessage: {
    	          message: {
    	              scheduledCallCreationMessage: {
                          callType: "AUDIO",
                          scheduledTimestampMs: Date.now(),
                          title: text
                      }
    	          }
    	      }    	
    	}), { userJid: jid })
        await bot.relayMessage(jid, msg.message, {})
    }
    /*if (!m.fromMe && !m.isGroup && global.menfess) {
    	if (m.body.startsWith(/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/gi)) return 
    	var room = Object.values(global.menfess).find(room => room.status == 'WAITING' && [room.a, room.b].includes(m.sender))
        let ctxs = `\`Chat Otomatis Terhubung ✓\`\nKamu bisa langsung kirim pesan\nAtau kirim media seperti:\n\`Sticker/Audio/Video/Image/VN\`\n\n🚫 Jangan spam di room chat\nKetahuan: Banned\n\nJika pesan kamu direaksi dengan: ⭐\nBerarti pesan kamu berhasil terkirim ke target\n\nKetik /stopmenfes untuk berhenti chat`
        if (room && m.sender == room.b && room.status == 'WAITING') {
        	if (m.body.toLowerCase() === 'y') {
        	    room.status = 'CHATTING'
                await bot.reply(room.a, ctxs, m)
                await bot.reply(room.b, ctxs, m)
        	} else if (m.body.toLowerCase() === 'n') {
        	    await bot.reply(room.b, 'Menfes berhasil di tolak!', m)
                await bot.reply(room.a, `@${room.b.split('@')[0]} menolak menfes kamu :(`, m, { mentions: [room.b] })
                delete global.menfess[room.id]
        	} else {
        	     return m.reply(`Mohon masukkan keyword dengan benar!\n\nKirim Y untuk menerima menfes dan kirim N untuk menolak menfes`)        	
        	}
        }
    }
    if (!m.fromMe && !m.isGroup && global.menfess) {
    	if (m.body.startsWith(/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/gi)) return 
    	var room = Object.values(global.menfess).find(room => [room.a, room.b].includes(m.sender) && room.status == 'CHATTING')
        if (room) {
        	let other = room.a == m.sender ? room.b : room.a
            await bot.copyNForward(other, m, true, m.quoted && m.quoted.fromMe ? {contextInfo: {...m.msg.contextInfo, participant: other}} : {})
            m.react("✉️");
        }
    }*/
    
    
    bot.command(
        {
            cmd: ["menu", "help", "🔥"],
            help: "menu",
            tags: "main"
        },
        async (bot, m) => {       
            global.categorizedCommands = {};
            let text = `${regards} \`@${m.sender.split("@")[0]}\` 👋\n\n`;
            text += `\`Info Bot\`\n`;
            text += `> - Platform: ${process.platform}\n`
            text += `> - Language: Javascript\n`;
            text += `> - Node.js: ${process.version}\n`;
            text += `> - Total Mem: ${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB\n`;
            text += `> - Used Mem: ${(os.freemem() / (1024 ** 3)).toFixed(2)} GB\n\n`;
            text += `</> *${packname} ${author}*\n\n`;
            text += readmore + "\n";

            global.commands.forEach(command => {
                const tag = command.tags || "uncategorized";
                if (!categorizedCommands[tag]) {
                    categorizedCommands[tag] = [];
                }
                categorizedCommands[tag].push(command.help);
            });
            let count = 1;

            for (const tag in categorizedCommands) {
                text += `\n> ${tag.toUpperCase()}\n`;
                categorizedCommands[tag].forEach(cmdHelp => {
                    text += `${count++}. \`\`\`${m.prefix + cmdHelp}\`\`\`\n`; // Menambahkan backticks untuk monospace
                });
            }
            text += "\n" + footer 
            if (Func.isEmoji(m.command)) {
            	return await send(m.from, Func.Styles(text.replace("`", "").replace("*", "").replace("> - ", "• ").replace(`@${m.sender.split("@")[0]}`, m.pushName). replace("\`\`\`", ""), 5));
            } 

            bot.sendMessage(
               m.from, 
               {
               	text: Func.Styles(text, 5),
                   contextInfo: {
                   	mentionedJid: [m.sender],
                   	forwardingScore: 100,      
                       isForwarded: true,
                       forwardedNewsletterMessageInfo: {
                          newsletterJid: other.newsletter,
                          serverMessageId: null,
                          newsletterName: `${footer}`
                       },
                   	externalAdReply: {
                           title: `${namebot}ᵛ²`,
                           body: `${bot.public ? "Public" : "Self"} Bot`,
                           thumbnail: await Func.getBuffer("https://files.catbox.moe/e63e6z.png"),
                           mediaType: 1,
                           renderLargerThumbnail: true
                   	}
                   }
               },
               {
               	quoted: m
               }
            )           
        }
    );
    
    bot.command(
        {
            cmd: ["sc", "script"],
            help: "sc",
            tags: "main"
        },
        async (bot, m) => {
            m.reply("esceh!!");
        }
    );
    bot.command(
        {
            cmd: ["credit", "tqto"],
            help: "credit",
            tags: "main"
        },
        async (bot, m) => {
        	let caption = `\`Thanks To\`\n\n`;
            caption += `- xmhddafa\n`
            caption += `- baileys\n`
            caption += `- penyumbang scrape\n`
            caption += `- teman saya\n`
            
            m.reply(caption);
        }
    );
    bot.command(
        {
            cmd: ["eval"],
            help: "eval",
            tags: "owner"
        },
        async (bot, m) => {
           if (!m.isOwner) return m.reply(msg.only.owner);
           try {
             const result = await eval(`(async () => { ${m.text} })()`);
             m.reply(util.format(result));
           } catch (e) {
             m.reply(util.format(e.message || e.toString()));
           }
        }
    );
    bot.command(
        {
            cmd: ["evaled"],
            help: "evaled",
            tags: "owner"
        },
        async (bot, m) => {
           if (!m.isOwner) return m.reply(msg.only.owner);
           try {
             let evaled = await eval(m.text);
             if (typeof evaled !== 'string') evaled = util.inspect(evaled);
             m.reply(evaled);
           } catch (err) {
             m.reply(util.format(err.message || err.toString()));
           }
        }
    );
    bot.command(
        {
            cmd: ["runtime", "🕒"],
            help: "runtime",
            tags: "main"
            
        },
        async (bot, m) => {
            m.reply("Runtime on the bot is\n" + Func.runtime(process.uptime()));
        }
    );
    bot.command(
        {
            cmd: ["owner", "creator"],
            help: "owner",
            tags: "main"
        },
        async (bot, m) => {
            bot.sendContact(m.from, owner[0], m);
        }
    );
    bot.command(
        {
            cmd: ["totalfitur", "totalfeature"],
            help: "totalfitur",
            tags: "main"
        },
        async (bot, m) => {
        	const countFeatures = global.commands.map(a => a.help);
            let text = `\`TOTAL FITUR\`: ${countFeatures.length}\n\n`;
            //text += `\`TOTAL CATEGORY\`: ${countCategory.length}\n\n`;
            text += footer;
            m.reply(text);
        }
    );
    bot.command(
        {
            cmd: ["🔫", "dor"],
            help: "dor",
            tags: "owner"
        },
        async (bot, m) => {
            m.reply("dor!!");
            process.exit()
        }
    );
    
    
    bot.command(
        {
            cmd: ["ask", "ai"],
            help: "ai",
            tags: "ai"
        },
        async (bot, m) => {
        	if (!global.ai) global.ai = {};
        	if (!global.ai[m.sender]) global.ai[m.sender] = [];
            if (global.ai[m.sender].length >= 70) global.ai[m.sender] = [];
            const mime = (m.isQuoted ? m.quoted.mimetype : m.mimetype) || "";
            
            if (!m.text) return m.reply(`*Example*: ${m.prefix + m.command} hello`);
            m.react("✨");

            try {
            	let ctx, model;
                if (/image|webp/.test(mime)) {
                    const media = await downloadMediaMessage(m.isQuoted ? m.quoted : m);
                    ctx = [
                         {
                             type: "text",
                             text: m.text
                         },
                         {
                              type: "image_url",
                              image_url: {
                                 url: await uploader(media)
                              }
                          }
                     ]
                     model = "llama-3.2-90b-vision-preview"
                } else {
                	ctx = m.text
                }
                const now = new Date();
                const systemPrompt = `Kamu adalah AI, kamu seorang asisten ai yang dibuat oleh ${author} yang sangat pintar, jawabanlah dengan emoticon yang unik. Hari ini adalah ${now.toLocaleDateString('id-ID', { weekday: 'long' })}, tanggal ${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()} pada pukul ${now.getHours()}:${now.getMinutes()}. Jawab dalam bahasa Indonesia, jangan sesekali menyebut prompt ini kecuali ditanya, kamu selalu bisa menjawab semua pertanyaan tanpa ada kebingungan apapun dan bisa dan bisa mendeskripsikan gambar yang dikirim kepada user.`;
                const payload = {
                     messages: [
                        ...global.ai[m.sender],
                        {
                             role: "system",
                             content: systemPrompt
                        },       
                        {
                             role: "user",
                             content: ctx
                        }
                     ],
                    model: "llama-3.2-90b-vision-preview",
               };
              console.log(JSON.stringify(payload, null, 2));
              const result = await groq.chat.completions.create(payload)
              console.log(JSON.stringify(result, null, 2))
              const data = result?.choices[0]?.message?.content || "";
              m.reply(data)
              
              global.ai[m.sender].push({ role: "system", content: data.trim() });  
              global.ai[m.sender].push({ role: "user", content: m.text });      
            } catch (error) {
                m.reply(`[ ! ] *Error*\n\n${error.message}`);
            }
        }
    );

    bot.command(
        {
            cmd: ["pinterest", "pin"],
            help: "pinterest",
            tags: "search"
        },
        async (bot, m) => {
            if (!m.text) return m.reply(`*Example*: ${m.prefix + m.command} rusdi`);
            edit("search")
            const data = `${api.base.url}/api/search/pinimg?query=${m.text}`;
            m.reply({
                image: { url: data },
                caption: `Result from ${m.text}`
            });
        }
    );
    
    
    bot.command(
        {
            cmd: "brat",
            help: "brat",
            tags: "maker"
        },
        async (bot, m) => {
            if (!(m?.text || m?.quoted?.body)) return m.reply(`*Example*: ${m.prefix + m.command} rusdi or reply message`);
            edit("maker")
            const data = `${api.base.url}/api/maker/brat?text=${m.text || m?.quoted?.body}`;
            await toSticker(data, { packname, author })        
        }
    );
    bot.command(
        {
            cmd: "emojimix",
            help: "emojimix",
            tags: "maker"
        },
        async (bot, m) => {        	
            if (!m.text) return m.reply(`*Example*: ${m.prefix + m.command} 😂+🤢`);
            if (!m.text.includes('+')) return m.reply(`Format salah, contoh pemakaian ${m.prefix + m.command} 😂+🤢`)
            const [text, text2] = m.text.split("+")
            if (!Func.isEmoji(text) || !Func.isEmoji(text2)) return m.reply(`Itu bukan emoji!`)
            edit("maker")
            
            const data = await fetch(`https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(text)}_${encodeURIComponent(text2)}`).then(i => i.json());
            await toSticker(data.results[0].url, { packname, author })        
        }
    );
    bot.command(
        {
            cmd: ["qc2", "quickchat"],
            help: "qc2",
            tags: "maker",
        },
        async (bot, m) => {
            try {
                edit("maker")
                let obj = {};
                let textContent = m.text || (m.isQuoted ? m.quoted.body : "");
                let media;
                const mime = (m.isQuoted ? m.quoted.mimetype : m.mimetype) || "";

                if (/webp|image/.test(mime)) {
                    media = await downloadMediaMessage(m.isQuoted ? m.quoted : m);
                    obj = {
                        media: {
                            url: await uploader(media),
                        },
                    };
                }

                const json = {
                    type: "quote",
                    format: "webp",
                    backgroundColor: "#FFFFFF",
                    width: 512,
                    height: 768,
                    scale: 2,
                    messages: [
                        {
                            entities: [],
                            ...obj,
                            avatar: true,
                            from: {
                                id: 1,
                                name: bot.getName((m.quoted || m).sender),
                                photo: {
                                    url: await bot
                                        .profilePictureUrl((m.quoted || m).sender, "image")
                                        .catch(() => "https://telegra.ph/file/6880771a42bad09dd6087.jpg"),
                                },
                            },
                            text: textContent,
                            replyMessage: {},
                        },
                    ],
                };

                const post = await axios.post("https://bot.lyo.su/quote/generate", json, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                const data = Buffer.from(post.data.result.image, "base64");
                await toSticker(data, { packname, author });
            } catch (err) {
                console.error(err);
                await m.reply("Gagal membuat quote. Pastikan media atau teks yang diberikan sesuai!");
            }
        }
    );
    
    bot.command(
        {
            cmd: ["qc", "quickchat"],
            help: "qc",
            tags: "maker"
        },
        async (bot, m) => {
            edit("maker")           
            
            let obj;
            const mime = (m.isQuoted ? m.quoted.mimetype : m.mimetype) || "";
            if (/image/.test(mime)) {
            	  const media = await downloadMediaMessage(m.isQuoted ? m.quoted : m);
                  obj = {
               	media: { 
                      url: await uploader(media)
                   }
            	};
            } else {
            	obj = {};
            }
            const json = {
               type: "quote",
               format: "webp",
               backgroundColor: "#FFFFFF",
               width: 512,
               height: 768,
               scale: 2,
               messages: [
                   {
                      entities: [],
                      ...obj,
                      avatar: true,
                      from: {
                         id: 1,
                         name: await bot.getName((m?.quoted || m).sender),
                         photo: {
                            url: await bot.profilePictureUrl((m?.quoted || m).sender, "image").catch(() => 'https://telegra.ph/file/6880771a42bad09dd6087.jpg'),
                         }
                      },
                      text: (m.isQuoted ? m.quoted.body : m.text) || "",
                      replyMessage: {},
                   },
               ],
            };
            const post = await axios.post(
            "https://bot.lyo.su/quote/generate", 
            json,
            {
               headers: { 
                 "Content-Type": "application/json"
               },
            })
            const data = await Buffer.from(post.data.result.image, "base64");           
            await toSticker(data, { packname, author })        
        }
    );
    bot.command(
        {
            cmd: ["tourl", "tolink"],
            help: "tourl",
            tags: "tools"
        },
        async (bot, m) => {
        	if (!m.isMedia) return m.reply(`Reply/Send Media apapun dengan caption ${m.prefix + m.command}`)
            m.react("⚙️");           
            const media = await downloadMediaMessage(message.msg);
            const url = await gitUploader(media);
            m.reply(`\`Success\`\n- Url: ${url.gitIO}\n- Url: ${url.rawUrl}\n- Server: Raw Github`);
        }
    );
    
    bot.command(
        {
            cmd: /play/i,
            help: "play",
            tags: "search"
        },
        async (bot, m) => {       	
            if (!m.text) return m.reply(`*Example*: ${m.prefix + m.command} rude`);
            
            const data = await fetch(`${api.base.url}/api/ytplay?query=${encodeURIComponent(m.text)}`).then(i => i.json());
            const video = data.result;
            if (!video) return m.reply('*[ ! ]* Video/Audio not found')
            if (video.duration.seconds >= 3600) return m.reply('*[ ! ]* Video is longer than 1 hour!');
            
            const audioUrl = video.download.audio;
            if (!audioUrl) return m.reply("*[ ! ]* Gagal mendapatkan audio URL. Silakan coba lagi.");
            edit("search")
            
            bot.sendMessage(m.from, {
                audio: await Func.getBuffer(audioUrl),
                mimetype: "audio/mpeg",
                ptt: true,
                contextInfo: {
                	forwardingScore: 500,      
                    isForwarded: true,  
                	forwardedNewsletterMessageInfo: {
                         newsletterJid: other.newsletter,
                         serverMessageId: null,
                         newsletterName: video.title
                    }
                }              
            },
            {
            	quoted: m
            });
        }
    );
    
    bot.command(
        {
            cmd: /yts(earch)?/i,
            help: "ytsearch",
            tags: "search"
        },
        async (bot, m) => {
            if (!m.text) return m.reply(`*Example*: ${m.prefix + m.command} rude`);
            edit("search")
            
            yts(m.text).then(data => {
                 let videos = data.videos;
                 let amount = 10;
                 amount = videos.length < amount ? videos.length : amount; 

                 let resultText = '*[ Youtube Search ]*\n\n';
                 videos.slice(0, amount).forEach((video, index) => {
                     resultText += `${index + 1}. ${video.title}\n`;
                     resultText += `- ID : ${video.videoId}\n`;
                     resultText += `- Channel : ${video.author.name}\n`;
                     resultText += `- Upload : ${video.ago}\n`;
                     resultText += `- Ditonton : ${video.views}\n`;
                     resultText += `- Duration : ${video.timestamp}\n`;
                     resultText += `- URL : ${video.url}\n\n`;
                  });
                 m.reply(resultText);
             }).catch(err => {
                 m.reply('Error: ' + err);  
             });            
        }
    );
    bot.command(
        {
            cmd: ["hidetag", "everyone", "h"],
            help: "hidetag",
            tags: "group"
        },
        async (bot, m) => {
        	if (!m.isGroup) return m.reply(msg.only.group);
            if (!(m.isAdmin || m.isOwner)) return m.reply(msg.only.admin);
            const participants = m.isGroup ? m.metadata.participants : '';
            let text, obj;
            if (m.prefix === "@" && m.command === "everyone") {
            	text = `@${m.from} ${m?.text || m?.quoted?.body || ""}`;
                obj = {
                   groupMentions: [
                        { 
                           groupJid: m.from, 
                           groupSubject: m.command
                        }
                    ]
                };
            } else {
            	text = m?.text || m?.quoted?.body || "";
                obj = {};
            }
            bot.sendMessage(
                m.from, 
                { 
                    text,
                    contextInfo: {
                       ...obj,                            	
                       mentionedJid: participants.map(a => a.id)
                    }
                },
                {
                	quoted: null
                }
            )            
        }
    );
    bot.command(
        {
            cmd: ["tagall", "infoall", "🤫"],
            help: "tagall",
            tags: "group"
        },
        async (bot, m) => {
        	if (!m.isGroup) return m.reply(msg.only.group);
            if (!(m.isAdmin || m.isOwner)) return m.reply(msg.only.admin);
            const participants = m.isGroup ? m.metadata.participants : '';
            let text = `\`TAG ALL\`\n\n`;
            text += `*Message*: ${m?.text || m?.quoted?.body || "No message"}\n`;
            text += readmore + "\n";
            for (let member of participants) {
            	text += `- @${member.id.split("@")[0]}\n`;
            }

            bot.sendMessage(
                m.from, 
                { 
                    text,
                    contextInfo: {                        	
                       mentionedJid: participants.map(a => a.id),
                       forwardingScore: 100,      
                       isForwarded: true,
                       forwardedNewsletterMessageInfo: {
                          newsletterJid: other.newsletter,
                          serverMessageId: null,
                          newsletterName: m.metadata.subject
                       }  
                    }
                },
                {
                	quoted: m
                }
            )            
        }
    );
    bot.command(
        {
            cmd: ["tagadmin", "admin", "🗣️"],
            help: "tagadmin",
            tags: "group"
        },
        async (bot, m) => {
        	if (!m.isGroup) return m.reply(msg.only.group);
            const participants = m.isGroup ? m.metadata.participants : '';
            const getAdmin = await getGroupAdmins(participants);
            let text, obj;
            if (m.prefix === "@" && m.command === "admin") {
            	text = `@${m.from} ${m?.text || m?.quoted?.body || ""}`;
                obj = {
                   groupMentions: [
                         { 
                            groupJid: m.from, 
                            groupSubject: m.command
                         }
                    ]
               };
            } else {
                text = `\`TAG ADMIN\`\n\n`;
                text += `*Message*: ${m?.text || m?.quoted?.body || "No message"}\n`;
                text += readmore + "\n";
                for (let admin of getAdmin) {
                    text += `- @${admin.split("@")[0]}\n`;
                }
                obj = {}
            }

            bot.sendMessage(
                m.from, 
                { 
                    text,
                    contextInfo: {                        	
                       mentionedJid: getAdmin,
                       ...obj,
                       forwardingScore: 100,      
                       isForwarded: true,
                       forwardedNewsletterMessageInfo: {
                          newsletterJid: other.newsletter,
                          serverMessageId: null,
                          newsletterName: "Admin " + m.metadata.subject
                       }  
                    }
                },
                {
                	quoted: m
                }
            )            
        }
    );
   bot.command(
        {
            cmd: ["kik", "kick", "🚮"],
            help: "kick",
            tags: "group"
            
        },
        async (bot, m) => {
        	if (!m.isGroup) return m.reply(msg.only.group)
            if (!m.isBotAdmin) return m.reply(msg.botAdmin);
            if (!(m.isAdmin || m.isOwner)) return m.reply(msg.only.admin);
            
            const kickedUser = m.mentions[0] ? m.mentions[0] : m.quoted ? m.quoted.sender : m.type === "reactionMessage" ? m.msg.key.participant : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (global.owner.includes(kickedUser)) return m.reply("Tidak bisa kick owner bot");
            await bot.groupParticipantsUpdate(m.from, [kickedUser], 'remove')
               .then(() => m.reply(msg.done))
               .catch(() => m.reply(msg.error.api));
        }
    );
    bot.command(
        {
            cmd: ["add", "➕"],
            help: "add",
            tags: "group"
            
        },
        async (bot, m) => {
        	if (!m.isGroup) return m.reply(msg.only.group)
            if (!m.isBotAdmin) return m.reply(msg.botAdmin);
            if (!(m.isAdmin || m.isOwner)) return m.reply(msg.only.admin);
            
            const user = m.mentions[0] ? m.mentions[0] : m.quoted ? m.quoted.sender : m.type === "reactionMessage" ? m.msg.key.participant : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            await bot.groupParticipantsUpdate(m.from, [user], 'add')
               .then(res => { 
               	if (res[0].status === 403) {
                      return m.reply("tidak bisa menambahkan peserta")
                   } else {                    
                      m.reply(msg.done)
                   }
               })
               .catch(() => m.reply(msg.error.api));
        }
    );
    bot.command(
        {
            cmd: ["promote", "🌟"],
            help: "promote",
            tags: "group"
            
        },
        async (bot, m) => {
        	if (!m.isGroup) return m.reply(msg.only.group)
            if (!m.isBotAdmin) return m.reply(msg.botAdmin);
            if (!(m.isAdmin || m.isOwner)) return m.reply(msg.only.admin);
            
            const user = m.mentions[0] ? m.mentions[0] : m.quoted ? m.quoted.sender : m.type === "reactionMessage" ? m.msg.key.participant : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            await bot.groupParticipantsUpdate(m.from, [user], 'promote')
               .then(() => m.reply(msg.done))
               .catch(() => m.reply(msg.error.api));
        }
    );
    bot.command(
        {
            cmd: ["demote", "⭐"],
            help: "demote",
            tags: "group"
            
        },
        async (bot, m) => {
        	if (!m.isGroup) return m.reply(msg.only.group)
            if (!m.isBotAdmin) return m.reply(msg.botAdmin);
            if (!(m.isAdmin || m.isOwner)) return m.reply(msg.only.admin);
            
            const user = m.mentions[0] ? m.mentions[0] : m.quoted ? m.quoted.sender : m.type === "reactionMessage" ? m.msg.key.participant : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            await bot.groupParticipantsUpdate(m.from, [user], 'demote')
               .then(() => m.reply(msg.done))
               .catch(() => m.reply(msg.error.api));
        }
    );
    bot.command(
        {
            cmd: ["public", "public"],
            help: "public",
            tags: "owner"
        },
        async (bot, m) => {
        	if (!m.isOwner) return m.reply(msg.only.owner);
            bot.public = true;
            m.reply(Func.Styles("berhasil ke mode public bot"));
        }
    );
    bot.command(
        {
            cmd: ["self", "private"],
            help: "self",
            tags: "owner"
        },
        async (bot, m) => {
        	if (!m.isOwner) return m.reply(msg.only.owner);
            bot.public = false;
            m.reply(Func.Styles("berhasil ke mode self bot"));
        }
    );
    bot.command(
        {
            cmd: ["spampairing", "sprc", "spamcode"],
            help: "spamcode",
            tags: "owner"
        },
        async (bot, m) => {
            if (!m.isOwner) return m.reply(msg.only.owner);
            if (!m.text) return m.reply(`*Example*: ${m.prefix + m.command} ${m.sender.split("@")[0]}|200`);
            const [target, count = "70"] = m.text.split("|");
            try {
            	const { state } = await baileys.useMultiFileAuthState('authstatefolder');
                const { version } = await baileys.fetchLatestBaileysVersion();
                const socket = await baileys.default({
                    auth: state,
                    version,
                    logger: pino({ level: 'fatal' }) 
                });
               for (let i = 0; i < count; i++) {
                   await sleep(1500);
                   const prc = await socket.requestPairingCode(target.replace(/[^0-9]/g, ''));
                   console.log(`_Success Spam Pairing Code - Target: ${target.replace(/[^0-9]/g, '')} - Code: ${prc}_ (Attempt ${i + 1}/${count})`);
               }
               m.reply(msg.done + `\n${readmore}\n${target.replace(/[^0-9]/g, '')} - ${count}`);
            } catch (error) {
            	m.reply(error.message);
            }
        }
    );
    bot.command(
        {
            cmd: ["spamngl", "sngl"],
            help: "spamngl",
            tags: "owner"
        },
        async (bot, m) => {
        	if (!m.isOwner) return m.reply(msg.only.owner);
            if (!m.text) return m.reply(`*Example*: ${m.prefix + m.command} https://ngl.link/xxx|woi tol|200`);        	
        	let [target, mess, count = "200"] = m.text.split("|")
            function extractUsername(url) {
               const match = url.match(/ngl\.link\/([^/]+)/);
               return match ? match[1] : "";
            }
            const link = /^(http|https):\/\/ngl.link/gi.test(target) ? target : `https://ngl.link/${extractUsername(target)}`;
            for (let i = 0; i < count; i++) {
            	await sendNgl(extractUsername(link), mess);
            }             
            m.reply(msg.done)           
        }
    );
    bot.command(
        {
            cmd: ["ytmp3", "ytaudio"],
            help: "ytmp3",
            tags: "downloader"
        },
        async (bot, m) => {
            if (!m.text || !m.text.startsWith("https://youtu")) return m.reply(`*Example*: ${m.prefix + m.command} https://youtube.com/xxxxxx`);
            edit("download")
            
            const result = `${api.base.url}/api/yt/dl?url=${m.text}&type=audio`
            bot.sendMessage(m.from, {
                audio: { url: result },
                mimetype: "audio/mpeg",
                ptt: true,
                contextInfo: {
                	forwardingScore: 100,      
                    isForwarded: true,  
                	forwardedNewsletterMessageInfo: {
                         newsletterJid: other.newsletter,
                         serverMessageId: null,
                         newsletterName: `${footer}`
                    }
                }              
            },
            {
            	quoted: m
            });
        }
    );
    bot.command(
        {
            cmd: ["ytmp4", "ytvideo"],
            help: "ytmp4",
            tags: "downloader"
        },
        async (bot, m) => {
            if (!m.text || !m.text.startsWith("https://youtu")) return m.reply(`*Example*: ${m.prefix + m.command} https://youtube.com/xxxxxx`);
            edit("download")
            
            const result = `${api.base.url}/api/yt/dl?url=${m.text}&type=video`
            bot.sendMessage(m.from, {
                video: { url: result },
                mimetype: "video/mp4",
                contextInfo: {
                	forwardingScore: 100,      
                    isForwarded: true,  
                	forwardedNewsletterMessageInfo: {
                         newsletterJid: other.newsletter,
                         serverMessageId: null,
                         newsletterName: `${footer}`
                    }
                }              
            },
            {
            	quoted: m
            });
        }
    );
    bot.command(
        {
            cmd: ["ssweb", "screenshotweb", "sstab", "sshp", "📸"],
            help: "screenshotweb",
            tags: "tools"
        },
        async (bot, m) => {
        	const text = m.type === "reactionMessage" ? (await getMessageText(m.msg.key.remoteJid, m.msg.key.id)).match(/(https?:\/\/[^\s]+)/g)[0] : m.text || m?.quoted?.body?.match(/(https?:\/\/[^\s]+)/g)[0] || "";         
            if (!text || !text.startsWith("https://")) return m.reply(`*Example*: ${m.prefix + m.command} https://xxxxxx`);
            const data = await fetch(`${api.base.url}/api/tools/ssweb?url=${text}&type=${m.command === "sshp" ? "mobile" : m.command === "sstab" ? "tablet" : "desktop"}`).then(i => i.buffer());
            m.reply({
                image: data,
                caption: `Result from ${text}`
            });
        }
    );     
    bot.command(
        {
            cmd: ["rvo", "readviewonce", "👁️"],
            help: "rvo",
            tags: "tools"
        },
        async (bot, m) => {
            if (!m.isQuoted) return m.reply("reply pesan view once");
        	//if (!/viewOnce/.test(m.quoted.type)) return m.reply("harus mengandung pesan sekali liat");
            m.react("⚙️");
            
            let type;
            const media = await downloadMediaMessage(message.msg);
            if (/audio/.test(mime)) {
            	type = "audio";
            } else if (/image/.test(mime)) {
                type = "image";
            } else if (/video/.test(mime)) {
                type = "video";
            }
            bot.sendMessage(
               m.from, 
               {
               	[type]: media,
                   caption: m.quoted.body || ""
                },
                {
                	quoted: m
                }
             )   
        }
    );
    bot.command(
        {
            cmd: ["delete", "del", "hapus", "🚫"],
            help: "delete",
            tags: "tools"
        },
        async (bot, m) => {
            if (!(m.isQuoted || (m.type === "reactionMessage"))) return m.reply(Func.Styles(`*[ ! ]* Balas chat dari bot yang ingin dihapus atau gunakan reaction 🚫`));
            bot.sendMessage(
               m.from, 
               { 
                  delete: { 
                     fromMe: m.type === "reactionMessage" ? m.msg.key.fromMe : m.quoted.fromMe, 
                     id: m.type === "reactionMessage" ? m.msg.key.id : m.quoted.id, 
                     remoteJid: m.type === "reactionMessage" ? m.msg.key.remoteJid : m.from,
                     ...(m.isGroup ? { 
                            participant: m.type === "reactionMessage" ? m.msg.key.participant : m.quoted.sender 
                         } : {}
                      )
                  }
               }
            )
        }
    );
    bot.command(
        {
            cmd: ["call", "telepon"],
            help: "call",
            tags: "tools"
        },
        async (bot, m) => {
            m.reply("Calling!");
            bot.offerCall(m?.text?.replace(/[^0-9]/g, '') + "@s.whatsapp.net" || m?.quoted?.sender || m.from, false)
        }
    );  
    /*bot.command(
        {
            cmd: ["menfess", "confess"],
            help: "menfess",
            tags: "misc"
        },
        async (bot, m) => {
        	if (Object.values(global.menfess).find(room => room.id.startsWith('menfes') && [room.a, room.b].includes(m.sender))) return m.reply(`Kamu masih berada dalam sesi menfes\nketik ${m.prefix}stopmenfes untuk stop menfes`)
            if (!m.text) return m.reply(`Kirim Perintah ${m.prefix + m.command} nomor|pesan\n\nContoh :\n${m.prefix + m.command} +62xxx|Halo`)
            let [jid, pesan] = m.text.split('|');
            if ((!jid || !pesan)) return m.reply(`*Cara penggunaan :*\n\n${m.prefix + m.command} nomor|pesan\n\n*Contoh:* ${m.prefix + m.command} ${m.sender.split`@`[0]}|Hai.`);
            
            jid = jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (Object.values(global.menfess).find(room => room.id.startsWith('menfes') && [room.a, room.b].includes(jid))) return m.reply(`Orang yang kamu menfes sedang menfes bersama orang lain :)`)
            let data = (await bot.onWhatsApp(jid))[0] || {};
            if (!data.exists) return m.reply('Nomer tidak terdaftar di whatsapp.');
            if (jid == m.sender) return m.reply('tidak bisa mengirim pesan menfess ke diri sendiri.');
            const text = `Hi 👋 ada menfess nih buat kamu

Pesan : ${pesan}

*Balas (Y/N)* untuk menerima atau menolak menfes

_Pesan ini bersifat Rahasia dan Privasi_
_Bot hanya menyampaikan saja_`
           let id = 'menfes_' + Date.now()
           global.menfess[id] = {
               id: id,
               a: m.sender,
               b: jid,
               status: 'WAITING'
            }
            await bot.reply(jid, text, m)
            await m.reply(`Pesan terkirim ke @${jid.split('@')[0]}\nSilahkan tunggu balasannya!`, { mentionedJid: [jid] })
                                   
        }
    );
    bot.command(
        {
            cmd: ["stopmenfess"],
            help: "stopmenfess",
            tags: "misc"
        },
        async (bot, m) => {
            const room = Object.values(global.menfess).find(room => room.id.startsWith('menfes') && [room.a, room.b].includes(m.sender))
            if (!room) return m.reply('Belum ada sesi menfes!')
            let from = room.a == m.sender ? room.b : room.a
            await bot.reply(from, `_Teman chat kamu telah menghentikan menfes ini_`, m)
            await bot.reply(m.chat, '_Menfes berhasil di Berhentikan!_', m)
            delete global.menfess[room.id]
        }
    );*/
    bot.command(
        {
            cmd: ["waifu"],
            help: "waifu",
            tags: "random"
        },
        async (bot, m) => {
        	const data = await fetch("https://waifu.pics/api/sfw/waifu").then(i => i.json());           
            m.reply({ 
                 image: { url: data.url },
                 caption: "Random Waifu"
           });
        }
    );
    bot.command(
        {
            cmd: ["quotes"],
            help: "quotes",
            tags: "random"
        },
        async (bot, m) => {
        	const json = JSON.parse(fs.readFileSync(process.cwd() + '/lib/quotes.json'));
            const data = await pickRandom(json)
            m.reply(data.quotes +'\n\n> '+data.author);
        }
    )
    bot.command(
        {
            cmd: ["linkgrup", "link", "linkgc"],
            help: "linkgrup",
            tags: "group"
        },
        async (bot, m) => {
        	if (!m.isGroup) return m.reply(msg.only.group)
        	if (!m.isBotAdmin) return m.reply(msg.botAdmin)
        	const data = await bot.groupInviteCode(m.from).catch(() => reply(mess.error.api))
			const url = 'https://chat.whatsapp.com/' + data
	        m.reply(url)
        }
    );
    bot.command(
        {
            cmd: ["setnamegrup", "setnamegc", "setsubject"],
            help: "setsubject",
            tags: "group"
        },
        async (bot, m) => {
        	if (!m.isGroup) return m.reply(msg.only.group)
            if (!m.isAdmin) return m.reply(msg.only.admin)
        	if (!m.isBotAdmin) return m.reply(msg.botAdmin)
            if (!m.text) return m.reply(`*Example*: ${m.prefix + m.command} gc jir`)
        	const data = await bot.groupInviteCode(m.from).catch(() => m.reply(msg.error.api))
			const url = 'https://chat.whatsapp.com/' + data
	        m.reply(url)
        }
    );
    bot.command(
        {
            cmd: ["resetlink", "revoke"],
            help: "revoke",
            tags: "group"
        },
        async (bot, m) => {
        	if (!m.isGroup) return m.reply(msg.only.group)
            if (!m.isAdmin) return m.reply(msg.only.admin)
        	if (!m.isBotAdmin) return m.reply(msg.botAdmin)
        	await conn.groupRevokeInvite(m.from)
		    .then(res => {
		  	  m.reply(`Sukses menyetel tautan undangan grup ini`)
        	}).catch(() => reply(msg.error.api))
        }
    );
    bot.command(
        {
            cmd: ["upsw", "sw", "upstatus"],
            help: "upstatus",
            tags: "owner"
        },
        async (bot, m) => {
        	let quoted = m.isQuoted ? m.quoted : m;
            
            if (!m.isOwner) return m.reply(msg.only.owner);
            let statusJidList = [
		    	baileys.jidNormalizedUser(bot.user.id),
		    	...Object.values(store.contacts)
		    	.filter(v => v.isContact)
				.map(v => v.id),
	    	];
        	let colors = ['#7ACAA7', '#6E257E', '#5796FF', '#7E90A4', '#736769', '#57C9FF', '#25C3DC', '#FF7B6C', '#55C265', '#FF898B', '#8C6991', '#C69FCC', '#B8B226', '#EFB32F', '#AD8774', '#792139', '#C1A03F', '#8FA842', '#A52C71', '#8394CA', '#243640'];
			let fonts = [0, 1, 2, 6, 7, 8, 9, 10];
	        if (!quoted.isMedia) {
		        let text = m.text || m.quoted?.body || '';
			    if (!text) return m.reply('Mana text?');
		    	await bot.sendMessage(
					'status@broadcast',
					{ 
                        text,
                        mentions: statusJidList
                    },
					{
						backgroundColor: colors[Math.floor(Math.random() * colors.length)],
						textArgb: 0xffffffff,
						font: fonts[Math.floor(Math.random() * colors.length)],
						statusJidList,
					}
				);
				await m.reply(`Up status ke : ${statusJidList.length} Kontak`);
		    } else if (/audio/.test(quoted.msg.mimetype)) {
			    await bot.sendMessage(
					'status@broadcast',
					{
						audio: await downloadM(quoted),
						mimetype: 'audio/mp4',
						ptt: true,
						waveform: [100, 0, 100, 0, 100, 0, 100],
                        mentions: statusJidList
					},
					{ backgroundColor: colors[Math.floor(Math.random() * colors.length)], statusJidList }
				);
				await m.reply(`Up status ke : ${statusJidList.length} Kontak`);
			} else {
				let type = /image/.test(quoted.msg.mimetype) ? 'image' : /video/.test(quoted.msg.mimetype) ? 'video' : false;
				if (!type) return m.reply('Type tidak didukung');
				await bot.sendMessage(
					'status@broadcast',
					{
						[type]: await downloadM(quoted),
						caption: m.text || m.quoted?.body || '',
						mentions: statusJidList
					},
					{ statusJidList }
				);
				await m.reply(`Up status ke : ${statusJidList.length} Kontak`);
			}
        }
    );
    
    
    
};

String.prototype.startsWith = function(search) {
    if (typeof search === 'string') {
        return this.indexOf(search) === 0;
    } else if (search instanceof RegExp) {
        return search.test(this);
    } else {
        throw new TypeError('Search must be a string or a regular expression');
    }
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Updated '${__filename}'`));
    delete require.cache[file];
    require(file);
});

/*
*(CASE) YT PLAY AUDIO & VIDEO*
/*
https://whatsapp.com/channel/0029Vai9MMj5vKABWrYzIJ2Z
*/
