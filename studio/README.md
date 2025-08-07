# AI Development Workflow Studio (React + TypeScript)

## Architecture Overview

The application follows a feature-based architecture where each feature is self-contained with its own components, models, hooks, and pages.

```
src/
├── app/                     # Application core
│   ├── shared/             # Shared resources across features
│   │   ├── components/     # Reusable UI components
│   │   └── libs/          # Shared utilities and helpers
│   ├── features/          # Feature modules
│   │   └── users/         # Users feature module
│   ├── i18n/             # Internationalization (placeholder)
│   └── HomePage.tsx       # Landing page component
├── assets/               # Static assets
├── environments/         # Environment configurations
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

### Feature Module Structure

Each feature module (e.g., `users`) follows this structure:

```
features/users/
├── components/          # Shared components within the feature
├── models/             # Data models and types
├── hooks/              # Shared React hooks
├── pages/              # Feature pages/routes
│   ├── list-users/     # List page
│   │   ├── components/ # Page-specific components
│   │   ├── models/     # Page-specific models
│   │   └── hooks/      # Page-specific hooks
│   └── create-user/    # Create page
│       ├── components/ # Page-specific components
│       ├── models/     # Page-specific models
│       └── hooks/      # Page-specific hooks
└── users.routes.tsx    # Feature routing configuration
```

### Data Flow

1. **Mock Data**: The application uses generated mock data instead of real API calls
2. **State Management**: Local component state with hooks
3. **API Simulation**: Hooks include delays and error handling to simulate real API behavior

### Routing

Routes are defined in feature-specific route files and composed in the main App component:

- `/` - Homepage
- `/users` - List all users
- `/users/create` - Create new user

### Component Organization

- **Shared components**: Used across multiple features
- **Feature components**: Shared within a single feature
- **Page components**: Specific to a single page

### Tooling

Manipulate the background webserver:

- yarn server:start
- yarn server:stop
- yarn server:restart
- yarn server:log
