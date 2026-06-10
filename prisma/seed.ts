import { db } from '../src/lib/db';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.comment.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.album.deleteMany();

  // Create albums
  const paesaggi = await prisma.album.create({
    data: {
      name: 'Paesaggi',
      description: 'Paesaggi italiani mozzafiato, dai laghi alle montagne',
      cover: '/uploads/photo1.jpg',
    },
  });

  const ritratti = await prisma.album.create({
    data: {
      name: 'Ritratti',
      description: 'Ritratti artistici e fotografici',
      cover: '/uploads/photo2.jpg',
    },
  });

  const natura = await prisma.album.create({
    data: {
      name: 'Natura',
      description: 'La bellezza della natura italiana',
      cover: '/uploads/photo3.jpg',
    },
  });

  const citta = await prisma.album.create({
    data: {
      name: 'Città',
      description: 'Le meraviglie delle città italiane',
      cover: '/uploads/photo4.jpg',
    },
  });

  // Create photos
  const photos = [
    {
      title: 'Lago di Como',
      description: 'Il meraviglioso Lago di Como al tramonto, con le montagne che si riflettono sulle acque tranquille',
      filename: 'photo1.jpg',
      filepath: '/uploads/photo1.jpg',
      mimetype: 'image/jpeg',
      size: 146955,
      width: 1024,
      height: 1024,
      tags: 'lago,como,montagne,tramonto,paesaggio',
      albumId: paesaggi.id,
      views: 342,
      favorite: true,
    },
    {
      title: 'Ritratto in Bianco e Nero',
      description: 'Un ritratto artistico in bianco e nero con illuminazione drammatica',
      filename: 'photo2.jpg',
      filepath: '/uploads/photo2.jpg',
      mimetype: 'image/jpeg',
      size: 104466,
      width: 1024,
      height: 1024,
      tags: 'ritratto,bianco e nero,artistico',
      albumId: ritratti.id,
      views: 218,
      favorite: false,
    },
    {
      title: 'Fiori Selvatici',
      description: 'Macro di fiori selvatici colorati in un prato italiano',
      filename: 'photo3.jpg',
      filepath: '/uploads/photo3.jpg',
      mimetype: 'image/jpeg',
      size: 142158,
      width: 1024,
      height: 1024,
      tags: 'fiori,natura,macro,primavera',
      albumId: natura.id,
      views: 156,
      favorite: true,
    },
    {
      title: 'Roma al Tramonto',
      description: 'Il Colosseo illuminato dal tramonto dorato, una vista iconica della Città Eterna',
      filename: 'photo4.jpg',
      filepath: '/uploads/photo4.jpg',
      mimetype: 'image/jpeg',
      size: 170126,
      width: 1024,
      height: 1024,
      tags: 'roma,colosseo,architettura,tramonto',
      albumId: citta.id,
      views: 523,
      favorite: true,
    },
    {
      title: 'Colline Toscane',
      description: 'Le dolci colline toscane con vigneti e cipressi, un paesaggio senza tempo',
      filename: 'photo5.jpg',
      filepath: '/uploads/photo5.jpg',
      mimetype: 'image/jpeg',
      size: 198503,
      width: 1024,
      height: 1024,
      tags: 'toscana,colline,vigneti,cipressi,paesaggio',
      albumId: paesaggi.id,
      views: 287,
      favorite: false,
    },
    {
      title: 'Cinque Terre',
      description: 'Le colorate case di Cinque Terre aggrappate alla scogliera sul Mar Mediterraneo',
      filename: 'photo6.jpg',
      filepath: '/uploads/photo6.jpg',
      mimetype: 'image/jpeg',
      size: 194284,
      width: 1024,
      height: 1024,
      tags: 'cinque terre,liguria,mare,costa,case colorate',
      albumId: paesaggi.id,
      views: 445,
      favorite: true,
    },
    {
      title: 'Farfalla nel Giardino',
      description: 'Una farfalla colorata posata su un fiore in un giardino italiano',
      filename: 'photo7.jpg',
      filepath: '/uploads/photo7.jpg',
      mimetype: 'image/jpeg',
      size: 130791,
      width: 1024,
      height: 1024,
      tags: 'farfalla,macro,natura,giardino',
      albumId: natura.id,
      views: 98,
      favorite: false,
    },
    {
      title: 'Duomo di Firenze',
      description: 'La magnifica cattedrale di Santa Maria del Fiore al crepuscolo',
      filename: 'photo8.jpg',
      filepath: '/uploads/photo8.jpg',
      mimetype: 'image/jpeg',
      size: 196898,
      width: 1024,
      height: 1024,
      tags: 'firenze,duomo,rinascimento,architettura',
      albumId: citta.id,
      views: 367,
      favorite: true,
    },
    {
      title: 'Costiera Amalfitana',
      description: 'La spettacolare Costiera Amalfitana con le sue scogliere a picco sul mare',
      filename: 'photo9.jpg',
      filepath: '/uploads/photo9.jpg',
      mimetype: 'image/jpeg',
      size: 246966,
      width: 1024,
      height: 1024,
      tags: 'amalfi,costa,mare,scogliera,paesaggio',
      albumId: paesaggi.id,
      views: 512,
      favorite: true,
    },
    {
      title: 'Venezia all\'Alba',
      description: 'Una gondola silenziosa sul Canal Grande all\'alba, la magia di Venezia',
      filename: 'photo10.jpg',
      filepath: '/uploads/photo10.jpg',
      mimetype: 'image/jpeg',
      size: 169510,
      width: 1024,
      height: 1024,
      tags: 'venezia,gondola,canale,alba,romantico',
      albumId: citta.id,
      views: 631,
      favorite: true,
    },
    {
      title: 'Ritratto Elegante',
      description: 'Un ritratto elegante in stile vintage con illuminazione da studio',
      filename: 'photo11.jpg',
      filepath: '/uploads/photo11.jpg',
      mimetype: 'image/jpeg',
      size: 105991,
      width: 1024,
      height: 1024,
      tags: 'ritratto,elegante,vintage,fashion',
      albumId: ritratti.id,
      views: 176,
      favorite: false,
    },
    {
      title: 'Dolomiti',
      description: 'Le maestose Dolomiti riflesse in un lago alpino, pura maestà della natura',
      filename: 'photo12.jpg',
      filepath: '/uploads/photo12.jpg',
      mimetype: 'image/jpeg',
      size: 162803,
      width: 1024,
      height: 1024,
      tags: 'dolomiti,montagne,lago,alpi,paesaggio',
      albumId: paesaggi.id,
      views: 428,
      favorite: true,
    },
  ];

  for (const photo of photos) {
    await prisma.photo.create({ data: photo });
  }

  // Create sample comments
  const allPhotos = await prisma.photo.findMany();

  const comments = [
    { text: 'Che spettacolo! I colori del tramonto sono meravigliosi.', author: 'Marco R.' },
    { text: 'Mi ricorda le mie vacanze al lago. Bellissima foto!', author: 'Giulia S.' },
    { text: 'Composizione perfetta, bravissimo!', author: 'Andrea L.' },
    { text: 'Questa foto trasmette così tanta emozione. ❤️', author: 'Sofia M.' },
    { text: 'Dove è stata scattata? Mi piacerebbe visitarla!', author: 'Luca B.' },
    { text: 'La luce è incredibile, sembra un dipinto.', author: 'Elena F.' },
    { text: 'Italia è davvero il paese più bello del mondo!', author: 'Paolo D.' },
    { text: 'Foto stupenda, complimenti per il talento!', author: 'Chiara V.' },
  ];

  // Add 2-3 random comments to each photo
  for (const photo of allPhotos) {
    const numComments = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numComments; i++) {
      const comment = comments[Math.floor(Math.random() * comments.length)];
      await prisma.comment.create({
        data: {
          text: comment.text,
          author: comment.author,
          photoId: photo.id,
        },
      });
    }
  }

  console.log('Seed data created successfully!');
  console.log(`- ${photos.length} photos`);
  console.log(`- 4 albums (Paesaggi, Ritratti, Natura, Città)`);
  console.log(`- Comments added`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
