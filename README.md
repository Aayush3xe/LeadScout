🚀 LeadScout AI: Autonomous SDR & Lead Qualifier
Stop wasting hours on manual vetting. Turn raw URLs into qualified sales intelligence instantly.

💡 The Problem
Lead Generation agencies struggle with "Data Noise." Traditional scrapers provide thousands of rows of data, but humans still have to spend days "eye-balling" websites to see if a company is actually a fit for their clients.

✅ The Solution
LeadScout is an AI-powered engine that "reads" the web. It uses headless browser automation to visit prospect sites, understands their business model via LLM analysis, and delivers a structured "Fit Score" and reasoning—automating the most tedious part of the sales funnel.

🛠 Features & Workflow
1. Intelligent Job Management
Create targeted "Scan Jobs" with specific business goals. Support for Manual Entry or Bulk Paste of up to 50 URLs per batch.

2. Deep-Site Scraping (Playwright)
LeadScout doesn't just look at the homepage. It navigates through "About Us" and "Services" pages to gather deep context that hidden meta-tags often miss.

3. Qualitative AI Analysis (Gemini 1.5 Flash)
The AI evaluates every prospect against complex criteria:

Industry Niche: (e.g., "Is this an independent financial advisor?")

Regulatory Compliance: (e.g., "Is this firm FSCA-regulated?")

Service Match: (e.g., "Do they offer retirement planning?")

Location: (e.g., "Are they based in Gauteng/Johannesburg?")

4. Real-Time Dashboard
Track your scan's progress with a live Fit Rate percentage, Confidence Score distribution, and real-time status updates.

5. High-Fidelity Exports
One-click CSV export that includes the AI Reasoning. This allows sales teams to open a call with: "I see you specialize in FSCA-regulated wealth management in Midrand..." rather than a cold script.

🏗 Technical Stack
Backend: Python 3.x (Asyncio)

Automation: Playwright (Headless Chromium)

Intelligence: Google Gemini 1.5 Flash API

Frontend: Built with Hercules (React-based UI)

Data Handling: Pandas & CSV structured logging

🚀 Installation & Local Setup
Clone the Repo:

Bash
git clone https://github.com/Aayush3xe/LeadScout.git
cd LeadScout
Install Dependencies:

Bash
pip install -r requirements.txt
playwright install chromium
Configure Environment:
Create a .env file and add your API Key:

Code snippet
GEMINI_API_KEY=your_google_gemini_key
Run the App:

Bash
python main.py



run in browser,https://leadscoutmodel.onhercules.app/
👤 Author
Aayush3xe

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
