import { promises as fs } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'watchlist.json');

async function readWatchlist() {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeWatchlist(data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const watchlist = await readWatchlist();
    res.status(200).json(watchlist);
  } else if (req.method === 'POST') {
    const newItem = req.body;
    const watchlist = await readWatchlist();
    const exists = watchlist.some((item) => item.id === newItem.id);
    if (exists) {
      res.status(400).json({ error: 'Item already in watchlist' });
      return;
    }
    watchlist.push({ ...newItem, added_at: new Date().toISOString() });
    await writeWatchlist(watchlist);
    res.status(200).json({ message: 'Item added to watchlist' });
  } else if (req.method === 'PUT') {
    const updatedItem = req.body;
    const watchlist = await readWatchlist();
    const index = watchlist.findIndex((item) => item.id === updatedItem.id);
    if (index === -1) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    watchlist[index] = updatedItem;
    await writeWatchlist(watchlist);
    res.status(200).json({ message: 'Item updated' });
  } else if (req.method === 'DELETE') {
    const { id } = req.body;
    const watchlist = await readWatchlist();
    const updatedWatchlist = watchlist.filter((item) => item.id !== id);
    if (updatedWatchlist.length === watchlist.length) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    await writeWatchlist(updatedWatchlist);
    res.status(200).json({ message: 'Item deleted' });
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
