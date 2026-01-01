# Best Self Journal

A beautiful, feature-rich journaling application for 2026 with cloud sync powered by Supabase.

## Features

- 📅 **Daily Journaling**: Morning gratitude, 3 big targets, hourly timeline, evening reflection
- 📊 **Weekly Habit Tracking**: Track 7 habits across Thursday-to-Wednesday weeks
- 🎯 **13-Week Roadmap**: Set quarterly goals and weekly milestones
- 🌟 **Life Vision**: Define and track 15 long-term life goals
- 📈 **Automated Insights**: Live statistics on habit consistency and peak performance
- ☁️ **Cloud Sync**: All data backed up to Supabase for multi-device access
- 🌓 **Dark Mode**: Toggle between light and dark themes

## Live Demo

Visit: [https://chessdreams.github.io/journal/](https://chessdreams.github.io/journal/)

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/chessdreams/journal.git
cd journal
```

2. Open `index.html` in your browser or use a local server:
```bash
python -m http.server 8000
# or
npx serve
```

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Database**: Supabase (PostgreSQL)
- **Hosting**: GitHub Pages
- **Fonts**: Google Fonts (Inter, Playfair Display)

## Project Structure

```
journal/
├── index.html          # Main HTML structure
├── style.css           # All styling and themes
├── app.js              # Core application logic
├── db.js               # Supabase database service layer
└── README.md           # This file
```

## Features in Detail

### Custom Week Structure
- Weeks start on Thursday (Jan 1, 2026)
- Week 1 = Jan 1-7, Week 2 = Jan 8-14, etc.

### Goal-Aligned Defaults
Pre-seeded with habits and routines aligned with your 2026 vision:
- English Practice
- Swimming/Exercise
- Reading (4 books/month target)
- Chess with Kids
- Family Time
- Financial Review

### Data Persistence
All journal data is stored in Supabase with the following tables:
- `daily_entries` - Daily journal entries
- `habits_master` - Your habit list
- `weekly_habits` - Weekly habit completion tracking
- `roadmap_goals` - 13-week roadmap
- `life_vision` - Long-term life goals
- `monthly_data` - Monthly planner and wellness
- `weekly_strategy` - Weekly milestones and routines

## License

MIT License - feel free to use this for your personal journaling!

## Author

Built with ❤️ for crushing 2026 goals
