# Growth Skills Lab

A comprehensive marketing & growth analytics dashboard with X (Twitter) integration, AI-powered insights, and content generation tools.

![Growth Skills Lab](https://via.placeholder.com/800x400?text=Growth+Skills+Lab)

## Features

### 📊 Analytics Dashboard
- Real-time impressions, likes, followers, and engagement metrics
- Interactive charts (impressions over time, engagement breakdown)
- Top performing posts with detailed breakdowns
- Monetization progress tracker (5M impressions goal)

### 🧠 AI-Powered Insights
- Personalized recommendations based on YOUR data
- Hook type performance analysis
- Optimal posting time identification
- Content focus recommendations
- Priority-based action items

### 📈 Content Analysis
- Content type distribution (threads, tweets, long-form)
- Hook performance comparison
- Posting time heatmap
- Performance matrix with recommendations

### ✨ Content Generator
- Generate content optimized for your audience
- Performance predictions based on historical data
- Quick generate by content type
- Copy-ready output

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/growth-skills-lab.git
cd growth-skills-lab

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
growth-skills-lab/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Charts.jsx    # Recharts visualizations
│   │   ├── Cards.jsx     # Metric cards, insights, posts
│   │   ├── MonetizationTracker.jsx
│   │   └── PostDetailModal.jsx
│   ├── data/             # Data & mock analytics
│   │   ├── mockAnalytics.js
│   │   ├── skills.js
│   │   └── insights.js
│   ├── hooks/            # Custom React hooks
│   │   ├── useAnalytics.js
│   │   └── useFeedback.js
│   ├── pages/            # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Insights.jsx
│   │   ├── ContentAnalysis.jsx
│   │   ├── ContentGenerator.jsx
│   │   └── ConnectPage.jsx
│   ├── utils/            # Helper functions
│   │   └── helpers.js
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Tailwind styles
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Charts & visualizations
- **Lucide React** - Icons
- **date-fns** - Date utilities

## Connecting Real X Analytics

Currently uses mock data. To connect real X analytics:

1. Set up X API v2 credentials
2. Create an OAuth 2.0 flow
3. Replace mock data in `useAnalytics.js` with API calls
4. Store tokens securely

```javascript
// Example API integration
const fetchRealAnalytics = async (accessToken) => {
  const response = await fetch('https://api.twitter.com/2/users/me/tweets', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  return response.json();
};
```

## Customization

### Adding New Insights
Edit `src/data/insights.js`:

```javascript
insights.push({
  id: 'custom-insight',
  type: 'opportunity', // success, warning, opportunity, insight
  icon: YourIcon,
  title: 'Your Insight Title',
  description: 'Description text...',
  action: 'Action button text',
  priority: 'high', // high, medium, low
});
```

### Adding Content Templates
Edit `src/data/skills.js`:

```javascript
export const hookTemplates = {
  yourNewType: [
    "Template 1 with {placeholder}",
    "Template 2...",
  ],
};
```

## License

MIT License - feel free to use for personal or commercial projects.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Built with 💜 for creators who want to grow smarter.
