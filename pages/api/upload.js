import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// Uploads go straight to Filebase's IPFS bucket. This runs server-side only:
// the S3-style credentials can sign arbitrary bucket writes, so they must
// never reach the browser.
export const config = {
  api: {
    bodyParser: false,
  },
};

const readRawBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

const s3 = new S3Client({
  endpoint: 'https://s3.filebase.com',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.FILEBASE_ACCESS_KEY_ID,
    secretAccessKey: process.env.FILEBASE_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await readRawBody(req);
    const fileName = decodeURIComponent(req.headers['x-filename'] || `upload-${Date.now()}`);
    const contentType = req.headers['content-type'] || 'application/octet-stream';
    const key = `${Date.now()}-${fileName}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.FILEBASE_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));

    const head = await s3.send(new HeadObjectCommand({
      Bucket: process.env.FILEBASE_BUCKET,
      Key: key,
    }));

    const cid = head.Metadata?.cid;

    if (!cid) {
      throw new Error('Filebase did not return a CID for the uploaded object.');
    }

    return res.status(200).json({ cid, url: `https://ipfs.filebase.io/ipfs/${cid}` });
  } catch (error) {
    console.error('Error uploading to Filebase.', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
