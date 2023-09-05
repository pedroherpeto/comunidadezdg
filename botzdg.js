const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');
const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

function delay(t, v) {
  return new Promise(function(resolve) { 
      setTimeout(resolve.bind(null, v), t)
  });
}

app.use(express.json());
app.use(express.urlencoded({
extended: true
}));
app.use(fileUpload({
debug: true
}));
app.use("/", express.static(__dirname + "/"))

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-zdg' }),
  puppeteer: { headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ] }
});

client.initialize();

io.on('connection', function(socket) {
  socket.emit('message', '© BOT-ZDG - Iniciado');
  socket.emit('qr', './icon.svg');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© BOT-ZDG QRCode recebido, aponte a câmera  seu celular!');
    });
});

client.on('ready', () => {
    socket.emit('ready', '© BOT-ZDG Dispositivo pronto!');
    socket.emit('message', '© BOT-ZDG Dispositivo pronto!');
    socket.emit('qr', './check.svg')	
    console.log('© BOT-ZDG Dispositivo pronto');
});

client.on('authenticated', () => {
    socket.emit('authenticated', '© BOT-ZDG Autenticado!');
    socket.emit('message', '© BOT-ZDG Autenticado!');
    console.log('© BOT-ZDG Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', '© BOT-ZDG Falha na autenticação, reiniciando...');
    console.error('© BOT-ZDG Falha na autenticação');
});

client.on('change_state', state => {
  console.log('© BOT-ZDG Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', '© BOT-ZDG Cliente desconectado!');
  console.log('© BOT-ZDG Cliente desconectado', reason);
  client.initialize();
});
});

// Send message
app.post('/zdg-message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const message = req.body.message;

  if (numberDDI !== "55") {
    const numberZDG = number + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Mensagem não enviada',
      response: err.text
    });
    });
  }
});


// Send media
app.post('/zdg-media', [
  body('number').notEmpty(),
  body('caption').notEmpty(),
  body('file').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  if (numberDDI !== "55") {
    const numberZDG = number + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Imagem não enviada',
      response: err.text
    });
    });
  }
});

client.on('message', async msg => {

  const nomeContato = msg._data.notifyName;
  let groupChat = await msg.getChat();
  
  // if (groupChat.isGroup) return null;

  if (msg.type.toLowerCase() == "e2e_notification") return null;
  
  if (msg.body == "") return null;
	
  if (msg.from.includes("@g.us")) return null;

  if (msg.body !== null && msg.body === "1") {
    //msg.reply("*COMUNIDADE ZDG*\n\n🤪 _Usar o WPP de maneira manual é prejudicial a saúde_\r\n\r\nhttps://comunidadezdg.com.br/ \r\n\r\n⏱️ As inscrições estão *ABERTAS*\n\nAssista o vídeo abaixo e entenda porque tanta gente comum está economizando tempo e ganhando dinheiro explorando a API do WPP, mesmo sem saber nada de programação.\n\n📺 https://youtu.be/mr0BvO9quhw");
    msg.reply("Na *Comunidade ZDG* você vai integrar APIs, automações com chatbots e sistemas de atendimento multiusuário para whatsapp. Com *scripts para copiar e colar e suporte todos os dias no grupo de alunos*.\n\nhttps://comunidadezdg.com.br/ \n\n*⏱️ As inscrições estão ABERTAS*\n\nAssista o vídeo abaixo e entenda porque tanta gente comum está economizando tempo e ganhando dinheiro explorando a API do WPP, mesmo sem saber nada de programação.\n\n📺 https://www.youtube.com/watch?v=AoRhC_X6p5w")
  } 
  
  else if (msg.body !== null && msg.body === "2") {
    msg.reply("*" + nomeContato + "*, na Comunidade ZDG, você vai:\n\n- Utilizar códigos já testados para automatizar seu atendimento com chatbots no whatsapp\n- Criar e aplicativos para gestão de CRM e plataformas multiusuários para chats de atendimento\n- Aprender integrações com ferramentas e APIs que já foram testadas e aprovadas pela comunidade\n- Curadoria de plugins e ferramentas gratuitas para impulsionar o marketing de conversa no seu negócio\n- Se conectar a mais de 2.000 alunos que também estão estudando e implementando soluções de marketing de conversa\n- Grupo de alunos organizado por tópicos\n- Ter acesso ao meu suporte pessoal todos os dias");
  }
  
  else if (msg.body !== null && msg.body === "3") {
    msg.reply("*" + nomeContato + "*, " + "essas são as principais APIs que a ZDG vai te ensinar a usar com o WhatsApp:\nBaileys, Venom-BOT, WPPConnect, WPPWeb-JS e Cloud API (Api Oficial)\n\n*Essas são as principais integrações que a ZDG vai te ensinar a fazer com o WhatsApp:*\nBubble, WordPress (WooCommerce e Elementor), Botpress, N8N, DialogFlow, ChatWoot e plataformas como Hotmart, Edduz, Monetizze, Rd Station, Mautic, Google Sheets, Active Campaing, entre outras.");
  }
  
  else if (msg.body !== null && msg.body === "4") {

        const contact = await msg.getContact();
        setTimeout(function() {
            msg.reply(`@${contact.number}` + ' seu contato já foi encaminhado para o Pedrinho');  
            client.sendMessage('5515998566622@c.us','Contato ZDG. https://wa.me/' + `${contact.number}`);
	    //client.sendMessage('5515998566622@c.us',`${contact.number}`);
          },1000 + Math.floor(Math.random() * 1000));
  
  }
  
  else if (msg.body !== null && msg.body === "4") {
    msg.reply("Seu contato já foi encaminhado para o Pedrinho");
  }
  
  else if (msg.body !== null && msg.body === "5") {
    msg.reply("*" + nomeContato + "*, " + "aproveite o conteúdo e aprenda em poucos minutos como colocar sua API de WPP no ar, gratuitamente:\r\n\r\n🎥 https://youtu.be/sF9uJqVfWpg");
  }
  
  else if (msg.body !== null && msg.body === "7") {
    msg.reply("*" + nomeContato + "*, " + ", que ótimo, vou te enviar alguns cases de sucesso:\n\n📺 https://youtu.be/KHGchIAZ5i0\nGustavo: A estratégia mais barata, eficiente e totalmente escalável.\n\n📺 https://youtu.be/S4Cwrnn_Llk\nNatália: Nós aumentamos o nosso faturamento e vendemos pra mais clientes com a estratégia ZDG.\n\n📺 https://youtu.be/XP2ns7TOdIQ\nYuri: A ferramenta me ajudou muito com as automações da minha loja online.\n\n📺 https://youtu.be/KBedG3TcBRw\nFrancisco: O Pedrinho pega na nossa mão. Se eu consegui, você também consegue.\n\n📺 https://youtu.be/L7dEoEwqv-0\nBruno: A Comunidade ZDG e o suporte do Pedrinho são incríveis. Depois que eu adquiri o curso eu deixei de gastar R$300,00 todo mês com outras automações.\n\n📺 https://youtu.be/StRiSLS5ckg\nRodrigo: Eu sou desenvolvedor de sistemas, e venho utilizando as soluções do Pedrinho para integrar nos meus sistemas, e o ganho de tempo é excepcional.\n\n📺 https://youtu.be/sAJUDsUHZOw\nDarley: A Comunidade ZDG democratizou o uso das APIs do WPP.\n\n📺 https://youtu.be/S4Cwrnn_Llk\nNatália: Nós aumentamos o nosso faturamento e vendemos pra mais clientes com a estratégia ZDG.\n\n📺 https://youtu.be/crO8iS4R-UU \nndré: O Pedrinho compartilha muitas informações na Comunidade ZDG.\n\n📺 https://youtu.be/LDHFX32AuN0\nEdson: O retorno que tenho no meu trabalho com as informações do Pedrinho, fez o meu investimento sair de graça.\n\n📺 https://youtu.be/F3YahjtE7q8\nDaniel: Conteúdo de muita qualidade. Obrigado, professor Pedrinho.\n\n📺 https://youtu.be/YtRpGgZKjWI\nMarcelo: Tenho uma agência digital e com o curso do Pedrinho nós criamos um novo produto e já estamos vendendor.\n\n📺 https://youtu.be/0DlOJCg_Eso\nKleber: O Pedrinho tem uma didática excelente e com o curso dele, consegui colocar minha API para rodar 24 horas e estou fazendo vendas todos os dias.\n\n📺 https://youtu.be/rsbUJrPqJeA\nMárcio: Antes de adquirir eu tinha pouco conhecimento, mas consegui aprender muito sobre API com o Pedrinho e o pessoal da comunidade.\n\n📺 https://youtu.be/YvlNd-dM9oo\nZé: O Pedrinho tem um conteúdo libertador. Foi o melhor investimento que eu fiz. Conteúdo surreal.\n\n📺 https://www.youtube.com/watch?v=mHqEQp94CiE\nLéo: Acoplamos o Método ZDG aos nossos lançamento e otimizamos os nossos resultados.\n\n📺 https://youtu.be/pu6PpNRJyoM\nRenato: A ZDG é um método que vai permitir você aumentar o seu faturamento em pelo menos 30%.\n\n📺 https://www.youtube.com/watch?v=08wzrPorZcI\nGabi: Implementei a estratégia sem saber nada de programação\n\n📺 https://youtu.be/10cR-c5rOKE\nDouglas: Depois de implementar as soluções do Pedrinho eu tive um aumento de 30% no meu faturamento, sem contar que na comunidade ZDG todos se ajudam.\n\n📺 https://youtu.be/kFPhpl5uyyU\nDanielle: Sem sombra de dúvida ter conhecido o Pedrinho e o seu conteúdo foi a melhor coisa que aconteceu comigo.\n\n📺 https://youtu.be/3TCPRstg5M0\nCalebe: O sistema Zap das Galáxias foi fundamental na elaboração e na execução das estratégias do meu negócio.\n\n📺 https://youtu.be/XfA8VZck5S0\nArtur: As soluções da comunidade me ajudaram muito a aumentar as minhas vendas e a interagir com os meus clientes de maneira automática. O suporte é incrível.\n\n📺 https://youtu.be/4M-P3gn9iqU\nSamuel: A Comunidade ZDG tem muito conteúdo legal, que da pra você utilizar no seu dia a dia pra meios profissionais. Depois que aprendi o método, nunca mais tive bloqueios.");
  }

  else if (msg.body !== null && msg.body === "8") {
    msg.reply("😁 Hello, how are you doing?\n\nThis is an automated response and is not monitored by a human. If you would like to speak with a representative, please choose option 4.\r\n\r\nChoose one of the options below to start our conversation:\r\n\r\n*[ 9 ]* - I want to secure my spot in the ZDG Community.\r\n*[ 10 ]* - What will I receive by joining the ZDG group?\r\n*[ 11 ]* - What technologies and tools will I learn in the ZDG Community?\r\n*[ 12 ]* - I would like to speak with Pedrinho, but thank you for trying to help me.\r\n*[ 13 ]* - I want to learn how to create my API for FREE.\r\n*[ 14 ]* - I want to know the entire syllabus of the ZDG Community.\r\n*[ 15 ]* - I would like to see some case studies.\r\n*[ 0 ]* - Em *PORTUGUÊS*, por favor!\r\n*[ 16 ]* - En ESPAÑOL, por favor.");
  }
  
  else if (msg.body !== null && msg.body === "9") {
    msg.reply("In the ZDG Community, you will integrate APIs, automate with chatbots, and implement multi-user support systems for WhatsApp. With ready-to-use scripts and daily support in the student group.\n\nhttps://comunidadezdg.com.br/\n\n⏱️ Registrations are OPEN\n\nWatch the video below and understand why so many ordinary people are saving time and making money by exploring the WPP API, even without knowing anything about programming.\n\n📺 https://www.youtube.com/watch?v=AoRhC_X6p5w");
  } 
  
  else if (msg.body !== null && msg.body === "10") {
    msg.reply("In the ZDG Community, you will:\n\n- Use tested codes to automate your customer service with WhatsApp chatbots\n- Create applications for CRM management and multi-user platforms for support chats\n- Learn integrations with tools and APIs that have been tested and approved by the community\n- Curate free plugins and tools to boost conversational marketing in your business\n- Connect with over 2,000 students who are also studying and implementing conversational marketing solutions\n- Aligned student groups organized by topics\n- Have access to my personal support every day.");
  }
  
  else if (msg.body !== null && msg.body === "11") {
    msg.reply("These are the main APIs that ZDG will teach you to use with WhatsApp:\nBaileys, Venom-BOT, WPPConnect, WPPWeb-JS, and Cloud API (Official API)\n\nThese are the main integrations that ZDG will teach you to do with WhatsApp:\nBubble, WordPress (WooCommerce and Elementor), Botpress, N8N, DialogFlow, ChatWoot, and platforms like Hotmart, Edduz, Monetizze, Rd Station, Mautic, Google Sheets, Active Campaign, among others.");
  }
  
  else if (msg.body !== null && msg.body === "12") {

        const contact = await msg.getContact();
        setTimeout(function() {
            msg.reply(`@${contact.number}` + ' your contact has already been forwarded to Pedrinho');  
            client.sendMessage('5515998566622@c.us','Contato ZDG - EN. https://wa.me/' + `${contact.number}`);
	    //client.sendMessage('5515998566622@c.us',`${contact.number}`);
          },1000 + Math.floor(Math.random() * 1000));
  
  }
  
  else if (msg.body !== null && msg.body === "12") {
    msg.reply("Your contact has already been forwarded to Pedrinho");
  }
  
  else if (msg.body !== null && msg.body === "13") {
    msg.reply("Enjoy the content and learn in a few minutes how to put your WPP API online, for free:\r\n\r\n🎥 https://youtu.be/sF9uJqVfWpg");
  }
  
  else if (msg.body !== null && msg.body === "15") {
    msg.reply("Great, I'll send you some success stories:\n\n📺 https://youtu.be/KHGchIAZ5i0\nGustavo: The cheapest, most efficient, and completely scalable strategy.\n\n📺 https://youtu.be/S4Cwrnn_Llk\nNatália: We increased our revenue and sold to more clients with the ZDG strategy.\n\n📺 https://youtu.be/XP2ns7TOdIQnYuri: The tool helped me a lot with automating my online store.\n\n📺 https://youtu.be/KBedG3TcBRw\nFrancisco: Pedrinho takes our hand. If I succeeded, you can too.\n\n📺 https://youtu.be/L7dEoEwqv-0\nBruno: The ZDG Community and Pedrinho`s support are incredible. After I acquired the course, I stopped spending $300.00 every month on other automations.\n\n📺 https://youtu.be/StRiSLS5ckg\nRodrigo: I`m a systems developer, and I`ve been using Pedrinho`s solutions to integrate into my systems, and the time savings are exceptional.\n\n📺 https://youtu.be/sAJUDsUHZOw\nDarley: The ZDG Community democratized the use of WPP APIs.\n\n📺 https://youtu.be/S4Cwrnn_Llk\nNatália: We increased our revenue and sold to more clients with the ZDG strategy.\n\n📺 https://youtu.be/crO8iS4R-UU\nAndré: Pedrinho shares a lot of information in the ZDG Community.\n\n📺 https://youtu.be/LDHFX32AuN0\nEdson: The return I have in my work with Pedrinho`s information made my investment free.\n\n📺 https://youtu.be/F3YahjtE7q8\nDaniel: Very high-quality content. Thank you, Professor Pedrinho.\n\n📺 https://youtu.be/YtRpGgZKjWI\nMarcelo: I have a digital agency, and with Pedrinho`s course, we created a new product and are already selling it.\n\n📺 https://youtu.be/0DlOJCg_Eso\nKleber: Pedrinho has excellent didactics, and with his course, I managed to get my API running 24 hours a day, and I`m making sales every day.\n\n📺 https://youtu.be/rsbUJrPqJeA\nMárcio: Before acquiring it, I had little knowledge, but I learned a lot about APIs with Pedrinho and the community.\n\n📺 https://youtu.be/YvlNd-dM9oo\nZé: Pedrinho has liberating content. It was the best investment I made. Unreal content.\n\n📺 https://www.youtube.com/watch?v=mHqEQp94CiE\nLéo: We integrated the ZDG Method into our launches and optimized our results.\n\n📺 https://youtu.be/pu6PpNRJyoM\nRenato: ZDG is a method that will allow you to increase your revenue by at least 30%.\n📺 https://www.youtube.com/watch?v=08wzrPorZcI\n\nGabi: I implemented the strategy without knowing anything about programming.\n📺 https://youtu.be/10cR-c5rOKE\n\nDouglas: After implementing Pedrinho`s solutions, I had a 30% increase in my revenue, not to mention that everyone helps each other in the ZDG community.\n📺 https://youtu.be/kFPhpl5uyyU\n\nDanielle: Without a doubt, meeting Pedrinho and his content was the best thing that happened to me.\n📺 https://youtu.be/3TCPRstg5M0\n\nCalebe: The Zap das Galáxias system was fundamental in the development and execution of my business strategies.\n📺 https://youtu.be/XfA8VZck5S0\n\nArtur: The community`s solutions helped me a lot in increasing my sales and interacting with my customers automatically. The support is incredible.\n📺 https://youtu.be/4M-P3gn9iqU\n\nSamuel: The ZDG Community has a lot of cool content that you can use in your day-to-day professional life. After learning the method, I never had any blockages again.");
  }

  else if (msg.body !== null && msg.body === "16") {
    msg.reply("😁 Hola, ¿cómo estás? ¿Cómo te va? Esta es una atención automática y no es supervisada por un humano. Si desea hablar con un representante, elija la opción 4.\r\n\r\nElija una de las opciones a continuación para comenzar nuestra conversación:\r\n\r\n*[ 17 ]* - Quiero asegurar mi lugar en la Comunidad ZDG.\r\n*[ 18 ]* - ¿Qué recibiré al unirme al grupo ZDG?\r\n*[ 19 ]* - ¿Qué tecnologías y herramientas aprenderé en la Comunidad ZDG?\r\n*[ 20 ]* - Me gustaría hablar con Pedrinho, pero gracias por intentar ayudarme.\r\n*[ 21 ]* - Quiero aprender cómo crear mi API GRATIS.\r\n*[ 22 ]* - Quiero conocer el programa completo de la Comunidad ZDG.\r\n*[ 23 ]* - Me gustaría conocer algunos casos de estudio.\r\n*[ 0 ]* - Em *PORTUGUÊS*, por favor!\r\n*[ 8 ]* - In English, please!");
  }
  
  else if (msg.body !== null && msg.body === "17") {
    msg.reply("En la *Comunidad ZDG*, podrás integrar APIs, automatizar con chatbots y sistemas de atención multiusuario para WhatsApp. Con *scripts para copiar y pegar y soporte diario en el grupo de estudiantes*.\n\nhttps://comunidadezdg.com.br/\n\n*⏱️ Las inscripciones están ABIERTAS*\n\nMira el video a continuación y comprende por qué tanta gente común está ahorrando tiempo y ganando dinero explorando la API de WPP, incluso sin saber nada de programación.\n\n📺 https://www.youtube.com/watch?v=AoRhC_X6p5w");
  } 
  
  else if (msg.body !== null && msg.body === "18") {
    msg.reply("En la Comunidad ZDG, vas a poder:\n\n- Utilizar códigos ya probados para automatizar tu atención con chatbots en WhatsApp.\nCrear aplicaciones para la gestión de CRM y plataformas multiusuario para chats de atención.\nAprender integraciones con herramientas y APIs que han sido probadas y aprobadas por la comunidad.\nCuración de plugins y herramientas gratuitas para impulsar el marketing de conversación en tu negocio.\nConectarte con más de 2.000 estudiantes que también están estudiando e implementando soluciones de marketing de conversación.\nGrupo de estudiantes organizado por temas.\nTener acceso a mi soporte personal todos los días.");
  }
  
  else if (msg.body !== null && msg.body === "19") {
    msg.reply("*" + nomeContato + "*, " + "* estas son las principales APIs que ZDG te enseñará a usar con WhatsApp:*\nBaileys, Venom-BOT, WPPConnect, WPPWeb-JS y Cloud API (API Oficial)\n\n*Estas son las principales integraciones que ZDG te enseñará a hacer con WhatsApp:*\nBubble, WordPress (WooCommerce y Elementor), Botpress, N8N, DialogFlow, ChatWoot y plataformas como Hotmart, Edduz, Monetizze, Rd Station, Mautic, Google Sheets, Active Campaign, entre otras.");
  }
  
  else if (msg.body !== null && msg.body === "20") {
        const contact = await msg.getContact();
        setTimeout(function() {
            msg.reply(`@${contact.number}` + ' su contacto ya ha sido reenviado a Pedrinho');  
            client.sendMessage('5515998566622@c.us','Contato ZDG - ES. https://wa.me/' + `${contact.number}`);
	    //client.sendMessage('5515998566622@c.us',`${contact.number}`);
          },1000 + Math.floor(Math.random() * 1000));
  }
  
  else if (msg.body !== null && msg.body === "20") {
    msg.reply("Su contacto ya ha sido reenviado a Pedrinho");
  }
  
  else if (msg.body !== null && msg.body === "21") {
    msg.reply("Disfruta del contenido y aprende en unos minutos cómo poner en línea tu API de WPP, gratis:\r\n\r\n🎥 https://youtu.be/sF9uJqVfWpg");
  }

  else if (msg.body !== null && msg.body === "23") {
    msg.reply(", genial, te enviaré algunos casos de éxito:\n\n📺 https://youtu.be/KHGchIAZ5i0\nGustavo: La estrategia más económica, eficiente y completamente escalable.\n\n📺 https://youtu.be/S4Cwrnn_Llk\nNatália: Aumentamos nuestros ingresos y vendemos a más clientes con la estrategia ZDG.\n\n📺 https://youtu.be/XP2ns7TOdIQ\nYuri: La herramienta me ha ayudado mucho con las automatizaciones de mi tienda en línea.\n\n📺 https://youtu.be/KBedG3TcBRw\nFrancisco: Pedrinho nos guía. Si yo pude lograrlo, tú también puedes.\n\n📺 https://youtu.be/L7dEoEwqv-0\nBruno: La Comunidad ZDG y el soporte de Pedrinho son increíbles. Después de adquirir el curso, dejé de gastar R$300,00 al mes en otras automatizaciones.\n\n📺 https://youtu.be/StRiSLS5ckg\nRodrigo: Soy desarrollador de sistemas y he estado utilizando las soluciones de Pedrinho para integrarlas en mis sistemas, y el ahorro de tiempo es excepcional.\n\n📺 https://youtu.be/sAJUDsUHZOw\nDarley: La Comunidad ZDG ha democratizado el uso de las APIs de WPP.\n\n📺 https://youtu.be/S4Cwrnn_Llk\nNatália: Aumentamos nuestros ingresos y vendemos a más clientes con la estrategia ZDG.\n\n📺 https://youtu.be/crO8iS4R-UU\nAndré: Pedrinho comparte mucha información en la Comunidad ZDG.\n\n📺 https://youtu.be/LDHFX32AuN0\nEdson: El retorno que obtengo en mi trabajo con la información de Pedrinho ha hecho que mi inversión sea gratuita.\n\n📺 https://youtu.be/F3YahjtE7q8\nDaniel: Contenido de gran calidad. Gracias, profesor Pedrinho.\n\n📺 https://youtu.be/YtRpGgZKjWI\nMarcelo: Tengo una agencia digital y con el curso de Pedrinho creamos un nuevo producto y ya lo estamos vendiendo.\n\n📺 https://youtu.be/0DlOJCg_Eso\nKleber: Pedrinho tiene una excelente didáctica y con su curso logré que mi API funcione las 24 horas y estoy generando ventas todos los días.\n\n📺 https://youtu.be/rsbUJrPqJeA\nMárcio: Antes de adquirirlo, tenía poco conocimiento, pero aprendí mucho sobre API con Pedrinho y la comunidad.\n\n📺 https://youtu.be/YvlNd-dM9oo\nZé: Pedrinho tiene un contenido liberador. Fue la mejor inversión que hice. Contenido surrealista.\n\n📺 https://www.youtube.com/watch?v=mHqEQp94CiE\nLéo: Hemos acoplado el Método ZDG a nuestros lanzamientos y hemos optimizado nuestros resultados.\n\n📺 https://youtu.be/pu6PpNRJyoM\nRenato: ZDG es un método que te permitirá aumentar tus ingresos en al menos un 30%.\n\n📺 https://www.youtube.com/watch?v=08wzrPorZcI\nGabi: Implementé la estrategia sin saber nada de programación.\n\n📺 https://youtu.be/10cR-c5rOKE\nDouglas: Después de implementar las soluciones de Pedrinho, aumenté mis ingresos en un 30%, sin mencionar que en la comunidad ZDG todos se ayudan mutuamente.\n\n📺 https://youtu.be/kFPhpl5uyyU\nDanielle: Sin lugar a dudas, conocer a Pedrinho y su contenido fue lo mejor que me pasó.\n\n📺 https://youtu.be/3TCPRstg5M0\nCalebe: El sistema Zap das Galáxias fue fundamental en el desarrollo y ejecución de las estrategias de mi negocio.\n\n📺 https://youtu.be/XfA8VZck5S0\nArtur: Las soluciones de la comunidad me han ayudado mucho a aumentar mis ventas y a interactuar automáticamente con mis clientes. El soporte es increíble.\n\n📺 https://youtu.be/4M-P3gn9iqU\nSamuel: La Comunidad ZDG tiene mucho contenido interesante que se puede utilizar en el día a día y en el ámbito profesional. Después de aprender el método, nunca más tuve bloqueos.");
  }

  else if (msg.body !== null && msg.body === "6"){
    const indice = MessageMedia.fromFilePath('./indice.pdf');
    client.sendMessage(msg.from, indice, {caption: 'Comunidade ZDG 2.0'});
    delay(4500).then(async function() {
      msg.reply("👨‍🏫 INFORMAÇÃO BÁSICA SOBRE APIs\r\n👨‍🏫 INFORMAÇÃO BÁSICA SOBRE APIs\r\n\r\n🚀 MÓDULO #00 - ZDG APLICADA A LANÇAMENTOS\r\n👨‍🏫 GRUPO DE ALUNOS NO TELEGRAM\r\n🎁 MENTORIA INDIVIDUAL - AGUARDA PARA LIBERAÇÃO DA SUA AGENDA\r\n🚀 0.0 - ZDG aplicada ao seu lançamento\r\n🚀 0.1 - Instalando sua API no Contabo\r\n🚀 0.1b - Disponibilizando múltiplos serviços da sua API na Contabo\r\n🚀 0.2 - Instalação do BOT Gestor de Grupos\r\n🚀 0.3a - Instalação do Multi-Disparador\r\n🚀 0.3b - Instalação do Disparador de Áudio Gravado\r\n🚀 0.4 - Notificação automática para o seu lançamento (WebHooks)\r\n🚀 0.5 - 📌 Atualização dia 21/10/21 - DOWNLOAD do DISPARADOR Oficial da ZDG e Extrator de Contatos\r\n🚀 0.6 - BOT Gestor de Grupos + Telegram\r\n🚀 0.7 - 📌 Atualização de Segurança 13/09/2021 - BOT Gestor de Grupos\r\n🚀 0.8 - Modelo de mensagens individuais para lançamentos\r\n\r\n🚀 MÓDULO #01 - INTRODUÇÃO A ZDG\r\n⚠️ Leia atentamente essa instrução antes de iniciar os seus estudos\r\n🚀 1.0 - Quem sou eu? E a LGPD?\r\n🚀 1.1 - Introdução a ZDG\r\n\r\n🚀 MÓDULO #02 - DEFININDO A OPERADORA E O APP ADEQUADO\r\n🚀 2.0 - Escolha da operadora\r\n🚀 2.1 - O aplicativo de WPP indicado\r\n\r\n🚀 MÓDULO #03 - O FORMATO DA LISTA DE CLIENTES\r\n🚀 3.0 - Preparando a lista de leads (clientes)\r\n🚀 3.1 - Sincronizando o Blue com o Google Contatos\r\n\r\n🚀 MÓDULO #04 - SOFTWARES, EXTENSÕES E CHIPS\r\n🚀 4.0 - Softwares e extensões\r\n🚀 4.1 - Fundamento do BAN e estruturas complexas de disparo\r\n🚀 4.2 - Chip de disparo vs Chip de atendimento\r\n\r\n🚀 MÓDULO #05 - DISPAROS NA PRÁTICA\r\n🚀 5.0 - Disparos na prática\r\n🚀 5.1 - Disparos na prática\r\n🚀 5.2 - Disparos na prática\r\n🚀 5.3 - Disparos na prática\r\n🚀 5.4 - Disparos na prática\r\n🚀 5.5 - Disparos na prática\r\n🚀 5.6 - Disparos na prática\r\n🚀 5.7 - Disparos na prática\r\n🚀 5.8 - Disparos na prática\r\n🚀 5.9 - A Teoria dos Blocos\r\n🚀 6.0 - Mensagem inicial\r\n🚀 7.0 - Tratamento dos dados no excel\r\n🚀 8.0 - Gerando renda extra com a ZDG\r\n🚀 9.0 - Calculadora de Chips\r\n🚀 10.0 - Acelere o seu processo\r\n🚀 11.0 - Como formatar o conteúdo ideal para o Zap\r\n🚀 12.0 - Manual de Disparo de Campanha\r\n🚀 13.0 - Manual Anti-SPAM\r\n🚀 14.0 - Compreendendo a criptografia e algoritmo do WPP\r\n🚀 15.0 - Planilha com o cronograma de envio de disparo\r\n\r\n🛸 BÔNUS GRUPOS\r\n🛸 16.0 - Clientes ocultos e números virtuais\r\n🛸 17.0 - GRUPOS de WPP - REDIRECIONAMENTO AUTOMÁTICO de GRAÇA!\r\n🛸 17.1 - GRUPOS de WPP - Aprenda como exportar todos os contatos dos seus grupos de WPP em uma planilha no Excel\r\n🛸 17.2 - GRUPOS de WPP - Aprenda como extrair as informações do GRUPO com requisições POST\r\n\r\n🤖 BÔNUS CHATBOT\r\n🤖 18.0 - BOT Gestor de Grupos\r\n🤖 19.0 - Rede de robôs para envio de mensagens e arquivos através da API do WPP\r\n🤖 20.0 - CHATBOT com perguntas e respostas nativas no JS\r\n🤖 20.1 - CHATBOT dinâmico acessando o banco de dados em tempo real\r\n🤖 20.2 - CHATBOT dinâmico + CHROME\r\n🤖 21.1 - Chatbot + DialogFlow (Instalação até configuração de respostas de texto)\r\n🤖 21.2 - Chatbot + DialogFlow (Respondendo as intents de texto e áudio pelo WPP)\r\n🤖 22.0 - Previsão do Tempo com o DialogFlow\r\n🤖 23.0 - GAME para WPP\r\n🤖 24.0 - Múltiplos atendentes - 1 número, vários usuários\r\n🤖 24.1 - Múltiplos atendentes - 1 número, vários usuários WINDOWS\r\n🤖 24.2 - Múltiplos atendentes - 1 número, vários usuários CONTABO\r\n🤖 24.3 - Múltiplos atendentes - 1 número, vários usuários + Disparo automática\r\n🤖 24.4 - Múltiplos atendentes - 1 número, vários usuários + Grupos + DialogFlow\r\n🤖 24.5 - Múltiplos atendentes - 1 número, vários usuários + Histórico\r\n🤖 24.6 - Múltiplos atendentes - 1 número, vários usuários + SUB e FTP\r\n🤖 24.7 - Múltiplos atendentes - 1 número, vários usuários + Customização do Front AWS\r\n🤖 24.8 - Múltiplos atendentes - 1 número, vários usuários + Customização do Front CONTABO\r\n🤖 24.9 - Múltiplos atendentes - 1 número, vários usuários + MD\r\n🤖 24.10 - Múltiplos atendentes - 1 número, vários usuários + SMS + Ligação Telefônica\r\n🤖 24.11 - Múltiplos atendentes - 1 número, vários usuários + Múltiplas instâncias na mesma VPS\r\n🤖 24.12 - Múltiplos atendentes - 1 número, vários usuários + Múltiplas instâncias Localhost\r\n🤖 24.13 - Múltiplos atendentes - 1 número, vários usuários + Direct + Disparo de Mídias\r\n🤖 24.14 - Múltiplos atendentes - 1 número, vários usuários + REPO OFICIAL NO GITHUB\r\n🤖 24.15 - Múltiplos atendentes - 1 número, vários usuários + API Externa\r\n🤖 25.0 - Ligando o seu BOT na nuvem em uma VPS (Virtual Private Server)\r\n🤖 26.0 - Criando o seu BOT ISCA + Manual PDF\r\n🤖 26.1 - Introdução ao SKEdit\r\n🤖 26.2 - Captura automática de leads\r\n🤖 27.0 - Chatbot para Instagram e DialogFlow\r\n🤖 27.1 - Chatbot para Instagram com WPP\r\n🤖 28.0 - Robô gratuito para disparo de mensagem e captura de dados com a API do WPP - WPPConnect POSTGRE\r\n🤖 28.1 - Robô gratuito para disparo de mensagem e captura de dados com a API do WPP - WPPConnect MYSQL\r\n🤖 28.2 - Saiba como integrar a API do WPP WPPConnect com o DialogFlow\r\n🤖 29.0 - Aprenda como integrar a Venom-BOT com o DialogFlow e explore essa API gratuita do WPP\r\n🤖 29.1 - API REST para enviar Listas e Botões no WPP utilizando a VENOM-BOT\r\n🤖 29.2 - Robô para disparo de mensagem e captura de dados com a API do WPP - Venom-BOT MongoDB\r\n🤖 29.3 - Robô para disparo de mensagem e captura de dados com a API do WPP - Venom-BOT MYSQL\r\n🤖 29.4 - Robô para disparo de mensagem e captura de dados com a API do WPP - Venom-BOT POSTGRE\r\n🤖 29.5 - Exporte o QRCode da Venom-BOT e consuma a API do WPP\r\n🤖 29.6 - Crie e gerencie múltiplas instâncias da API do WPP de graça, utilizando a Venom-BOT\r\n🤖 29.7 - Aprenda como integrar a Venom-BOT com o DialogFlow e explorar Listas e Botões com a API do WPP\r\n🤖 29.8 - Robô gratuito para disparo de listas e botões de graça com a API do WPP - Venom-BOT\r\n🤖 29.9 - Com nove ou sem nove? Descubra como configurar sua API de WPP contra a regra do número fantasma\r\n🤖 29.10 - Robô gratuito para realizar ligações telefônicas com a API do WPP - Venom-BOT\r\n🤖 29.11 -Robô gratuito para consultar informações do mercado de criptomoedas na API do WPP - Venom-BOT\r\n🤖 29.12 - Aprenda a validar contatos de WPP em massa com a API do WPP Venom-BOT\r\n🤖 29.13 - Aprenda como criar um CRUD para manipular o MYSQL e consumir via Venom-BOT\r\n\r\n👨‍💻 BÔNUS NOTIFICAÇÕES AUTOMÁTICAS\r\n👨‍💻30.0 - Criando o seu FUNIL DE VENDAS e BOT utilizando PHP + ChatAPI\r\n👨‍💻 30.1 - WPP API de graça + Envio de Mídia + Envio de Texto para Grupos + WEBHOOK para HOTMART\r\n👨‍💻 31.0 - Notificação grátis via WPP API para leads\r\n👨‍💻 31.1 - Criando botões e listas com a API do WPP\r\n👨‍💻 31.2 - Aprenda como enviar arquivos de mídia e gerenciar grupos através da WPP API\r\n👨‍💻 32.0 - Como manter a API ativa sem desconexões usando a conta gratuita da Heroku\r\n👨‍💻 33.0 - WPP API FREE e WooCommerce\r\n👨‍💻 33.1 - WPP API FREE e WooCommerce IMAGENS\r\n👨‍💻 33.2 - Envie listas e botões de graça usando a API do WPP e WooCommerce\r\n👨‍💻 34.0 - Multi instância\r\n👨‍💻 35.0 - Instale a API dentro de uma VPS\r\n👨‍💻 36.0 - CHAT API + Elementor\r\n👨‍💻 37.0 - CHAT-API + Hotmart + Eduzz + Monetizze\r\n👨‍💻 38.0 - Notificar o seu lead capturado no Elementor PRO ou no FORM HTML através do WPP com API Gratuita\r\n👨‍💻 38.1 - Envie listas e botões de graça usando a API do WPP e Elementor\r\n👨‍💻 39.0 - Notificação automática no Bubble através da API do WPP\r\n👨‍💻 40.0 - Envio de arquivos no Bubble através da API do WPP\r\n👨‍💻 40.1 - Saiba como incorporar a API do WPP com o seu aplicativo Bubble\r\n👨‍💻 41.0 - Envio de arquivos no Bubble através da API do Instagram\r\n👨‍💻 42.0 - Notificação automática grátis com API do WPP para clientes RD Station e Active Campaign (CRM)\r\n👨‍💻 43.0 - Bot disparador de mensagens e captura de dados com a API do WPP e Google Planilhas (Sheet)\r\n👨‍💻 44.0 - Introdução a Venom-BOT\r\n👨‍💻 45.0 - Como exportar todas as conversas do WPP em arquivo JSON usando a API do WPP\r\n👨‍💻 46.0 - Game JOKENPO para WPP\r\n👨‍💻 46.1 - Consuma a API da ClickUp direto no WhastApp\r\n👨‍💻 46.2 - Consuma a API do Twitter através do WPP\r\n👨‍💻 47.0 - Aprenda como agendar o envio de mensagens automáticas usando a Api do WPP\r\n👨‍💻 48.0 - API REST de graça para enviar Listas e Botões no WPP\r\n👨‍💻 49.0 - Baileys, uma API leve, rápida e super estável + DialogFlow\r\n👨‍💻 49.1 - Baileys, uma API leve, rápida e super estável + MD\r\n👨‍💻 49.2 - Baileys, uma API leve, rápida e super estável + MD\r\n👨‍💻 49.3 - Saiba como instalar a API do WPP Baileys direto no seu Android (Termux), sem VPS ou PC\r\n👨‍💻 49.4 - Saiba como criar um robô de disparo automático com a Baileys\r\n👨‍💻 49.5 - Explorando as requisições post com a REST API da BAILEYS\r\n👨‍💻 49.6 - Aprenda como criar o Frontend para consumir o QRCode da Baileys\r\n👨‍💻 49.7 - Consumindo os dados do banco MYSQL via Baileys\r\n👨‍💻 50.0 - Aprenda como usar a API do WPP de graça com a nova versão de multi dispositivos (BETA - MD)\r\n👨‍💻 51.0 - Saiba como criar chatbots modernos com Botpress e a API do WPP de graça\r\n👨‍💻 51.1 - Saiba como instalar o Botpress direto na sua VPS e expor o serviço em um subdomínio\r\n👨‍💻 52.0 - Aprenda como enviar SMS através da API do WPP de graça e a Vonage\r\n👨‍💻 53.0 - Controle a API do WPP com a ponta dos seus dedos usando a biblioteca FINGERPOSE\r\n\r\n📰 BÔNUS WORDPRESS\r\n📰 61.0 - Introdução\r\n📰 62.0 - Registro do Domínio\r\n📰 63.0 - Contratação do servidor adequado com menos de R$15,00/Mês\r\n📰 64.0 - Apontando o DNS - Parte 1\r\n📰 64.1 - Ativando o certificado SSL gratuito - Parte 2\r\n📰 65.0 - Instalação e configuração do Wordpress - Parte 1\r\n📰 65.1 - Instalação e configuração do Wordpress - Parte 2\r\n📰 66.1 - Otimização e importação do modelo no Wordpress - Parte 1\r\n📰 66.2 - Otimização e importação do modelo no Wordpress - Parte 2\r\n📰 66.3- Otimização e importação do modelo no Wordpress - Parte 3\r\n📰 67.0 - Ativando o seu e-mail profissional\r\n\r\n🛸 ZDG\r\n🛸 LIVE #01 - Jornada do Lançamento com o WPP\r\n🛸 LIVE #02 - Jornada do Lançamento com o WPP\r\n🛸 LIVE #03 - Jornada do Lançamento com o WPP\r\n🛸 LIVE #04 - Jornada do Lançamento com o WPP\r\n🛸 LIVE #05 - Jornada do Lançamento com o WPP\r\n🛸 Blog de Disparo - Lançamento de produto digital com o Método ZDG\r\n🛸 Blog de Disparo - As queridinhas do 2.0");
		});
	  
  }
	else if (msg.body !== null && msg.body === "14"){
    const indic = MessageMedia.fromFilePath('./indice.pdf');
    client.sendMessage(msg.from, indic, {caption: 'Comunidade ZDG 2.0'});
    delay(4500).then(async function() {
		  msg.reply("👨‍🏫 BASIC INFORMATION ABOUT APIs\r\n👨‍🏫 BASIC INFORMATION ABOUT APIs\r\n\r\n🚀 MODULE #00 - ZDG APPLIED TO RELEASES\r\n👨‍🏫 GROUP OF STUDENTS ON TELEGRAM\r\ n🎁 INDIVIDUAL MENTORING - WAITING FOR THE RELEASE OF YOUR SCHEDULE\r\n🚀 0.0 - ZDG applied to your release\r\n🚀 0.1 - Installing your API in Contabo\r\n🚀 0.1b - Making multiple services of your API available on Contabo\r\n🚀 0.2 - Installing the BOT Group Manager\r\n🚀 0.3a - Installing the Multi-Trigger\r\n🚀 0.3b - Installing the Recorded Audio Trigger\r\n🚀 0.4 - Automatic notification for its release (WebHooks)\r\n🚀 0.5 - 📌 Update on 10/21/21 - DOWNLOAD the Official ZDG TRIGGER and Contact Extractor\r\n🚀 0.6 - BOT Group Manager + Telegram\r\n 🚀 0.7 - 📌 Security Update 09/13/2021 - Group Manager BOT\r\n🚀 0.8 - Single message template for releases\r\n\r\n🚀 MODULE #01 - INTRODUCTION TO ZDG\r\n ⚠️ Read this instruction carefully before starting your studies\r\n🚀 1.0 - Who am I? What about LGPD?\r\n🚀 1.1 - Introduction to ZDG\r\n\r\n🚀 MODULE #02 - DEFINE THE SUITABLE OPERATOR AND APP\r\n🚀 2.0 - Operator choice\r\n🚀 2.1 - The indicated WPP application\r\n\r\n🚀 MODULE #03 - THE CUSTOMER LIST FORMAT\r\n🚀 3.0 - Preparing the list of leads (customers)\r\n🚀 3.1 - Syncing Blue with Google Contacts\r\n\r\n🚀 MODULE #04 - SOFTWARE, EXTENSIONS AND CHIPS\r\n🚀 4.0 - Software and extensions\r\n🚀 4.1 - Basics of BAN and complex trigger structures\r\ n🚀 4.2 - Trigger chip vs Attendance chip\r\n\r\n🚀 MODULE #05 - SHOOTING IN PRACTICE\r\n🚀 5.0 - Shooting in practice\r\n🚀 5.1 - Shooting in practice\r\n🚀 5.2 - Shooting in practice\r\n🚀 5.3 - Shooting in practice\r\n🚀 5.4 - Shooting in practice\r\n🚀 5.5 - Shooting in practice\r\n🚀 5.6 - Shooting in practice\r\n🚀 5.7 - Shooting in practice\r\n🚀 5.8 - Shooting in practice\r\n🚀 5.9 - The Theory of Blocks\r\n🚀 6.0 - Initial message\r\n🚀 7.0 - Data processing in excel\r\n🚀 8.0 - Generating extra income with ZDG\r\n🚀 9.0 - Chip Calculator\ r\n🚀 10.0 - Speed ​​up your process\r\n🚀 11.0 - How to format the ideal content for Zap\r\n🚀 12.0 - Campaign Shooting Manual\r\n🚀 13.0 - Anti-SPAM Manual\r \n🚀 14.0 - Understanding WPP encryption and algorithm\r\n🚀 15.0 - Spreadsheet with the trigger sending schedule\r\n\r\n🛸 BONUS GROUPS\r\n🛸 16.0 - Hidden customers and virtual numbers \r\n🛸 17.0 - WPP GROUPS - FREE AUTOMATIC REDIRECT!\r\n🛸 17.1 - WPP GROUPS - Learn how to export all contacts from your WPP groups and 17.2 - WPP GROUPS - Learn how to extract GROUP information with POST requests\r\n\r\n🤖 CHATBOT BONUS\r\n🤖 18.0 - Group Manager BOT\r \n🤖 19.0 - Network of robots for sending messages and files through the WPP API\r\n🤖 20.0 - CHATBOT with native questions and answers in JS\r\n🤖 20.1 - Dynamic CHATBOT accessing the database in time real\r\n🤖 20.2 - Dynamic CHATBOT + CHROME\r\n🤖 21.1 - Chatbot + DialogFlow (Installation until configuring text responses)\r\n🤖 21.2 - Chatbot + DialogFlow (Responding to text and audio intents via WPP)\r\n🤖 22.0 - Weather Forecast with DialogFlow\r\n🤖 23.0 - GAME for WPP\r\n🤖 24.0 - Multiple attendants - 1 number, multiple users\r\n🤖 24.1 - Multiple attendants - 1 number, multiple users WINDOWS\r\n🤖 24.2 - Multiple attendants - 1 number, multiple users CONTABO\r\n🤖 24.3 - Multiple attendants - 1 number, multiple users + Automatic trigger\r\n🤖 24.4 - Multiple attendants - 1 number, multiple users + Groups + DialogFlow\r\ n🤖 24.5 - Multiple attendants - 1 number, multiple users + History\r\n🤖 24.6 - Multiple attendants - 1 number, multiple users + SUB and FTP\r\n🤖 24.7 - Multiple attendants - 1 number, multiple users + Customization of Front AWS\r\n🤖 24.8 - Multiple attendants - 1 number, multiple users + Front CONTABO Customization\r\n🤖 24.9 - Multiple attendants - 1 number, multiple users + MD\r\n🤖 24.10 - Multiple attendants - 1 number, multiple users + SMS + Phone Call\r\n🤖 24.11 - Multiple attendants - 1 number, multiple users + Multiple instances on the same VPS\r\n🤖 24.12 - Multiple attendants - 1 number, multiple users + Multiple Localhost instances \r\n🤖 24.13 - Multiple attendants - 1 number, multiple users + Direct + Media Shooting\r\n🤖 24.1 4 - Multiple attendants - 1 number, multiple users + OFFICIAL REPO ON GITHUB\r\n🤖 24.15 - Multiple attendants - 1 number, multiple users + External API\r\n🤖 25.0 - Connecting your BOT in the cloud on a VPS ( Virtual Private Server)\r\n🤖 26.0 - Creating your BAIT BOT + PDF Manual\r\n🤖 26.1 - Introduction to SKEdit\r\n🤖 26.2 - Automatic lead capture\r\n🤖 27.0 - Chatbot for Instagram and DialogFlow\r\n🤖 27.1 - Chatbot for Instagram with WPP\r\n🤖 28.0 - Free robot for message triggering and data capture with WPP API - WPPConnect POSTGRE\r\n🤖 28.1 - Free robot for shooting messaging and data capture with WPP API - WPPConnect MYSQL\r\n🤖 28.2 - Learn how to integrate WPPConnect WPP API with DialogFlow\r\n🤖 29.0 - Learn how to integrate Venom-BOT with DialogFlow and explore this free WPP API\r\n🤖 29.1 - REST API to send Lists and Buttons on WPP using VENOM-BOT\r\n🤖 29.2 - Robot for message triggering and data capture with WPP API - Venom-BOT MongoDB\r\n🤖 29.3 - Robot for message triggering and data capture with WPP API - Venom-BOT MYSQL\r\n🤖 29.4 - Robot for message triggering and data capture with WPP API - Venom-BOT POSTGRE\r\n🤖 29.5 - Export the Venom-BOT QRCode and consume WPP API\r\n🤖 29.6 - Create and manage multiple instances of WPP API for free using Venom-BOT\r\n🤖 29.7 - Learn how to integrate Venom-BOT with DialogFlow and explore Lists and Buttons with WPP API\r\n🤖 29.8 - Free robot to shoot lists and buttons for free with WPP API - Venom-BOT\r\n🤖 29.9 - With nine or without nine? Find out how to configure your WPP API against the ghost number rule\r\n🤖 29.10 - Free robot to make phone calls with WPP API - Venom-BOT\r\n🤖 29.11 - Free robot to consult information from the market cryptocurrencies in WPP API - Venom-BOT\r\n🤖 29.12 - Learn to validate WPP contacts in bulk with WPP API Venom-BOT\r\n🤖 29.13 - Learn how to create a CRUD to manipulate MYSQL and consume via Venom-BOT\r\n\r\n👨‍💻 BONUS AUTOMATIC NOTIFICATIONS\r\n👨‍💻30.0 - Creating your SALES FUNNEL and BOT using PHP + ChatAPI\r\n👨‍💻 30.1 - WPP API for free + Media Upload + Text Upload to Groups + WEBHOOK for HOTMART\r\n👨‍💻 31.0 - Free notification via WPP API for leads\r\n👨‍💻 31.1 - Creating buttons and lists with WPP API \r\n👨‍💻 31.2 - Learn how to send media files and manage groups via WPP API\r\n👨‍💻 32.0 - How to keep API active without disconnections using Heroku free account\r\n👨‍ 💻 3 3.0 - WPP API FREE and WooCommerce\r\n👨‍💻 33.1 - WPP API FREE and WooCommerce IMAGES\r\n👨‍💻 33.2 - Send lists and buttons for free using WPP API and WooCommerce\r\n👨‍💻 34.0 - Multi instance\r\n👨‍💻 35.0 - Install the API inside a VPS\r\n👨‍💻 36.0 - CHAT API + Elementor\r\n👨‍💻 37.0 - CHAT-API + Hotmart + Eduzz + Monetizze\r\n👨‍💻 38.0 - Notify your lead captured in Elementor PRO or FORM HTML via WPP with Free API\r\n👨‍💻 38.1 - Send lists and buttons for free using WPP API and Elementor\r\n👨‍💻 39.0 - Automatic notification in Bubble via WPP API\r\n👨‍💻 40.0 - Sending files in Bubble via WPP API\r\n👨‍💻 40.1 - Learn how to embed WPP API with your Bubble app\r\n👨 ‍💻 41.0 - Sending files in Bubble via Instagram API\r\n👨‍💻 42.0 - Free automatic notification with WPP API for RD Station and Active Campaign (CRM) clients\r\n👨‍💻 43.0 - Bot message trigger and data capture with WPP API and Google Sheet s (Sheet)\r\n👨‍💻 44.0 - Introduction to Venom-BOT\r\n👨‍💻 45.0 - How to export all WPP conversations into JSON file using WPP API\r\n👨‍💻 46.0 - Game JOKENPO for WPP\r\n👨‍💻 46.1 - Consume the ClickUp API directly on WPP\r\n👨‍💻 46.2 - Consume the Twitter API via WPP\r\n👨‍💻 47.0 - Learn how schedule automatic messaging using WPP API\r\n👨‍💻 48.0 - Free REST API to send Lists and Buttons on WPP\r\n👨‍💻 49.0 - Baileys, a lightweight, fast and super stable API + DialogFlow\r\n👨‍💻 49.1 - Baileys, a lightweight, fast and super stable API + MD\r\n👨‍💻 49.2 - Baileys, a lightweight, fast and super stable API + MD\r\n👨‍💻 49.3 - Learn how to install WPP API Baileys directly on your Android (Termux), without VPS or PC\r\n👨‍💻 49.4 - Learn how to create an auto-firing robot with Baileys\r\n👨‍💻 49.5 - Exploring post requests with the REST API from BAILEYS\r\n👨‍💻 49.6 - Learn how to create the Frontend to consume Baileys QRCode\r\n👨‍💻 49.7 - Consuming MYSQL database data via Baileys\r\n👨‍💻 50.0 - Learn how use WPP API for free with new multi-device version (BETA - MD)\r\n👨‍💻 51.0 - Learn how to create modern chatbots with Botpress and WPP API for free\r\n👨‍💻 51.1 - Learn how to install Botpress directly on your VPS and expose the service on a subdomain\r\n👨‍💻 52.0 - Learn how to send SMS via WPP API for free and Vonage\r\n👨‍💻 53.0 - Control the WPP API at your fingertips using the FINGERPOSE library\r\n\r\n 📰 BONUS WORDPRESS\r\n📰 61.0 - Introduction\r\n📰 62.0 - Domain Registration\r\n📰 63.0 - Hiring the appropriate server with less than R$15.00/Month\r\n📰 64.0 - Pointing out the DNS - Part 1\r\n📰 64.1 - Enabling Free SSL Certificate - Part 2\r\n📰 65.0 - WordPress Installation and Configuration - Part 1\r\n📰 65.1 - WordPress Installation and Configuration - Part 2\ r\n📰 66.1 - Template Optimization and Import in Wordpress - Part 1\r\n📰 66.2 - Template Optimization and Import in Wordpress - Part 2\r\n📰 66.3- Template Optimization and Import in Wordpress - Part 3\r\n📰 67.0 - Activating your professional email\r\n\r\n🛸 ZDG\r\n🛸 LIVE #01 - Launch Journey with WPP\r\n🛸 LIVE #02 - Launch Journey with WPP\ r\n🛸 LIVE #03 - Launch Journey with WPP\r\n🛸 LIVE #04 - Launch Journey with WPP\r\n🛸 LIVE #05 - Launch Journey with WPP\r\n🛸 Blog Shooting - Launching a digital product with the ZDG Method\r\n🛸 Shooting Blog - As Darlings of 2.0");
    });
	}
    else if (msg.body !== null && msg.body === "22"){
    const index = MessageMedia.fromFilePath('./indice.pdf');
    client.sendMessage(msg.from, index, {caption: 'Comunidade ZDG 2.0'});
    delay(4500).then(async function() {
		  msg.reply("👨‍🏫 INFORMACIÓN BÁSICA SOBRE APIs\r\n👨‍🏫 INFORMACIÓN BÁSICA SOBRE APIs\r\n\r\n🚀 MÓDULO #00 - ZDG APLICADO A LANZAMIENTOS\r\n👨‍🏫 GRUPO DE ALUMNOS EN TELEGRAM\r\ n🎁 MENTORÍA INDIVIDUAL - ESPERANDO EL LANZAMIENTO DE TU HORARIO\r\n🚀 0.0 - ZDG aplicado a tu lanzamiento\r\n🚀 0.1 - Instalando tu API en Contabo\r\n🚀 0.1b - Haciendo múltiples servicios de tu API disponible en Contabo\r\n🚀 0.2 - Instalación de BOT Group Manager\r\n🚀 0.3a - Instalación de Multi-Trigger\r\n🚀 0.3b - Instalación de Recorded Audio Trigger\r\n🚀 0.4 - Notificación automática para su lanzamiento (WebHooks)\r\n🚀 0.5 - 📌 Actualización el 21/10/21 - DESCARGAR ZDG TRIGGER y Extractor de contactos\r\n🚀 0.6 - BOT Group Manager + Telegram\r\n 🚀 0.7 - 📌 Actualización de seguridad 13/09/2021 - Group Manager BOT\r\n🚀 0.8 - Plantilla de mensaje único para lanzamientos\r\n\r\n🚀 MÓDULO n.° 01 - INTRODUCCIÓN A ZDG\r\n ⚠️ Lea atentamente estas instrucciones antes de comenzar tus estudios\r\n🚀 1.0 - ¿Quién soy? ¿Qué pasa con LGPD?\r\n🚀 1.1 - Introducción a ZDG\r\n\r\n🚀 MÓDULO #02 - DEFINE EL OPERADOR Y LA APLICACIÓN ADECUADOS\r\n🚀 2.0 - Elección del operador\r\n🚀 2.1 - El aplicación WPP indicada\r\n\r\n🚀 MÓDULO #03 - EL FORMATO DE LA LISTA DE CLIENTES\r\n🚀 3.0 - Elaboración de la lista de leads (clientes)\r\n🚀 3.1 - Sincronización de Blue con Google Contacts\r\ n\r\n🚀 MÓDULO #04 - SOFTWARE, EXTENSIONES Y CHIPS\r\n🚀 4.0 - Software y extensiones\r\n🚀 4.1 - Conceptos básicos de BAN y estructuras de activación complejas\r\ n🚀 4.2 - Chip de activación vs Asistencia chip\r\n\r\n🚀 MÓDULO #05 - PRÁCTICA DE TIRO\r\n🚀 5.0 - Práctica de tiro\r\n🚀 5.1 - Práctica de tiro\r\ n🚀 5.2 - Práctica de tiro\r\ n🚀 5.3 - Práctica de tiro\r\n🚀 5.4 - Práctica de tiro\r\n🚀 5.5 - Práctica de tiro\r\n🚀 5.6 - Práctica de tiro\r\n🚀 5.7 - Práctica de tiro\r\n🚀 5.8 - Práctica de tiro\r\n🚀 5.9 - La teoría de los bloques\r\ n🚀 6.0 - Mensaje inicial\r\n🚀 7.0 - Procesamiento de datos en excel\r\n🚀 8.0 - Generando ingresos extra con ZDG\r\n🚀 9.0 - Chip Calculator\r\n🚀 10.0 - Acelera tu proceso\ r\n🚀 11.0 - Cómo formatear el contenido ideal para Zap\r\n🚀 12.0 - Manual de tiro de campaña\r\n🚀 13.0 - Manual anti-SPAM\r\n🚀 14.0 - Comprender el cifrado y el algoritmo de WPP\r\ n🚀 15.0 - Hoja de cálculo con el calendario de envío activador\r\n\r\n🛸 GRUPOS DE BONIFICACIÓN\r\n🛸 16.0 - Clientes ocultos y números virtuales\r\n🛸 17.0 - GRUPOS WPP - ¡REDIRECCIÓN AUTOMÁTICA GRATUITA!\r\ n🛸 17.1 - GRUPOS de WPP - Aprende a exportar todos los contactos de tus grupos de WPP a una hoja de cálculo en Excel\r\n🛸 17.2 - GRUPOS de WPP - Aprende a extraer la información del GRUPO con solicitudes POST\r\n\r\n 🤖 CHATBOT ADICIONAL\r\n🤖 18.0 - Administrador de grupo BOT\r \n🤖 19.0 - Red de robots para envío de mensajes y archivos a través de la API de WPP\r\n🤖 20.0 - CHATBOT con preguntas y respuestas nativas en JS\r\n🤖 20.1 - CHATBOT dinámico accediendo a la base de datos en tiempo real\r\ n🤖 20.2 - CHATBOT dinámico + CHROME\r\n🤖 21.1 - Chatbot + DialogFlow (Instalación hasta configurar respuestas de texto)\r\n🤖 21.2 - Chatbot + DialogFlow (Respondiendo a intentos de texto y audio a través de WPP)\r\n🤖 22.0 - Pronóstico del tiempo con DialogFlow\r\n🤖 23.0 - JUEGO para WPP\r\n🤖 24.0 - Múltiples asistentes - 1 número, múltiples usuarios\r\n🤖 24.1 - Múltiples asistentes - 1 número, múltiples usuarios WINDOWS\r\ nº 24.2- Múltiples asistentes - 1 número, múltiples usuarios CONTABO\r\n🤖 24.3 - Múltiples asistentes - 1 número, múltiples usuarios + Disparador automático\r\n🤖 24.4 - Múltiples asistentes - 1 número, múltiples usuarios + Grupos + DialogFlow\r\ n🤖 24.5 - Múltiples asistentes - 1 número, múltiples usuarios + Historial\r\n🤖 24.6 - Múltiples asistentes - 1 número, múltiples usuarios + SUB y FTP\r\n🤖 24.7 - Múltiples asistentes - 1 número, múltiples usuarios + Personalización de Front AWS\r\n🤖 24.8 - Múltiples asistentes - 1 número, múltiples usuarios + Front CONTABO Personalización\r\n🤖 24.9 - Múltiples asistentes - 1 número, múltiples usuarios + MD\r\n🤖 24.10 - Múltiples asistentes - 1 número, múltiples usuarios + SMS + Llamada telefónica\r\n🤖 24.11 - Múltiples asistentes - 1 número, múltiples usuarios + Múltiples instancias en el mismo VPS\r\n🤖 24.12 - Múltiples asistentes - 1 número, múltiples usuarios + Múltiples instancias de Localhost \r\n🤖 24.13 - Múltiples asistentes - 1 número, múltiples usuarios + Directo + Grabación multimedia\r\n🤖 24.1 4 - Múltiples asistentes - 1 número, múltiples usuarios + REPO OFICIAL EN GITHUB\r\n🤖 24.15 - Múltiples asistentes - 1 número, múltiples usuarios + API externa\r\n🤖 25.0 - Conexión de su BOT en la nube en un VPS ( Servidor Privado Virtual)\r\n🤖 26.0 - Creación de su ISCA BOT + Manual en PDF\r\n🤖 26.1 - Introducción a SKEdit\r\n🤖 26.2 - Captura automática de prospectos\r\n🤖 27.0 - Chatbot para Instagram y DialogFlow\r\n🤖 27.1 - Chatbot para Instagram con WPP\r\n🤖 28.0 - Robot gratuito para activación de mensajes y captura de datos con WPP API - WPPConnect POSTGRE\r\n🤖 28.1 - Mensaje gratuito robot de activación y captura de datos con API de WPP - WPPConnect MYSQL\r\n🤖 28.2 - Aprende a integrar WPPConnect API de WPP con DialogFlow\r\n🤖 29.0 - Aprende a integrar Venom -BOT con DialogFlow y explora esta API gratuita de WPP\ r\n🤖 29.1 - API REST para enviar Listas y Botones en WPP usando VENOM-BOT\r\n🤖 29.2 - Robot para activación de mensajes y captura de datos con la API de WPP - Venom-BOT MongoDB\r\n🤖 29.3 - Mensaje activación y captura de datos del robot con la API de WPP - Venom-BOT MYSQL\r\n🤖 29.4 - Activación de mensajes y captura de datos del robot con la API de WPP - Venom-BOT POSTGRE\r\n🤖 29.5 - Exportación de Venom-BOT QRCode y consumo de la API de WPP \r\n🤖 29.6 - Crear y administrar múltiples ins Instancias de API de WPP gratis usando Venom-BOT\r\n🤖 29.7 - Aprende a integrar Venom-BOT con DialogFlow y explora listas y botones con WPP API\r\n🤖 29.8 - Robot gratuito para disparar listas y botones gratis con API de WPP - Venom-BOT\r\n🤖 29.9 - ¿Con nueve o sin nueve? Descubre cómo configurar tu API de WPP contra la regla del número fantasma\r\n🤖 29.10 - Robot gratuito para realizar llamadas telefónicas con la API de WPP - Venom-BOT\r\n🤖 29.11 - Robot gratuito para consultar información del mercado de criptomonedas en API de WPP - Venom-BOT\r\n🤖 29.12 - Aprende a validar contactos de WPP de forma masiva con WPP API Venom-BOT\r\n🤖 29.13 - Aprende a crear un CRUD para manipular MYSQL y consumir a través de Venom-BOT\r \n\r\n👨‍💻 NOTIFICACIONES AUTOMÁTICAS ADICIONALES\r\n👨‍💻30.0 - Creación de su EMBUDO DE VENTAS y BOT usando PHP + ChatAPI\r\n👨‍💻 30.1 - API de WPP gratis + Carga de medios + Carga de texto a grupos + WEBHOOK a HOTMART\r\n👨‍ 💻 31.0 - Gratis notificación a través de la API de WPP para clientes potenciales\r\n👨‍💻 31.1 - Crear botones y listas con la API de WPP\r\n👨‍💻 31.2 - Aprende a enviar archivos multimedia y administrar grupos a través de la API de WPP\r\n👨‍💻 32.0 - Cómo mantener activa la API sin desconexiones usando la cuenta gratuita de Heroku\r\n👨‍💻 33.0 - API de WPP GRATIS y WooCommerce\r\n👨‍💻 33.1 - API de WPP GRATIS e IMÁGENES de WooCommerce\r\n👨‍💻 33.2 - Envía listas y botones gratis usando WPP y WooCommerce API\r\n👨‍💻 34.0 - Múltiples instancias\r\n👨‍💻 35.0 - Instalar API dentro de un VPS \r\n👨‍💻 36.0 - CHAT API + Elementor \r\n👨‍💻 37.0 - CHAT-API + Hotmart + Eduzz + Monetizze\r\n👨‍💻 38.0 - Notifica a tu cliente potencial capturado en Elementor PRO o HTML FORM a través de WPP con API gratuita\r\n👨‍💻 38.1 - Envía listas y botones gratis usando API y Elementor\r\n👨‍💻 39.0 - Notificación automática en Bubble a través de la API de WPP\r\n👨‍💻 40.0 - Envío de archivos en Bubble a través de la API de WPP\r\n👨‍💻 40.1 - Aprenda a incrustar la API de WPP con tu aplicación Bubble\r\n👨‍💻 41.0 - Envío de archivos en Bubble a través de la API de Instagram\r\n👨‍💻 42.0 - Notificación automática gratuita con WPP API para clientes de RD Station y Active Campaign (CRM)\r\n👨‍ 💻 43.0 - Bot de activación de mensajes y captura de datos con la API de WPP y Google Sheets (Sheet)\r\n👨‍💻 44.0 - Introducción a Venom-BOT\ r\n👨‍💻 45.0 - Cómo exportar todas las conversaciones de WPP en un archivo JSON usando la API de WPP\r\n👨‍💻 46.0 - Juego JOKENPO para WPP\r\n👨‍💻 46.1 - Consumir la API ClickUp directamente en WPP\r\n👨‍💻 46.2 - Consumir la API de Twitter a través de WPP\r\n 👨‍💻 47.0 - Aprende a programar mensajes automáticos usando la API de WPP\r\n👨‍💻 48.0 - API REST gratuita para enviar listas y botones en WPP\r\n👨‍💻 49.0 - Baileys, una API liviana, rápida y súper estable + DialogFlow\r\n👨‍💻 49.1 - Baileys, una API liviana, rápida y súper estable + MD\r\n👨‍💻 49.2 - Baileys, una API liviana, rápida y súper estable + MD\r\n👨‍💻 49.3 - Aprende a instalar Baileys WPP API directamente en tu Android (Termux), sin VPS ni PC\r\n👨‍💻 49.4 - Aprende a crear un robot de disparo automático con Baileys\r\n👨‍💻 49.5 - Explora las solicitudes de publicación con BAILEYS REST API\r\n👨‍💻 49.6 - Aprende a crear Frontend para consumir Baileys QRCode\r\n👨‍💻 49.7 - Consumir datos de la base de datos MYSQL a través de Baileys\r\n👨‍💻 50.0 - Aprende a usar la API de WPP de forma gratuita con la nueva versión multidispositivo (BETA - MD)\ r\n👨‍💻 51.0 - Aprenda a crear chatbots modernos con Botpress y la API de WPP de forma gratuita\r\n👨‍💻 51.1 - Aprenda a instalar Botpress directamente en su VPS y exponga el servicio en un subdominio\r\ n👨‍💻 52.0 - Aprende a enviar SMS a través de API de WPP gratis y Vonage\r\n👨‍💻 53.0 - Controla la API de WPP con la punta de tus dedos usando la biblioteca FINGERPOSE\r\n\r\n📰 BONUS WORDPRESS\r\n📰 61.0 - Introducción\r\n📰 62.0 - Registro de Dominio\r\n📰 63,0 - Contratación del servidor adecuado con menos de R$ 15,00/Mes\r\n📰 64,0 - Apuntando DNS - Parte 1\r\n📰 64,1 - Habilitación del certificado SSL gratuito - Parte 2\r\ n📰 65.0 - Instalación y configuración de Wordpress - Parte 1\r\n📰 65.1 - Instalación y configuración de Wordpress - Parte 2\r\n📰 66.1 - Optimización e importación de la plantilla en Wordpress - Parte 1\r \n📰 66.2 - Optimización e importación de la plantilla en Wordpress - Parte 2\r\n📰 66.3- Optimización e importación de la plantilla en Wordpress - Parte 3\r\n📰 67.0 - Habilitación de su correo electrónico profesional\r\n \r\n🛸 ZDG \r\n🛸 EN VIVO n.° 01: viaje de lanzamiento con WPP\r\n🛸 EN VIVO n.° 02: viaje de lanzamiento con WPP\r\n🛸 EN VIVO n.° 03: viaje de lanzamiento con WPP\r\n🛸 EN VIVO n.º 04: viaje de lanzamiento con WPP\r\n🛸 LIVE #05 - Launch Journey con WPP\r\n🛸 Shooting Blog - Lanzamiento de producto digital con el método ZDG\r \n🛸 Shooting Blog - Los mimados de 2.0");
    });
	}
	 else if (msg.body !== null || msg.body === "0" || msg.type === 'ptt' || msg.hasMedia) {
    msg.reply("*COMUNIDADE ZDG*\n\n🤪 _Usar o WPP de maneira manual é prejudicial a saúde_\r\n\r\nhttps://comunidadezdg.com.br/ \r\n\r\n⏱️ As inscrições estão *ABERTAS*");
    const foto = MessageMedia.fromFilePath('./foto.jpeg');
    client.sendMessage(msg.from, foto)
    delay(3000).then(async function() {
      try{
        const media = MessageMedia.fromFilePath('./comunidade.ogg');
        client.sendMessage(msg.from, media, {sendAudioAsVoice: true})
        //msg.reply(media, {sendAudioAsVoice: true});
      } catch(e){
        console.log('audio off')
      }
		});
    delay(8000).then(async function() {
      const saudacaoes = ['Olá ' + nomeContato + ', tudo bem?', 'Oi ' + nomeContato + ', como vai você?', 'Opa ' + nomeContato + ', tudo certo?'];
      const saudacao = saudacaoes[Math.floor(Math.random() * saudacaoes.length)];
      msg.reply(saudacao + " Esse é um atendimento automático, e não é monitorado por um humano. Caso queira falar com um atendente, escolha a opção 4. \r\n\r\nEscolha uma das opções abaixo para iniciarmos a nossa conversa: \r\n\r\n*[ 1 ]* - Quero garantir minha vaga na Comunidade ZDG. \r\n*[ 2 ]* - O que vou receber entrando para a turma da ZDG? \r\n*[ 3 ]*- Quais tecnologias e ferramentas eu vou aprender na comunidade ZDG? \r\n*[ 4 ]- Gostaria de falar com o Pedrinho, mas obrigado por tentar me ajudar.* \r\n*[ 5 ]*- Quero aprender como montar minha API de GRAÇA.\r\n*[ 6 ]*- Quero conhecer todo o conteúdo programático da Comunidade ZDG.\r\n*[ 7 ]*- Gostaria de conhecer alguns estudos de caso.  \r\n*[ 8 ]*- In *ENGLISH* please! \r\n*[ 16 ]*- En *ESPAÑOL* por favor.");
		});
    
	}
});

console.log("\nA Comunidade ZDG é a oportunidade perfeita para você aprender a criar soluções incríveis usando as APIs, sem precisar de experiência prévia com programação. Com conteúdo exclusivo e atualizado, você terá tudo o que precisa para criar robôs, sistemas de atendimento e automações do zero. O curso é projetado para iniciantes e avançados, e oferece um aprendizado prático e passo a passo para que você possa criar soluções incríveis.")
console.log("\nIncreva-se agora acessando link: comunidadezdg.com.br\n")
    
server.listen(port, function() {
        console.log('Aplicação rodando na porta *: ' + port + ' . Acesse no link: http://localhost:' + port);
});
