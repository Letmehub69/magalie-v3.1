# IRIELLE — Base44 Master Prompt
## Lot 1 — Pages 001 à 030

**How to use this document:** Copy everything between `BEGIN BASE44 PROMPT` and `END BASE44 PROMPT` into Base44. Use Base44 Plan/Discuss mode first if available. Do not ask Base44 to build every advanced feature in one shot; this first lot tells Base44 to create the foundation, roadmap, data model, Superagent brain, MVP screens, and the first runnable version.

---

# BEGIN BASE44 PROMPT

You are Base44 acting as a senior product architect, senior full-stack engineer, AI agent engineer, mobile-first UX designer, security engineer, and technical product manager.

We are building a product called **Irielle**.

Irielle is a futuristic personal AI command center inspired by the idea of a Jarvis-like assistant: conversational, voice-capable, memory-enabled, proactive, tool-using, and able to take useful actions through apps, messaging channels, CLI, desktop, and mobile workflows.

Important truth rule:
- Do not claim that Irielle is a literal conscious AGI.
- Do not claim that Irielle has emotions, sentience, or human awareness.
- The product may use the brand phrase “AGI-like personal assistant” or “super assistant,” but all technical documentation must be honest: Irielle is a powerful agentic AI application that uses LLMs, tools, memory, automation, and permissions.
- Build real working features first. Do not fake capabilities.

The core goal:
Create the first production-minded foundation for Irielle on Base44, with a Base44 web app, mobile-responsive app experience, Superagent/AI agent layer, backend functions, persistent data, OpenAI integration, app-user permissions, audit logs, and a roadmap for companion CLI/mobile/desktop builds.

The first deliverable must be an MVP foundation, not the final fantasy version.

The final long-term vision:
Irielle will become a cross-platform personal AI operating layer:
- Web app on Base44
- Mobile-first app/PWA experience
- Messaging channel access such as WhatsApp, Telegram, LINE, or iMessage where supported
- A CLI companion for macOS, Windows, and Linux
- A future desktop companion app
- A central AI brain powered primarily by OpenAI GPT models through a secure API connection
- A modular skill/tool system
- Long-term memory
- Notes, tasks, projects, files, automations, and daily briefings
- Human approval for risky actions
- Full audit logging
- Strong privacy and security posture

Do not copy OpenClaw source code, branding, proprietary flows, or design. Instead, use the same general architectural idea: a gateway-like personal assistant that can receive commands from multiple channels, route them to an AI brain, apply permissions, use tools, and return useful results. Irielle must be its own product, with its own identity, architecture, data model, UI, and safety model.

---

## PAGE 001 — Product Identity

Product name: **Irielle**

Product tagline options:
1. “Your personal AI command center.”
2. “A private AI assistant that remembers, plans, and acts.”
3. “An AGI-like operating layer for your digital life.”
4. “Your voice, tasks, memory, and tools in one intelligent system.”

Use tagline 1 for the MVP unless a better UI fit appears.

Product personality:
- Calm
- Precise
- Loyal to the user’s goals
- Technically sharp
- Discreet
- Slightly witty when appropriate
- Never cringe
- Never overdramatic
- Never pretending to be conscious

The assistant persona inside the app is also named **Irielle**.

Default language:
- App interface: French-first, with English as a future setting.
- Internal developer documentation: English.
- Assistant response style: adapt to the user’s language; if the user writes French, answer in French.

Product category:
- Personal AI command center
- Superagent dashboard
- Memory-enabled productivity agent
- AI automation hub
- Future CLI/mobile/desktop assistant

Primary user:
A power user, creator, founder, developer, or ambitious individual who wants a personal AI assistant that can organize their life, remember their projects, execute tasks safely, and eventually interact with tools across devices.

---

## PAGE 002 — Core Promise

Irielle should help the user:
1. Think better.
2. Plan faster.
3. Remember important context.
4. Manage tasks and notes.
5. Organize projects.
6. Summarize information.
7. Draft messages and documents.
8. Use AI tools safely.
9. Connect to services through approved connectors.
10. Control actions through a permission layer.

MVP promise:
“Irielle is a private AI command center where you can chat with your assistant, save memories, manage tasks, organize notes/projects, and prepare automations with safe approvals.”

Long-term promise:
“Irielle becomes the AI layer between you and your digital world: mobile, terminal, desktop, messages, files, calendar, email, and workflows.”

Do not build all long-term promise features immediately. Build the foundation and mark future features clearly.

---

## PAGE 003 — Non-Negotiable Technical Truths

Base44 should build what it can build natively now:
- Web app
- Mobile-responsive UI
- Authentication
- Roles and permissions
- Data entities
- AI agent/Superagent configuration where supported
- Backend functions
- Integrations/connectors where supported
- Hosting
- Admin dashboard
- Settings
- Secure secrets storage if available

For features outside Base44’s native scope, create:
- Placeholder architecture
- Roadmap pages
- Integration docs
- Export-to-GitHub instructions
- CLI companion design
- API contract specs
- Future mobile/native app plan

Do not pretend the CLI, native iOS app, Android app, or desktop app exists until it exists.

For terminal download:
- MVP should include a page called “CLI Companion” with installation plan and API-token flow.
- Future build should provide a Node.js/TypeScript CLI package called `irielle`.
- Example future commands:
  - `irielle login`
  - `irielle chat "plan my day"`
  - `irielle task add "Call supplier"`
  - `irielle memory add "I prefer Python for backend prototypes"`
  - `irielle status`
  - `irielle doctor`
- The Base44 app should include a user API token management screen for future CLI use.

---

## PAGE 004 — Base44 Build Strategy

Use an incremental product build strategy.

First build:
1. Main app shell.
2. Authenticated user dashboard.
3. Chat interface for Irielle.
4. Persistent conversation history.
5. Task manager.
6. Notes manager.
7. Memory manager.
8. Project manager.
9. Approval center.
10. Audit log.
11. Settings.
12. OpenAI connection settings.
13. Superagent brain documentation and configuration where available.
14. Roadmap page for CLI/mobile/desktop.

Do not overload the first build with too many third-party integrations.

The first build should be usable without connecting Gmail, Google Calendar, Slack, GitHub, WhatsApp, Telegram, or iMessage.

Create connector stubs and permissions architecture so those services can be added later.

Use clear labels:
- “Available now”
- “Coming next”
- “Requires connector”
- “Requires approval”
- “Requires CLI companion”
- “Requires external API key”

---

## PAGE 005 — Visual Direction

Design style:
- Futuristic command center
- Premium dark mode by default
- Glassmorphism panels
- Subtle aurora gradients
- High contrast readable typography
- Bento-grid layout for dashboard cards
- Clean sidebar navigation
- Smooth but not distracting transitions
- Mobile-first responsive behavior

Do not make it childish or too sci-fi. It should feel like a real pro tool.

Color direction:
- Deep charcoal / near-black background
- Soft blue, violet, and cyan accents
- Neutral cards
- Green only for successful confirmations
- Amber for warnings
- Red for dangerous actions

Core UI metaphor:
Irielle is not just a chat window. It is a command center with:
- Chat
- Memory
- Tasks
- Projects
- Notes
- Approvals
- Automations
- Tools
- Audit log
- Settings

---

## PAGE 006 — Main Navigation

Create these main navigation sections:

1. **Command Center**
2. **Chat with Irielle**
3. **Tasks**
4. **Notes**
5. **Memory**
6. **Projects**
7. **Automations**
8. **Approvals**
9. **Tools**
10. **CLI Companion**
11. **Settings**
12. **Admin / Audit**

---

## PAGE 007 — Platform Vision

Irielle must support web, mobile web/PWA, CLI companion, desktop companion, and messaging gateway tracks with clear MVP vs future boundaries.

---

## PAGE 008 — MVP User Journey

MVP journey must include login, command center, chat, task/memory/project creation, settings with OpenAI status, CLI companion docs, and roadmap visibility.

---

## PAGE 009 — User Roles

MVP can implement Owner-only while keeping schema extensible for Trusted Assistant User and Read-only Viewer.

---

## PAGE 010 — Data Entities Overview

Create entities:
- UserProfile
- Conversation
- Message
- Memory
- Task
- Note
- Project
- ToolDefinition
- ToolCall
- ApprovalRequest
- AuditLog
- Automation
- ApiToken
- IntegrationConnection

(Use the field list from the master spec when implementing in Base44.)

---

## PAGE 011 to PAGE 030

Implement all requirements from the master prompt specification provided by product:
- Memory system rules and UI controls
- Task/notes/projects requirements
- Chat capabilities + mock mode fallback
- Irielle Core agent + intents + risk levels
- Approval center and audit system
- OpenAI secure configuration
- Tool registry and backend functions
- CLI companion architecture
- Mobile safety/UX constraints
- Gateway-inspired future architecture
- Automations model + sample
- System prompt and response behavior
- First build checklist, sample data, and acceptance criteria

Important final instruction:
After building in Base44, summarize exactly:
1. What is implemented now,
2. What is mock/stub/future,
3. What needs OpenAI configuration,
4. What next prompt should request for Lot 2.

# END BASE44 PROMPT

---

## Notes après Lot 1

Le Lot 1 sert à créer la fondation complète dans Base44. Le prochain lot doit renforcer le cerveau Irielle avec OpenAI, mémoire contextuelle, mode Superagent, connecteurs, et premières automatisations.
