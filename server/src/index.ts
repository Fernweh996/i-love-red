import express from 'express';
import cors from 'cors';
import path from 'path';
import { fundSearchRouter } from './routes/fund-search';
import { fundEstimateRouter } from './routes/fund-estimate';
import { fundHistoryRouter } from './routes/fund-history';
import { fundHoldingsRouter } from './routes/fund-holdings';
import { stockRealtimeRouter } from './routes/stock-realtime';
import { uploadRouter } from './routes/upload';
import { errorHandler } from './middleware/error-handler';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/fund/search', fundSearchRouter);
app.use('/api/fund/estimate', fundEstimateRouter);
app.use('/api/fund/history', fundHistoryRouter);
app.use('/api/fund/holdings', fundHoldingsRouter);
app.use('/api/stock/realtime', stockRealtimeRouter);
app.use('/api/upload', uploadRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend static files (production)
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
// SPA fallback: any non-API route → index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Fund Manager running on http://localhost:${PORT}`);
});
