# DataAnalyzer Pro - Node.js Backend

This is the Node.js backend for the DataAnalyzer Pro application, migrated from Python FastAPI to provide better hosting platform compatibility.

## Features

- **Analytics Engine**: Comprehensive data analysis with multiple algorithms
- **Real-time Processing**: WebSocket support for live data streaming
- **Advanced Analytics**: Time series analysis, anomaly detection, correlation analysis
- **Forecasting**: Multiple forecasting methods with confidence intervals
- **Text Analysis**: Sentiment analysis, summarization, and key phrase extraction
- **Industry-specific Insights**: Custom analytics for different industries
- **RESTful API**: Clean, documented API endpoints
- **Input Validation**: Robust request validation using Joi
- **Error Handling**: Comprehensive error handling and logging

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **WebSocket**: ws library
- **Validation**: Joi
- **Statistics**: simple-statistics, ml-matrix, ml-regression
- **Text Processing**: natural
- **Security**: helmet, cors
- **Logging**: morgan

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend-node
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:8000` (or the port specified in your `.env` file).

## API Endpoints

### Core Analytics

- `POST /api/analyze` - Perform data analysis
- `POST /api/predict` - Generate predictions
- `POST /api/detect-anomalies` - Detect anomalies in data

### Advanced Analytics

- `POST /api/advanced/correlation` - Correlation analysis
- `POST /api/advanced/forecast` - Advanced forecasting
- `POST /analyze/summarize` - Text analysis and summarization

### Health Checks

- `GET /api/health` - Main health check
- `GET /api/analyze/health` - Analytics service health
- `GET /api/predict/health` - Prediction service health
- `GET /api/detect-anomalies/health` - Anomaly detection health

### WebSocket

- `ws://localhost:8000` - WebSocket endpoint for real-time communication

## API Usage Examples

### Basic Data Analysis

```javascript
const response = await fetch('http://localhost:8000/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    data: [
      { name: 'revenue', value: 1000, type: 'number' },
      { name: 'customers', value: 50, type: 'number' },
      { name: 'industry', value: 'technology', type: 'text' }
    ],
    analysis_type: 'industry',
    parameters: {
      industry: 'technology'
    }
  })
});

const result = await response.json();
```

### Time Series Forecasting

```javascript
const response = await fetch('http://localhost:8000/api/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    data: [100, 120, 140, 160, 180],
    horizon: 5,
    confidence: 0.95
  })
});

const result = await response.json();
```

### Anomaly Detection

```javascript
const response = await fetch('http://localhost:8000/api/detect-anomalies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    data: [10, 12, 15, 8, 20, 11, 13, 9, 25, 12],
    threshold: 0.95,
    method: 'zscore'
  })
});

const result = await response.json();
```

### Text Analysis

```javascript
const response = await fetch('http://localhost:8000/analyze/summarize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    texts: [
      "This is a great product that exceeded all my expectations. The quality is outstanding and the customer service was excellent."
    ]
  })
});

const result = await response.json();
```

## WebSocket Usage

```javascript
const ws = new WebSocket('ws://localhost:8000');

ws.onopen = function() {
  console.log('Connected to WebSocket');
  
  // Send a message
  ws.send(JSON.stringify({
    type: 'analysis_request',
    data: [1, 2, 3, 4, 5]
  }));
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onclose = function() {
  console.log('Disconnected from WebSocket');
};
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8000` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `info` |

### CORS Configuration

The backend is configured to accept requests from the frontend URL specified in `FRONTEND_URL`. For production, update this to your actual frontend domain.

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### Project Structure

```
backend-node/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── env.example           # Environment variables template
├── routes/               # API route handlers
│   ├── analytics.js      # Analytics endpoints
│   ├── predictions.js    # Prediction endpoints
│   ├── anomalies.js      # Anomaly detection endpoints
│   ├── correlation.js    # Correlation analysis endpoints
│   ├── forecast.js       # Advanced forecasting endpoints
│   └── textAnalysis.js   # Text analysis endpoints
├── services/             # Business logic
│   └── analyticsEngine.js    # Main analytics engine
└── README.md             # This file
```

## Migration from Python

This Node.js backend is a direct migration from the Python FastAPI backend. Key changes:

1. **Framework**: FastAPI → Express.js
2. **WebSocket**: FastAPI WebSocket → ws library
3. **Validation**: Pydantic → Joi
4. **Statistics**: NumPy/SciPy → simple-statistics/ml-matrix
5. **Text Processing**: NLTK/TextBlob → natural
6. **Async**: Python async/await → Node.js async/await

All API endpoints maintain the same request/response structure for seamless frontend integration.

## Deployment

### Production Setup

1. **Set environment variables:**
   ```bash
   NODE_ENV=production
   PORT=8000
   FRONTEND_URL=https://your-frontend-domain.com
   ```

2. **Install production dependencies:**
   ```bash
   npm ci --only=production
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
```

### Hosting Platforms

This Node.js backend is compatible with:
- Vercel
- Netlify Functions
- Railway
- Heroku
- DigitalOcean App Platform
- AWS Lambda (with serverless framework)
- Google Cloud Run

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the `PORT` environment variable
2. **CORS errors**: Update `FRONTEND_URL` in your environment variables
3. **Memory issues**: Increase Node.js memory limit with `--max-old-space-size=4096`

### Logs

The server uses Morgan for HTTP request logging. Check the console output for detailed request/response information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 